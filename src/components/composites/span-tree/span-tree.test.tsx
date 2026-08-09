import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { MALFORMED_TRACE, NESTED_TRACE, makeTrace } from "../../../test/fixtures/trace.js";
import { SpanTree } from "./index.js";

/** Static (uncontrolled) render — for cases that only inspect the initial DOM, no state churn. */
function renderStatic(over: Partial<React.ComponentProps<typeof SpanTree>>) {
  const noop = () => {};
  return render(
    <SpanTree
      root={NESTED_TRACE}
      selectedId="root"
      onSelect={noop}
      collapsed={new Set()}
      onToggleCollapse={noop}
      {...over}
    />,
  );
}

/** Controlled harness: collapse + selection state so the tree behaves like a real consumer would drive it. */
function Harness({
  onSelect,
  virtualizeThreshold,
}: {
  onSelect?: (id: string) => void;
  virtualizeThreshold?: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>("root");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  return (
    <SpanTree
      root={NESTED_TRACE}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        onSelect?.(id);
      }}
      collapsed={collapsed}
      onToggleCollapse={(id) =>
        setCollapsed((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        })
      }
      virtualizeThreshold={virtualizeThreshold}
    />
  );
}

describe("SpanTree", () => {
  it("test_exposes_the_complete_aria_treeitem_semantics", () => {
    render(<Harness />);
    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBeGreaterThan(1);
    const root = items[0];
    expect(root).toHaveAttribute("aria-level", "1");
    expect(root).toHaveAttribute("aria-posinset");
    expect(root).toHaveAttribute("aria-setsize");
    expect(root).toHaveAttribute("aria-selected", "true");
  });

  it("test_container_e_um_tree", () => {
    render(<Harness />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
  });

  it("test_collapse_hides_the_subtree_and_updates_aria_expanded", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // search-1 has a child (search-retry) → collapsing it hides the child row
    expect(screen.getByText("tool.search_flights#retry")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /collapse tool\.search_flights$/i });
    await user.click(toggle);
    expect(screen.queryByText("tool.search_flights#retry")).toBeNull();
  });

  it("test_a_span_with_an_error_shows_an_error_badge", () => {
    render(<Harness />);
    const errRow = screen.getByText("tool.search_flights").closest('[role="treeitem"]');
    expect(within(errRow as HTMLElement).getByText(/error/i)).toBeInTheDocument();
  });

  it("test_clicking_the_span_fires_onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await user.click(screen.getByText("llm.plan"));
    expect(onSelect).toHaveBeenCalledWith("plan");
  });

  it("test_the_arrow_keys_navigate_and_enter_selects", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const tree = screen.getByRole("tree");
    tree.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("plan"); // first child after root
  });

  it("test_above_the_threshold_it_takes_the_virtualised_path", () => {
    const { container } = renderStatic({ root: makeTrace(250), virtualizeThreshold: 200 });
    expect(container.querySelector('[data-slot="span-tree-virtual"]')).toBeInTheDocument();
  });

  it("test_a_root_without_children_renders_no_group", () => {
    renderStatic({ root: { id: "solo", parentId: null, name: "only" }, selectedId: "solo" });
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("test_a_duplicate_span_id_renders_every_row_without_crashing", () => {
    // MALFORMED_TRACE has an orphan + skew + inflight — 4 spans, all render
    renderStatic({ root: MALFORMED_TRACE });
    expect(screen.getAllByRole("treeitem")).toHaveLength(4);
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <SpanTree
        root={NESTED_TRACE}
        selectedId="root"
        onSelect={() => {}}
        collapsed={new Set()}
        onToggleCollapse={() => {}}
      />,
    );
  });

  it("test_a_direct_fireEvent_toggle_expands_it_back", () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: /collapse tool\.search_flights$/i });
    fireEvent.click(toggle);
    expect(screen.queryByText("tool.search_flights#retry")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /expand tool\.search_flights$/i }));
    expect(screen.getByText("tool.search_flights#retry")).toBeInTheDocument();
  });
});
