import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DataTableVirtualizedOptions } from "./data-table-virtualized.js";
import type { DataTableProps } from "./data-table.js";
import { DataTable } from "./data-table.js";

interface Row {
  id: string;
  name: string;
  count: number;
}

/** A fixture deterministic by index (discovery's EC-2 — no faker, no random). */
const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `row-${i}`, name: `Item ${i}`, count: i }));

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "count", label: "Count" },
];

/** A synthetic rect — the pattern from react-virtual's own tests (injected via an option). */
const syntheticRect = (height: number, width = 800): DataTableVirtualizedOptions =>
  ({
    height,
    rowHeight: 40,
    overscan: 5,
    virtualizerOptions: {
      observeElementRect: (
        _instance: unknown,
        cb: (rect: { width: number; height: number }) => void,
      ) => {
        cb({ width, height });
        return () => {};
      },
    },
  }) as DataTableVirtualizedOptions;

/** Shared base for the type-level/runtime-conflict tests (a lesson from the quality hook). */
const virtualBase = () => ({
  columns: COLUMNS,
  data: makeRows(5),
  rowKey: (r: Row) => r.id,
  virtualized: syntheticRect(400),
});

function renderVirtualized(rows: Row[], extra: Partial<DataTableProps<Row>> = {}) {
  return render(
    <DataTable<Row>
      columns={COLUMNS}
      data={rows}
      rowKey={(r) => r.id}
      virtualized={syntheticRect(400)}
      {...(extra as object)}
    />,
  );
}

const bodyRows = (container: HTMLElement) =>
  container.querySelectorAll(
    '[data-slot="data-table-virtual-body"] tbody tr:not([data-slot^="data-table-virtual-spacer"])',
  );

describe("DataTable virtualized — window and anatomy", () => {
  it("test_virtualized_renders_exact_window_of_10k", () => {
    const { container } = renderVirtualized(makeRows(10_000));
    const rows = bodyRows(container);
    // viewport 400 / rowHeight 40 = 10 visible + up to 2×overscan(5); never all 10,000
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.length).toBeLessThanOrEqual(25);
    expect(container.textContent).toContain("Item 0");
    expect(container.textContent).not.toContain("Item 100");
  });

  it("test_virtualized_spacers_sum_to_total_size", () => {
    // F-dom-1/2: spacer rows grow the <table>'s layout box to the whole dataset (a sticky
    // thead works; the last row is reachable) — top + window + bottom == total
    const { container } = renderVirtualized(makeRows(10_000));
    const top = container.querySelector('[data-slot="data-table-virtual-spacer-top"]');
    const bottom = container.querySelector(
      '[data-slot="data-table-virtual-spacer-bottom"]',
    ) as HTMLElement;
    const windowPx = bodyRows(container).length * 40;
    const topPx = top ? Number.parseFloat((top as HTMLElement).style.height) : 0;
    expect(topPx + windowPx + Number.parseFloat(bottom.style.height)).toBe(10_000 * 40);
  });

  it("test_virtualized_rows_in_flow_with_fixed_height_and_overscan", () => {
    const { container } = renderVirtualized(makeRows(10_000));
    const rows = bodyRows(container);
    const first = rows[0] as HTMLElement;
    // spacer technique: rows IN FLOW, no transform; fixed height
    expect(first.style.transform).toBe("");
    expect(first.style.height).toBe("40px");
    // overscan honoured (F-tests-2): Item 14 (inside the trailing overscan) is present
    expect(container.textContent).toContain("Item 14");
    expect(rows.length).toBeGreaterThanOrEqual(15);
  });

  it("test_virtualized_preserves_semantic_table", () => {
    const { container } = renderVirtualized(makeRows(50));
    const scope = container.querySelector('[data-slot="data-table-virtual-body"]');
    expect(scope?.querySelector("table")).not.toBeNull();
    expect(scope?.querySelector("thead")).not.toBeNull();
    expect(scope?.querySelector("tbody tr td")).not.toBeNull();
    const scroll = scope?.querySelector('[data-slot="data-table-virtual-scroll"]') as HTMLElement;
    expect(scroll.style.height).toBe("400px");
  });

  it("test_virtualized_sticky_header_class", () => {
    const { container } = renderVirtualized(makeRows(50));
    const thead = container.querySelector('[data-slot="data-table-virtual-body"] thead');
    expect(thead?.className).toContain("sticky");
    expect(thead?.className).toContain("top-0");
  });

  it("test_virtualized_sort_reorders_within_window", () => {
    const { container } = renderVirtualized(makeRows(100));
    expect(bodyRows(container)[0]?.textContent).toContain("Item 0");
    const nameHeader = Array.from(container.querySelectorAll("th button, th")).find((el) =>
      el.textContent?.includes("Name"),
    ) as HTMLElement;
    fireEvent.click(nameHeader.querySelector("button") ?? nameHeader);
    fireEvent.click(nameHeader.querySelector("button") ?? nameHeader); // asc → desc
    const rows = bodyRows(container);
    // POSITIVE oracle (F-tests-3): desc by string over makeRows(100) → "Item 99" first
    expect(rows[0]?.textContent).toContain("Item 99");
    expect(rows.length).toBeLessThanOrEqual(25);
  });
});

