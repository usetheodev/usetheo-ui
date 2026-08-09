import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DiffView as DiffViewFromBarrel } from "../../../index.js";
import { DiffView } from "./diff-view.js";

const rows = (container: HTMLElement, kind: "add" | "del" | "eq") =>
  container.querySelectorAll(`[data-diff="${kind}"]`);

const OLD = "line one\nline two\nline three";
const NEW = "line one\nline TWO\nline three\nline four";

describe("DiffView", () => {
  it("renders one content cell per DiffRow (split)", () => {
    // old(3) vs new(4): eq(1) + del(1) + add(1) + eq(1) + add(1) = 5 diff rows
    const { container } = render(<DiffView oldText={OLD} newText={NEW} />);
    const total =
      rows(container, "eq").length + rows(container, "add").length + rows(container, "del").length;
    expect(total).toBe(5);
  });

  it("an added line has a textual '+' marker and data-diff='add'", () => {
    const { container } = render(<DiffView oldText="a" newText="a\nb" />);
    const add = rows(container, "add");
    expect(add.length).toBeGreaterThanOrEqual(1);
    expect(add[0]?.textContent).toContain("+");
  });

  it("a removed line has a textual '-' marker and data-diff='del'", () => {
    const { container } = render(<DiffView oldText="a\nb" newText="a" />);
    const del = rows(container, "del");
    expect(del.length).toBeGreaterThanOrEqual(1);
    expect(del[0]?.textContent).toContain("-");
  });

  it("split mode has two columns (old | new)", () => {
    const { container } = render(<DiffView oldText={OLD} newText={NEW} mode="split" />);
    const table = screen.getByRole("table");
    expect(table.getAttribute("data-mode")).toBe("split");
    // two labeled content columns (old + new)
    const sides = container.querySelectorAll('thead th[data-slot="diff-view-side"]');
    expect(sides).toHaveLength(2);
  });

  it("unified mode is inline (marks single-column through data-mode)", () => {
    const { container } = render(<DiffView oldText={OLD} newText={NEW} mode="unified" />);
    expect(screen.getByRole("table").getAttribute("data-mode")).toBe("unified");
    // unified has one content column, not two labeled sides
    const sides = container.querySelectorAll('thead th[data-slot="diff-view-side"]');
    expect(sides).toHaveLength(1);
  });

  it("identical texts → the honest 'No changes' empty state", () => {
    const { container } = render(<DiffView oldText={OLD} newText={OLD} />);
    const empty = container.querySelectorAll('[data-slot="diff-view-empty"]');
    expect(empty).toHaveLength(1);
    expect(empty[0]?.textContent).toMatch(/no changes/i);
  });

  it("expõe role=table", () => {
    render(<DiffView oldText={OLD} newText={NEW} oldLabel="v1" newLabel="v2" />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLTableElement>();
    render(<DiffView oldText={OLD} newText={NEW} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("diff-view");
  });

  it("is exported from the root barrel", () => {
    expect(DiffViewFromBarrel).toBe(DiffView);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <DiffView oldText={OLD} newText={NEW} oldLabel="Old" newLabel="New" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = render(<DiffView oldText={OLD} newText={OLD} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
