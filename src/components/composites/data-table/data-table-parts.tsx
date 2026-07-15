import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { DropdownMenu } from "../../primitives/dropdown-menu/index.js";
import { Table } from "../../primitives/table/index.js";
import type { DataTableColumn, DataTableSort } from "./data-table.js";

/** Header row shared by the default and virtualized DataTable bodies. */
export function DataTableHeaderRow<T>(props: {
  columns: DataTableColumn<T>[];
  sort: DataTableSort | null;
  onSortClick: (columnKey: string) => void;
  hasExpandColumn?: boolean;
  hasActionsColumn?: boolean;
}): ReactNode {
  const { columns, sort, onSortClick, hasExpandColumn = false, hasActionsColumn = false } = props;
  return (
    <Table.Row>
      {hasExpandColumn ? (
        <Table.HeaderCell>
          <span className="sr-only">Expand</span>
        </Table.HeaderCell>
      ) : null}
      {columns.map((col) => {
        const isSortable = col.sortable === true;
        const isActive = sort?.key === col.key;
        return (
          <Table.HeaderCell
            key={col.key}
            align={col.align}
            onSort={isSortable ? () => onSortClick(col.key) : undefined}
            sortDirection={isSortable ? (isActive ? sort?.direction : "none") : undefined}
            style={col.width ? { width: col.width } : undefined}
          >
            {col.label}
          </Table.HeaderCell>
        );
      })}
      {hasActionsColumn ? (
        <Table.HeaderCell>
          <span className="sr-only">Actions</span>
        </Table.HeaderCell>
      ) : null}
    </Table.Row>
  );
}

/** Row-actions dropdown cell shared by both DataTable bodies. */
export function DataTableRowActionsCell(props: { children: ReactNode }): ReactNode {
  return (
    <Table.Cell align="right">
      <DropdownMenu>
        <DropdownMenu.Trigger
          aria-label="Row actions"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-md",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">{props.children}</DropdownMenu.Content>
      </DropdownMenu>
    </Table.Cell>
  );
}

/** Renders a body cell's content per column definition (shared by both bodies). */
export function renderCellContent<T>(row: T, col: DataTableColumn<T>): ReactNode {
  return col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "");
}
