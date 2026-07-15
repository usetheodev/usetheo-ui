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

/** Fixture determinística por índice (EC-2 do discovery — sem faker/random). */
const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ id: `row-${i}`, name: `Item ${i}`, count: i }));

const COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "count", label: "Count" },
];

/** Rect sintético — padrão dos testes oficiais do react-virtual (injeção via option). */
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

/** Base compartilhada dos testes type-level/runtime-conflict (lição do quality hook). */
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
  container.querySelectorAll('[data-slot="data-table-virtual-body"] tbody tr');

describe("DataTable virtualized — janela e anatomia", () => {
  it("test_virtualized_renders_exact_window_of_10k", () => {
    const { container } = renderVirtualized(makeRows(10_000));
    const rows = bodyRows(container);
    // viewport 400 / rowHeight 40 = 10 visíveis + até 2×overscan(5); nunca as 10.000
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(rows.length).toBeLessThanOrEqual(25);
    expect(container.textContent).toContain("Item 0");
    expect(container.textContent).not.toContain("Item 100");
  });

  it("test_virtualized_sizer_reflects_total_size", () => {
    const { container } = renderVirtualized(makeRows(10_000));
    const sizer = container.querySelector('[data-slot="data-table-virtual-sizer"]');
    expect((sizer as HTMLElement).style.height).toBe(`${10_000 * 40}px`);
  });

  it("test_virtualized_rows_positioned_by_corrected_translate", () => {
    const { container } = renderVirtualized(makeRows(10_000));
    const first = bodyRows(container)[0] as HTMLElement;
    // padrão do exemplo oficial: tr em fluxo com translateY(start − index*size);
    // no topo do scroll a correção zera — pina a PRESENÇA da fórmula
    expect(first.style.transform).toBe("translateY(0px)");
    expect(first.style.height).toBe("40px");
  });

  it("test_virtualized_preserves_semantic_table", () => {
    const { container } = renderVirtualized(makeRows(50));
    const scope = container.querySelector('[data-slot="data-table-virtual-body"]');
    expect(scope?.querySelector("table")).not.toBeNull();
    expect(scope?.querySelector("thead")).not.toBeNull();
    expect(scope?.querySelector("tbody tr td")).not.toBeNull();
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
    expect(rows[0]?.textContent).not.toContain("Item 0");
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
    // EC-1 edge: 3 rows num viewport de 400px → todas, sem NaN
    const { container } = renderVirtualized(makeRows(3));
    expect(bodyRows(container)).toHaveLength(3);
    const sizer = container.querySelector('[data-slot="data-table-virtual-sizer"]') as HTMLElement;
    expect(sizer.style.height).toBe(`${3 * 40}px`);
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

  it("test_virtualized_rejects_pagination_at_type_level", () => {
    // @ts-expect-error — virtualized + pagination é inexpressável (união discriminada)
    const props: DataTableProps<Row> = { ...virtualBase(), pagination: { pageSize: 10 } };
    expect(props).toBeDefined();
  });

  it("test_virtualized_rejects_expandable_at_type_level", () => {
    // @ts-expect-error — virtualized + expandable é inexpressável (união discriminada)
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

  it("test_default_mode_untouched_snapshot", () => {
    // sem `virtualized`, NENHUM container virtual aparece — modo padrão intacto
    const { container } = render(
      <DataTable<Row> columns={COLUMNS} data={makeRows(5)} rowKey={(r) => r.id} />,
    );
    expect(container.querySelector('[data-slot="data-table-virtual-body"]')).toBeNull();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });
});

describe("DataTable virtualized — story smoke", () => {
  it("test_virtualized_10k_story_renders_window", async () => {
    // A story NÃO injeta rect (browser real mede sozinho); em jsdom o viewport
    // é 0 → 0 linhas é o honesto aqui. O smoke prova: 10K montam sem crash,
    // sizer dimensionado para o dataset inteiro e NUNCA 10.000 tr no DOM. A
    // janela exata com rect injetado é pinada em test_virtualized_renders_exact_window_of_10k.
    const { Virtualized10K } = await import("./data-table.stories.js");
    const { container } = render(<Virtualized10K />);
    const sizer = container.querySelector('[data-slot="data-table-virtual-sizer"]') as HTMLElement;
    expect(sizer.style.height).toBe(`${10_000 * 40}px`);
    const rows = container.querySelectorAll('[data-slot="data-table-virtual-body"] tbody tr');
    expect(rows.length).toBeLessThan(100);
  });
});
