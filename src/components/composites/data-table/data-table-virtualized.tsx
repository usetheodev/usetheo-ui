import { useVirtualizer } from "@tanstack/react-virtual";
import type { VirtualizerOptions } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { isDev } from "../../../lib/env.js";
import { EmptyState } from "../../primitives/empty-state/index.js";
import { Table } from "../../primitives/table/index.js";
import { DataTableLoading } from "./data-table-loading.js";
import {
  DataTableHeaderRow,
  DataTableRowActionsCell,
  renderCellContent,
} from "./data-table-parts.js";
import type { DataTableBaseProps } from "./data-table.js";
import { useDataTableSort } from "./use-data-table-sort.js";

/**
 * Virtualized body of DataTable — renders 10K+ rows over @tanstack/react-virtual
 * (blueprint M6, ADR D1/D2 + review fix F-dom-1). Semantic `<table>` preserved
 * with the SPACER-ROW technique: two fixed-height spacer `<tr>`s grow the
 * table's real layout box to the full dataset height, so the sticky `<thead>`
 * keeps its containing block for the whole scroll and the last row stays
 * reachable — per-row transforms (the official example's pattern) do NOT grow
 * the layout box and un-stick the header after ~one window.
 *
 * Limitations (documented contract — mutually exclusive at the type level):
 * no pagination, no expandable rows (fixed row heights are required by
 * estimateSize). Cell content must fit `rowHeight` (cells are clipped with
 * reduced padding; keep rowHeight >= ~32px). A row-action dropdown unmounts
 * when its row leaves the overscan window.
 */
export interface DataTableVirtualizedOptions {
  /** Scroll container height (px or CSS length). */
  height: number | string;
  /** Fixed row height in px — required by the virtualizer's estimateSize. */
  rowHeight: number;
  /** Rows rendered beyond the viewport on each side. @default 5 */
  overscan?: number;
  /** @internal test-only — inject virtualizer options (e.g. observeElementRect). */
  virtualizerOptions?: Partial<VirtualizerOptions<HTMLElement, Element>>;
}

export type DataTableVirtualizedBodyProps<T> = Omit<DataTableBaseProps<T>, "stickyHeader"> & {
  virtualized: DataTableVirtualizedOptions;
};

const EXCLUSIVE_PROPS = ["pagination", "expandable"] as const;

function SpacerRow(props: { slot: "top" | "bottom"; height: number; colSpan: number }) {
  if (props.height <= 0) return null;
  return (
    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: spacer row is pure layout filler (no content, no interaction) inside a semantic table; presentation keeps SRs on the aria-rowcount contract
    <tr
      data-slot={`data-table-virtual-spacer-${props.slot}`}
      role="presentation"
      style={{ height: `${props.height}px` }}
    >
      <td colSpan={props.colSpan} style={{ padding: 0 }} />
    </tr>
  );
}

export function DataTableVirtualizedBody<T>(props: DataTableVirtualizedBodyProps<T>): ReactNode {
  const {
    data,
    columns,
    rowKey,
    virtualized,
    rowActions,
    defaultSort,
    sort: controlledSort,
    onSortChange,
    loading = false,
    emptyState,
    className,
  } = props;

  if (isDev()) {
    for (const key of EXCLUSIVE_PROPS) {
      if ((props as unknown as Record<string, unknown>)[key]) {
        // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for mutually-exclusive modes.
        console.warn(
          `DataTable: \`${key}\` is ignored in virtualized mode — the modes are mutually exclusive.`,
        );
      }
    }
    if (virtualized.rowHeight < 1) {
      // biome-ignore lint/suspicious/noConsole: dev-only diagnostic for invalid rowHeight (EC-2).
      console.warn("DataTable: virtualized.rowHeight must be >= 1px — falling back to 1.");
    }
  }
  // EC-2: guard against divide-by-zero window math from untyped consumers
  const rowHeight = Math.max(1, virtualized.rowHeight);

  const parentRef = useRef<HTMLElement>(null);
  const { sort, handleSort, sortedData } = useDataTableSort({
    data,
    columns,
    defaultSort,
    sort: controlledSort,
    onSortChange,
  });

  const virtualizer = useVirtualizer({
    // Injection first (review F-dom-6): the @internal test hook can add
    // observeElementRect but can never override the core window contract.
    ...virtualized.virtualizerOptions,
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: virtualized.overscan ?? 5,
  });

  if (loading) {
    return (
      <DataTableLoading
        columns={columns}
        hasExpandColumn={false}
        hasActionsColumn={rowActions !== undefined}
        stickyHeader
        className={className}
      />
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {emptyState ?? <EmptyState title="No data" description="There's nothing here yet." />}
      </div>
    );
  }

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const paddingTop = firstItem ? firstItem.start : 0;
  const paddingBottom = lastItem ? totalSize - lastItem.end : totalSize;
  const colSpan = columns.length + (rowActions ? 1 : 0);

  return (
    <div data-slot="data-table-virtual-body" className={cn("w-full", className)}>
      <section
        ref={parentRef}
        // WCAG 2.1.1 (review F-dom-5): a scrollable region must be reachable
        // and operable by keyboard; <section> + aria-label = implicit region role.
        aria-label="Table scroll area"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 / axe scrollable-region-focusable — a keyboard user must be able to focus and scroll the region
        tabIndex={0}
        className="overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ height: virtualized.height }}
        data-slot="data-table-virtual-scroll"
      >
        <Table aria-rowcount={sortedData.length + 1}>
          <Table.Header className="sticky top-0 z-10 bg-card">
            <DataTableHeaderRow
              columns={columns}
              sort={sort}
              onSortClick={handleSort}
              hasActionsColumn={rowActions !== undefined}
            />
          </Table.Header>
          <Table.Body>
            <SpacerRow slot="top" height={paddingTop} colSpan={colSpan} />
            {items.map((vRow) => {
              const row = sortedData[vRow.index] as T;
              return (
                <Table.Row
                  key={rowKey(row)}
                  aria-rowindex={vRow.index + 2}
                  style={{ height: `${rowHeight}px` }}
                >
                  {columns.map((col) => (
                    <Table.Cell
                      key={col.key}
                      align={col.align}
                      className={cn("overflow-hidden py-1.5", col.className)}
                    >
                      {renderCellContent(row, col)}
                    </Table.Cell>
                  ))}
                  {rowActions ? (
                    <DataTableRowActionsCell>{rowActions(row)}</DataTableRowActionsCell>
                  ) : null}
                </Table.Row>
              );
            })}
            <SpacerRow slot="bottom" height={paddingBottom} colSpan={colSpan} />
          </Table.Body>
        </Table>
      </section>
    </div>
  );
}
