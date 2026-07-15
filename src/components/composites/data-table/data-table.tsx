"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { EmptyState } from "../../primitives/empty-state/index.js";
import { Pagination } from "../../primitives/pagination/index.js";
import { Table } from "../../primitives/table/index.js";
import { DataTableLoading } from "./data-table-loading.js";
import {
  DataTableHeaderRow,
  DataTableRowActionsCell,
  renderCellContent,
} from "./data-table-parts.js";
import type { DataTableVirtualizedOptions } from "./data-table-virtualized.js";
import { DataTableVirtualizedBody } from "./data-table-virtualized.js";
import { useDataTableSort } from "./use-data-table-sort.js";

/**
 * DataTable — generic, sortable, expandable composite over `<Table>`.
 *
 * Adds operator-grade entity-list patterns on top of the plain Table
 * primitive: sortable headers, sticky header, expandable rows
 * (multi-row by default), row action menus (Dropdown), client-side
 * pagination, loading skeleton rows, empty state. Both sort and
 * pagination support controlled OR uncontrolled mode (consumer
 * passes onSortChange / onPageChange to take over state).
 *
 * `virtualized` mode (M6) renders 10K+ rows over @tanstack/react-virtual.
 * It is mutually exclusive with `pagination` and `expandable` at the type
 * level — a virtualized list is one continuous scroll of fixed-height rows.
 *
 * @example
 *   <DataTable
 *     columns={[
 *       { key: "name", label: "Name", sortable: true },
 *       { key: "status", label: "Status" },
 *     ]}
 *     data={domains}
 *     rowKey={(d) => d.id}
 *     expandable={(d) => d.status === "pending" ? <DnsRecords domain={d} /> : null}
 *     rowActions={(d) => (
 *       <>
 *         <DropdownMenu.Item onSelect={() => editDomain(d)}>Edit</DropdownMenu.Item>
 *         <DropdownMenu.Item onSelect={() => deleteDomain(d)}>Delete</DropdownMenu.Item>
 *       </>
 *     )}
 *   />
 */
export interface DataTableColumn<T> {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableSort {
  key: string;
  direction: "asc" | "desc";
}

interface DataTableBaseProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  stickyHeader?: boolean;
  rowActions?: (row: T) => ReactNode;
  defaultSort?: DataTableSort;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  className?: string;
}

/**
 * Discriminated union: the default mode keeps pagination/expandable; the
 * virtualized mode excludes them at the type level (fixed-height single
 * scroll — see DataTableVirtualizedOptions for the documented limitations).
 */
export type DataTableProps<T> = DataTableBaseProps<T> &
  (
    | {
        virtualized?: never;
        expandable?: (row: T) => ReactNode | null;
        expandMode?: "single" | "multiple";
        pagination?: {
          pageSize: number;
          controlledPage?: number;
          onPageChange?: (page: number) => void;
        } | null;
      }
    | {
        virtualized: DataTableVirtualizedOptions;
        expandable?: never;
        expandMode?: never;
        pagination?: never;
      }
  );

function DataTable<T>(props: DataTableProps<T>): ReactNode {
  if (props.virtualized) {
    return <DataTableVirtualizedBody {...props} virtualized={props.virtualized} />;
  }
  return <DataTableDefaultBody {...props} />;
}

