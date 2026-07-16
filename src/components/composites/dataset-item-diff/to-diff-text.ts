/**
 * Pure normalizers for dataset-item snapshots (M14 ADR D3). Turns each field
 * (input / expectedOutput / metadata), whose value is `unknown`, into the plain
 * text a `DiffView` diffs. No React, no I/O; total and deterministic.
 */

/** A dataset item version. Fields are optional so absent ones can be omitted. */
export interface DatasetItemSnapshot {
  input: unknown;
  expectedOutput?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Stringify a field value for diffing: a string passes through unchanged;
 * `undefined`/`null` become ""; anything else is pretty-printed JSON. Keeping
 * strings raw avoids wrapping user text in quotes/escapes in the diff.
 */
export function fieldToText(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

/**
 * True when a field is present on either side — the caller renders a section
 * only for present fields, omitting one absent in BOTH items honestly.
 */
export function fieldPresent(a: unknown, b: unknown): boolean {
  return (a !== undefined && a !== null) || (b !== undefined && b !== null);
}
