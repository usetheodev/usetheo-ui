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
import type { DataTableColumn, DataTableSort } from "./data-table.js";
import { useDataTableSort } from "./use-data-table-sort.js";

/**
 * Virtualized body of DataTable — renders 10K+ rows over @tanstack/react-virtual
 * (blueprint M6, ADR D1/D2). Semantic `<table>` preserved: rows stay IN FLOW
 * with the official example's corrected translate — translateY(start − index*size)
 * — because a `<tr>` translates from its natural tbody position, not the sizer top.
 *
 * Limitations (documented contract — mutually exclusive at the type level):
 * no pagination, no expandable rows (fixed row heights are required by
 * estimateSize). Cell content must fit `rowHeight` (use `truncate`). A row-action
 * dropdown unmounts when its row leaves the overscan window.
 */
export interface DataTableVirtualizedOptions {
  /** Scroll container height (px or CSS length). */
  height: number | string;
  /** Fixed row height in px — required by the virtualizer's estimateSize. */
  rowHeight: number;
  /** Rows rendered beyond the viewport on each side. @default 5 */
  overscan?: number;
  /** @internal test-only — inject virtualizer options (e.g. observeElementRect). */
  virtualizerOptions?: Partial<VirtualizerOptions<HTMLDivElement, Element>>;
}

export interface DataTableVirtualizedBodyProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  virtualized: DataTableVirtualizedOptions;
  rowActions?: (row: T) => ReactNode;
  defaultSort?: DataTableSort;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

const EXCLUSIVE_PROPS = ["pagination", "expandable"] as const;

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

  const parentRef = useRef<HTMLDivElement>(null);
  const { sort, handleSort, sortedData } = useDataTableSort({
    data,
    columns,
    defaultSort,
    sort: controlledSort,
    onSortChange,
  });

  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: virtualized.overscan ?? 5,
    ...virtualized.virtualizerOptions,
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

  return (
    <div data-slot="data-table-virtual-body" className={cn("w-full", className)}>
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: virtualized.height }}
        data-slot="data-table-virtual-scroll"
      >
        <div
          data-slot="data-table-virtual-sizer"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          <Table>
            <Table.Header className="sticky top-0 z-10 bg-card">
              <DataTableHeaderRow
                columns={columns}
                sort={sort}
                onSortClick={handleSort}
                hasActionsColumn={rowActions !== undefined}
              />
            </Table.Header>
            <Table.Body>
              {virtualizer.getVirtualItems().map((vRow, index) => {
                const row = sortedData[vRow.index] as T;
                return (
                  <Table.Row
                    key={rowKey(row)}
                    style={{
                      height: `${rowHeight}px`,
                      // official-example correction: a tr translates from its
                      // natural flow position, so subtract index*size
                      transform: `translateY(${vRow.start - index * rowHeight}px)`,
                    }}
                  >
                    {columns.map((col) => (
                      <Table.Cell key={col.key} align={col.align} className={col.className}>
                        {renderCellContent(row, col)}
                      </Table.Cell>
                    ))}
                    {rowActions ? (
                      <DataTableRowActionsCell>{rowActions(row)}</DataTableRowActionsCell>
                    ) : null}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      </div>
    </div>
  );
}
