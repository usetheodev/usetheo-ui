/**
 * Pure, total structural alignment + metric aggregation for comparing two
 * traces. Never throws (cycle-guarded), never does I/O. Deltas are honest: a
 * span present in only one trace has NO delta (never a fabricated 1:1 diff).
 */

import { aggregateCost } from "./cost.js";
import { durationMs, isSpanError } from "./duration.js";
import { flattenAll } from "./flatten.js";
import type { TraceSpan } from "./types.js";

export interface TraceMetrics {
  durationMs: number | null;
  totalTokens: number;
  costUsd: number;
  hasError: boolean;
  spanCount: number;
}

/** Aggregate whole-trace metrics: root duration, summed tokens/cost, any-error flag. Total. */
export function traceMetrics(root: TraceSpan): TraceMetrics {
  const all = flattenAll(root);
  let totalTokens = 0;
  let hasError = false;
  for (const s of all) {
    totalTokens += (s.inputTokens ?? 0) + (s.outputTokens ?? 0);
    if (isSpanError(s.status)) hasError = true;
  }
  return {
    durationMs: durationMs(root),
    totalTokens,
    costUsd: aggregateCost(root),
    hasError,
    spanCount: all.length,
  };
}

export interface NumericDelta {
  from: number | null;
  to: number | null;
  deltaPct: number | null;
}

export interface AlignDelta {
  durationMs?: NumericDelta;
  tokens?: NumericDelta;
  costUsd?: NumericDelta;
}

export interface AlignRow {
  key: string;
  depth: number;
  a?: TraceSpan;
  b?: TraceSpan;
  status: "matched" | "only-in-a" | "only-in-b";
  /** Present ONLY when status === "matched" — an unpaired span has no honest delta. */
  delta?: AlignDelta;
}

function numericDelta(from: number | null, to: number | null): NumericDelta {
  const deltaPct =
    from !== null && to !== null && from !== 0 ? ((to - from) / Math.abs(from)) * 100 : null;
  return { from, to, deltaPct };
}

function spanTokens(s: TraceSpan): number {
  return (s.inputTokens ?? 0) + (s.outputTokens ?? 0);
}

function computeDelta(a: TraceSpan, b: TraceSpan): AlignDelta {
  return {
    durationMs: numericDelta(durationMs(a), durationMs(b)),
    tokens: numericDelta(spanTokens(a), spanTokens(b)),
    costUsd: numericDelta(a.costUsd ?? 0, b.costUsd ?? 0),
  };
}

/**
 * Align two span trees structurally, matching children by name (greedy,
 * first-unused). Produces a flat, depth-annotated row list: matched pairs
 * carry a delta; only-in-a / only-in-b rows do not. Cycle-safe via a visited
 * set on span ids (a malformed self-referential tree cannot loop).
 */
export function alignSpanTrees(a: TraceSpan, b: TraceSpan): AlignRow[] {
  const rows: AlignRow[] = [];
  const seen = new Set<string>();

  const walk = (an: TraceSpan | undefined, bn: TraceSpan | undefined, depth: number) => {
    const anchor = an ?? bn;
    if (!anchor) return;
    // Cycle guard: never revisit a span id from either side.
    const guardId = `${an?.id ?? ""}|${bn?.id ?? ""}`;
    if (seen.has(guardId)) return;
    seen.add(guardId);

    const status: AlignRow["status"] = an && bn ? "matched" : an ? "only-in-a" : "only-in-b";
    rows.push({
      key: anchor.name,
      depth,
      a: an,
      b: bn,
      status,
      delta: an && bn ? computeDelta(an, bn) : undefined,
    });

    const aChildren = an?.children ?? [];
    const bChildren = bn?.children ?? [];
    const bUsed = new Set<number>();
    for (const ac of aChildren) {
      if (ac.id === an?.id) continue; // self-loop child
      const j = bChildren.findIndex((bc, idx) => !bUsed.has(idx) && bc.name === ac.name);
      if (j >= 0) {
        bUsed.add(j);
        walk(ac, bChildren[j], depth + 1);
      } else {
        walk(ac, undefined, depth + 1);
      }
    }
    for (let idx = 0; idx < bChildren.length; idx++) {
      if (!bUsed.has(idx) && bChildren[idx]?.id !== bn?.id)
        walk(undefined, bChildren[idx], depth + 1);
    }
  };

  walk(a, b, 0);
  return rows;
}
