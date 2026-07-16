/**
 * Pure line-level diff via Longest Common Subsequence (M14 ADR D1 — zero
 * dependency, keeps the registry copy-pasteable; no `diff`/`@pierre/diffs`).
 * Suitable for the design-system case (prompts / JSON, < ~500 lines);
 * O(n·m) time. A row is `eq` (unchanged), `del` (only in old), or `add`
 * (only in new). Line numbers are honest: `del` has no rightNo, `add` has no
 * leftNo. Deterministic, total — never throws.
 */

export type DiffRowKind = "eq" | "del" | "add";

export interface DiffRow {
  kind: DiffRowKind;
  text: string;
  /** 1-based line number in the old text (absent for `add`). */
  leftNo?: number;
  /** 1-based line number in the new text (absent for `del`). */
  rightNo?: number;
}

/** Split into lines, treating "" as zero lines (not one empty line). */
function toLines(text: string): string[] {
  return text === "" ? [] : text.split("\n");
}

/**
 * Diff `oldText` against `newText` at line granularity. Returns the aligned
 * sequence of rows (eq / del / add) in reading order. `del` before `add` when a
 * line is replaced.
 */
export function diffLines(oldText: string, newText: string): DiffRow[] {
  const a = toLines(oldText);
  const b = toLines(newText);
  const n = a.length;
  const m = b.length;

  // LCS length table: lcs[i][j] = LCS of a[i:] and b[j:]. Every access is
  // within [0..n]×[0..m] by construction; the local `row`/`next` captures both
  // satisfy `noUncheckedIndexedAccess` and read cleaner than nested indexing.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    const row = lcs[i] as number[];
    const next = lcs[i + 1] as number[];
    for (let j = m - 1; j >= 0; j--) {
      row[j] =
        a[i] === b[j]
          ? (next[j + 1] as number) + 1
          : Math.max(next[j] as number, row[j + 1] as number);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    const ai = a[i] as string;
    const bj = b[j] as string;
    if (ai === bj) {
      rows.push({ kind: "eq", text: ai, leftNo: i + 1, rightNo: j + 1 });
      i++;
      j++;
      continue;
    }
    // Prefer the deletion when it keeps the LCS at least as long (matches the
    // eq/del/add reading order: del before add when a line is replaced).
    const skipA = (lcs[i + 1] as number[])[j] as number;
    const skipB = (lcs[i] as number[])[j + 1] as number;
    if (skipA >= skipB) {
      rows.push({ kind: "del", text: ai, leftNo: i + 1 });
      i++;
    } else {
      rows.push({ kind: "add", text: bj, rightNo: j + 1 });
      j++;
    }
  }
  while (i < n) {
    rows.push({ kind: "del", text: a[i] as string, leftNo: i + 1 });
    i++;
  }
  while (j < m) {
    rows.push({ kind: "add", text: b[j] as string, rightNo: j + 1 });
    j++;
  }
  return rows;
}
