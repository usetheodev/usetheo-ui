import { useMemo, useState } from "react";
import { compareValues } from "./compare-values.js";
import type { DataTableColumn, DataTableSort } from "./data-table.js";

/**
 * Shared controlled/uncontrolled sort state for both DataTable modes.
 * Cycle: none → asc → desc → none. Client-side sorting applies only in
 * uncontrolled mode (controlled consumers pre-sort their data).
 */
export function useDataTableSort<T>(opts: {
  data: T[];
  columns: DataTableColumn<T>[];
  defaultSort?: DataTableSort;
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;
  /** Fired on uncontrolled sort change (EC-8: page reset in paginated mode). */
  onUncontrolledSortChange?: () => void;
}) {
  const { data, columns, defaultSort, sort: controlledSort, onSortChange } = opts;
  const isControlledSort = onSortChange !== undefined;
  const [uncontrolledSort, setUncontrolledSort] = useState<DataTableSort | null>(
    defaultSort ?? null,
  );
  const sort = isControlledSort ? (controlledSort ?? null) : uncontrolledSort;

  function handleSort(columnKey: string) {
    let nextSort: DataTableSort | null;
    if (sort?.key !== columnKey) {
      nextSort = { key: columnKey, direction: "asc" };
    } else if (sort.direction === "asc") {
      nextSort = { key: columnKey, direction: "desc" };
    } else {
      nextSort = null;
    }
    if (isControlledSort) {
      onSortChange?.(nextSort);
    } else {
      setUncontrolledSort(nextSort);
      opts.onUncontrolledSortChange?.();
    }
  }

  const sortedData = useMemo(() => {
    if (isControlledSort || sort === null) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    const sorted = [...data].sort((a, b) => {
      const aVal = col.render
        ? null
        : (a as Record<string, unknown>)[sort.key as keyof T as string];
      const bVal = col.render
        ? null
        : (b as Record<string, unknown>)[sort.key as keyof T as string];
      const cmp = compareValues(aVal, bVal);
      return sort.direction === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [data, sort, isControlledSort, columns]);

  return { sort, handleSort, sortedData };
}
