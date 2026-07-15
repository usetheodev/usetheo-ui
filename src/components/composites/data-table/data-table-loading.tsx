import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Skeleton } from "../../primitives/skeleton/index.js";
import { Table } from "../../primitives/table/index.js";
import type { DataTableColumn } from "./data-table.js";

/** Skeleton state shared by both DataTable modes (extracted — 300-line hook floor). */
export function DataTableLoading<T>(props: {
  columns: DataTableColumn<T>[];
  hasExpandColumn: boolean;
  hasActionsColumn: boolean;
  stickyHeader: boolean;
  className?: string;
}): ReactNode {
  const { columns, hasExpandColumn, hasActionsColumn, stickyHeader, className } = props;
  const totalCols = columns.length + (hasExpandColumn ? 1 : 0) + (hasActionsColumn ? 1 : 0);
  return (
    <div data-slot="data-table" className={cn("w-full", className)}>
      <Table>
        <Table.Header className={stickyHeader ? "sticky top-0 bg-card" : undefined}>
          <Table.Row>
            {hasExpandColumn ? (
              <Table.HeaderCell>
                <span className="sr-only">Expand</span>
              </Table.HeaderCell>
            ) : null}
            {columns.map((col) => (
              <Table.HeaderCell key={col.key} align={col.align}>
                {col.label}
              </Table.HeaderCell>
            ))}
            {hasActionsColumn ? (
              <Table.HeaderCell>
                <span className="sr-only">Actions</span>
              </Table.HeaderCell>
            ) : null}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: 5 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are positional placeholders
            <Table.Row key={`skeleton-${i}`}>
              {Array.from({ length: totalCols }, (_, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells are positional placeholders
                <Table.Cell key={`s-${i}-${j}`}>
                  <Skeleton className="h-4 w-full" />
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