describe("DataTable virtualized — edges e negatives", () => {
  it("test_virtualized_zero_rows_shows_empty_state", () => {
    const { container } = renderVirtualized([]);
    expect(container.textContent).toContain("No data");
    expect(bodyRows(container)).toHaveLength(0);
  });

  it("test_virtualized_single_row_renders", () => {
    const { container } = renderVirtualized(makeRows(1));
    expect(bodyRows(container)).toHaveLength(1);
  });

  it("test_virtualized_dataset_smaller_than_viewport_renders_all", () => {
    // EC-1 edge: 3 rows in a 400px viewport → all of them, with no NaN
    const { container } = renderVirtualized(makeRows(3));
    expect(bodyRows(container)).toHaveLength(3);
    // dataset < viewport: nothing offscreen → no spacers (or zero-height spacers)
    const bottom = container.querySelector('[data-slot="data-table-virtual-spacer-bottom"]');
    expect(bottom).toBeNull();
  });

  it("test_virtualized_invalid_row_height_dev_warning", () => {
    // EC-2 negative: rowHeight 0 → warn + fallback sem crash
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <DataTable<Row> {...virtualBase()} virtualized={{ ...syntheticRect(400), rowHeight: 0 }} />,
    );
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("rowHeight"));
    warn.mockRestore();
  });

  it("test_virtualized_invalid_row_height_still_renders_rows", () => {
    // F-tests-5: the "the fallback works" half — clamping to 1px still renders a window
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(
      <DataTable<Row> {...virtualBase()} virtualized={{ ...syntheticRect(400), rowHeight: 0 }} />,
    );
    expect(
      container.querySelectorAll('[data-slot="data-table-virtual-body"] tbody tr').length,
    ).toBeGreaterThan(0);
    warn.mockRestore();
  });

  it("test_virtualized_rejects_pagination_at_type_level", () => {
    // @ts-expect-error — virtualized + pagination is inexpressible (discriminated union)
    const props: DataTableProps<Row> = { ...virtualBase(), pagination: { pageSize: 10 } };
    expect(props).toBeDefined();
  });

  it("test_virtualized_rejects_expandable_at_type_level", () => {
    // @ts-expect-error — virtualized + expandable is inexpressible (discriminated union)
    const props: DataTableProps<Row> = { ...virtualBase(), expandable: () => null };
    expect(props).toBeDefined();
  });

  it("test_virtualized_dev_warning_on_runtime_conflict", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const untyped = {
      ...virtualBase(),
      pagination: { pageSize: 10 },
    } as unknown as DataTableProps<Row>;
    render(<DataTable<Row> {...untyped} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("pagination"));
    warn.mockRestore();
  });

  it("test_virtualized_aria_rowcount_and_rowindex", () => {
    // F-dom-4: only ~20 of 10,000 tr exist in the DOM — a screen reader needs the real total
    const { container } = renderVirtualized(makeRows(10_000));
    const table = container.querySelector('[data-slot="data-table-virtual-body"] table');
    expect(table?.getAttribute("aria-rowcount")).toBe(String(10_000 + 1));
    const first = bodyRows(container)[0];
    expect(first?.getAttribute("aria-rowindex")).toBe("2");
  });

  it("test_virtualized_scroll_region_is_keyboard_focusable", () => {
    // F-dom-5: WCAG 2.1.1 — a scrollable region operable by keyboard
    const { container } = renderVirtualized(makeRows(100));
    const scroll = container.querySelector('[data-slot="data-table-virtual-scroll"]');
    expect(scroll?.getAttribute("tabindex")).toBe("0");
    expect(scroll?.tagName).toBe("SECTION"); // an implicit region role
    expect(scroll?.getAttribute("aria-label")).toBeTruthy();
  });

  it("test_virtualized_row_actions_render_in_window", () => {
    // F-wire-2: rowActions exercised in the VIRTUAL body
    const { container } = renderVirtualized(makeRows(50), {
      rowActions: () => <span>act</span>,
    } as Partial<DataTableProps<Row>>);
    const triggers = container.querySelectorAll(
      '[data-slot="data-table-virtual-body"] [aria-label="Row actions"]',
    );
    expect(triggers.length).toBeGreaterThan(0);
  });

  it("test_default_mode_untouched_snapshot", () => {
    // without `virtualized`, NO virtual container appears — the default mode is intact
    const { container } = render(
      <DataTable<Row> columns={COLUMNS} data={makeRows(5)} rowKey={(r) => r.id} />,
    );
    expect(container.querySelector('[data-slot="data-table-virtual-body"]')).toBeNull();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });
});

describe("DataTable virtualized — story smoke", () => {
  it("test_virtualized_10k_story_renders_window", async () => {
    // The story does NOT inject a rect (a real browser measures on its own); in jsdom the
    // viewport is 0 → 0 rows is the honest answer here. The smoke proves: 10K mount without
    // crashing, the sizer is dimensioned for the whole dataset, and NEVER 10,000 tr in the DOM.
    // The exact window with an injected rect is pinned in test_virtualized_renders_exact_window_of_10k.
    const { Virtualized10K } = await import("./data-table.stories.js");
    const { container } = render(<Virtualized10K />);
    const bottom = container.querySelector(
      '[data-slot="data-table-virtual-spacer-bottom"]',
    ) as HTMLElement;
    // jsdom with no rect: 0 items in the window → the bottom spacer covers the WHOLE dataset
    expect(Number.parseFloat(bottom.style.height)).toBeGreaterThanOrEqual(10_000 * 40 - 40 * 30);
    const rows = container.querySelectorAll('[data-slot="data-table-virtual-body"] tbody tr');
    expect(rows.length).toBeLessThan(100);
  });
});

describe("DataTable virtualized — barrel", () => {
  it("test_barrel_exports_virtualized_type", async () => {
    const barrel = await import("../../../index.js");
    // the type compiles through the barrel (used in a literal) and DataTable is the same symbol
    const opts: import("../../../index.js").DataTableVirtualizedOptions = {
      height: 400,
      rowHeight: 40,
    };
    expect(opts.rowHeight).toBe(40);
    expect(barrel.DataTable).toBe(DataTable);
  });
});
