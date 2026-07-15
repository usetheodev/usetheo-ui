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

  // LCS length table: lcs[i][j] = LCS of a[i:] and b[j:].
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows: DiffRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      rows.push({ kind: "eq", text: a[i], leftNo: i + 1, rightNo: j + 1 });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ kind: "del", text: a[i], leftNo: i + 1 });
      i++;
    } else {
      rows.push({ kind: "add", text: b[j], rightNo: j + 1 });
      j++;
    }
  }
  while (i < n) {
    rows.push({ kind: "del", text: a[i], leftNo: i + 1 });
    i++;
  }
  while (j < m) {
    rows.push({ kind: "add", text: b[j], rightNo: j + 1 });
    j++;
  }
  return rows;
}
