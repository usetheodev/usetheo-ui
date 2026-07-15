import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { toTranscriptRows } from "../../../lib/trace/flatten.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { NESTED_TRACE, makeTrace } from "../../../test/fixtures/trace.js";
import { TraceTranscript } from "./index.js";

const props = (over: Partial<React.ComponentProps<typeof TraceTranscript>> = {}) => ({
  root: NESTED_TRACE,
  selectedId: "root" as string | null,
  onSelect: () => {},
  ...over,
});

describe("TraceTranscript", () => {
  it("test_renderiza_uma_linha_por_span", () => {
    const { container } = render(<TraceTranscript {...props()} />);
    const spanRows = container.querySelectorAll('[data-slot="transcript-span"]');
    const expected = toTranscriptRows(NESTED_TRACE).filter((r) => r.kind === "span").length;
    expect(spanRows).toHaveLength(expected);
  });

  it("test_mostra_badge_de_role_por_linha", () => {
    render(<TraceTranscript {...props()} />);
    // NESTED_TRACE root has attributes.gen_ai.operation.name=chat, kind derived; names shown
    expect(screen.getByText("llm.plan")).toBeInTheDocument();
  });

  it("test_group_header_colapsa_subtree", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
      return (
        <TraceTranscript
          root={NESTED_TRACE}
          selectedId="root"
          onSelect={() => {}}
          collapsedGroups={collapsed}
          onToggleGroup={(id) =>
            setCollapsed((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            })
          }
        />
      );
    }
    render(<Controlled />);
    // root fans out to 3 children → a group header; collapsing it hides descendant span rows.
    expect(screen.getByText("llm.plan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /collapse group/i }));
    expect(screen.queryByText("llm.plan")).toBeNull();
  });

  it("test_clicar_na_linha_dispara_onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TraceTranscript {...props({ onSelect })} />);
    await user.click(screen.getByText("llm.plan"));
    expect(onSelect).toHaveBeenCalledWith("plan");
  });

  it("test_acima_do_threshold_virtualiza", () => {
    const { container } = render(
      <TraceTranscript {...props({ root: makeTrace(250), virtualizeThreshold: 200 })} />,
    );
    expect(container.querySelector('[data-slot="trace-transcript-virtual"]')).toBeInTheDocument();
  });

  it("test_rows_vazias_mostram_empty_state", () => {
    render(
      <TraceTranscript
        root={{ id: "x", parentId: null, name: "x" }}
        selectedId={null}
        onSelect={() => {}}
        rows={[]}
      />,
    );
    expect(screen.getByText(/no transcript/i)).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<TraceTranscript {...props()} />);
  });
});
