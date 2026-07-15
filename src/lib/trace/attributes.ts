/**
 * Pure grouping of OTel span attributes by namespace (the prefix before the
 * first `.`). Keys without a dot fall into the `general` namespace. Total —
 * never throws; deterministic insertion order preserved within a group.
 */

export interface AttributeGroup {
  namespace: string;
  entries: Array<[string, unknown]>;
}

/** Group attribute entries by their dotted-key namespace, sorted by namespace name. */
export function groupByNamespace(attrs: Record<string, unknown>): AttributeGroup[] {
  const buckets = new Map<string, Array<[string, unknown]>>();
  for (const [key, value] of Object.entries(attrs)) {
    const dot = key.indexOf(".");
    const ns = dot > 0 ? key.slice(0, dot) : "general";
    let bucket = buckets.get(ns);
    if (!bucket) {
      bucket = [];
      buckets.set(ns, bucket);
    }
    bucket.push([key, value]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([namespace, entries]) => ({ namespace, entries }));
}