function DataTableDefaultBody<T>(props: DataTableProps<T>): ReactNode {
  const {
    data,
    columns,
    rowKey,
    stickyHeader = true,
    expandable,
    expandMode = "multiple",
    rowActions,
    pagination,
    defaultSort,
    sort: controlledSort,
    onSortChange,
    loading = false,
    emptyState,
    className,
  } = props;

  const isControlledPage = pagination?.controlledPage !== undefined;
  const [uncontrolledPage, setUncontrolledPage] = useState(0);
  const currentPage = isControlledPage ? (pagination?.controlledPage ?? 0) : uncontrolledPage;

  // EC-9: clamp pageSize to >= 1 to avoid divide-by-zero / infinite render
  const effectivePageSize = Math.max(1, pagination?.pageSize ?? 10);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { sort, handleSort, sortedData } = useDataTableSort({
    data,
    columns,
    defaultSort,
    sort: controlledSort,
    onSortChange,
    // EC-8: sort change resets pagination to page 0
    onUncontrolledSortChange: () => {
      if (!isControlledPage) setUncontrolledPage(0);
    },
  });

  function handlePageChange(page: number) {
    // Pagination uses 1-indexed; internal state 0-indexed
    const zeroIdx = page - 1;
    if (isControlledPage) {
      pagination?.onPageChange?.(zeroIdx);
    } else {
      setUncontrolledPage(zeroIdx);
    }
  }

  function toggleExpand(key: string) {
    if (expandMode === "single") {
      setExpanded((prev) => (prev.has(key) ? new Set() : new Set([key])));
    } else {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    }
  }

  // Apply client-side pagination in uncontrolled mode
  const visibleData = useMemo(() => {
    if (!pagination) return sortedData;
    if (isControlledPage) return sortedData; // consumer pre-sliced
    const start = currentPage * effectivePageSize;
    return sortedData.slice(start, start + effectivePageSize);
  }, [sortedData, pagination, isControlledPage, currentPage, effectivePageSize]);

  // EC-1 fix: compute colSpan accounting for chevron + actions columns
  const extraCols = (expandable ? 1 : 0) + (rowActions ? 1 : 0);
  const expandedColSpan = columns.length + extraCols;

  // Loading state (EC-7: loading > empty)
  if (loading) {
    return (
      <DataTableLoading
        columns={columns}
        hasExpandColumn={expandable !== undefined}
        hasActionsColumn={rowActions !== undefined}
        stickyHeader={stickyHeader}
        className={className}
      />
    );
  }

  // Empty state (after loading check)
  if (sortedData.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {emptyState ?? <EmptyState title="No data" description="There's nothing here yet." />}
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(sortedData.length / effectivePageSize) : 1;

  return (
    <div className={cn("w-full", className)}>
      <Table>
        <Table.Header className={stickyHeader ? "sticky top-0 z-10 bg-card" : undefined}>
          <DataTableHeaderRow
            columns={columns}
            sort={sort}
            onSortClick={handleSort}
            hasExpandColumn={expandable !== undefined}
            hasActionsColumn={rowActions !== undefined}
          />
        </Table.Header>
        <Table.Body>
          {visibleData.map((row) => {
            const key = rowKey(row);
            const expandedContent = expandable ? expandable(row) : null;
            const isExpandable = expandedContent !== null && expandedContent !== undefined;
            const isExpanded = expanded.has(key);
            return (
              <Fragment key={key}>
                <Table.Row>
                  {expandable ? (
                    <Table.Cell>
                      {isExpandable ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(key)}
                          aria-expanded={isExpanded}
                          aria-controls={`expanded-${key}`}
                          aria-label={isExpanded ? "Collapse row" : "Expand row"}
                          className="inline-flex items-center justify-center rounded-md p-0.5 hover:bg-muted"
                        >
                          {isExpanded ? (
                            <ChevronDown aria-hidden="true" className="size-4" />
                          ) : (
                            <ChevronRight aria-hidden="true" className="size-4" />
                          )}
                        </button>
                      ) : null}
                    </Table.Cell>
                  ) : null}
                  {columns.map((col) => (
                    <Table.Cell key={col.key} align={col.align} className={col.className}>
                      {renderCellContent(row, col)}
                    </Table.Cell>
                  ))}
                  {rowActions ? (
                    <DataTableRowActionsCell>{rowActions(row)}</DataTableRowActionsCell>
                  ) : null}
                </Table.Row>
                {isExpanded && isExpandable ? (
                  <tr id={`expanded-${key}`}>
                    <td colSpan={expandedColSpan} className="bg-muted/30 p-4">
                      {expandedContent}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table>
      {pagination && totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-end">
          <Pagination
            currentPage={currentPage + 1}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      ) : null}
    </div>
  );
}

export { DataTable };
