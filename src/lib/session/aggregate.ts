/**
 * Pure, total session-metric aggregation. Never throws, never does I/O. Honest sums: absent
 * cost/tokens count as 0 (never NaN); the window is max(end) − min(start) over parseable timestamps
 * (an unparseable start is skipped from the window, never a crash).
 */

import { toNs } from "../trace/duration.js";
import type { SessionMetrics, SessionTraceItem } from "./types.js";

/**
 * The session's wall-clock window in ns: [min start, max effective end] over the parseable
 * timestamps. An unparseable start is skipped (never a crash); a clock-skewed/absent end falls back
 * to its own start. A session with no parseable timestamps yields 0/0. This is the SINGLE definition
 * of "a session's time window" — both `aggregateSession` (for `windowMs`) and `SessionTimeline` (for
 * the per-trace bar denominator) consume it, so the window semantics live in one place.
 */
export function sessionBounds(items: SessionTraceItem[]): { startNs: bigint; endNs: bigint } {
  let minStart: bigint | null = null;
  let maxEnd: bigint | null = null;
  for (const it of items) {
    const start = toNs(it.startTime);
    if (start === null) continue;
    if (minStart === null || start < minStart) minStart = start;
    const end = toNs(it.endTime ?? null) ?? start;
    const eff = end >= start ? end : start;
    if (maxEnd === null || eff > maxEnd) maxEnd = eff;
  }
  const s = minStart ?? 0n;
  return { startNs: s, endNs: maxEnd ?? s };
}

export function aggregateSession(items: SessionTraceItem[]): SessionMetrics {
  let totalCostUsd = 0;
  let totalTokens = 0;
  let errorCount = 0;
  const models = new Set<string>();

  for (const it of items) {
    if (typeof it.costUsd === "number" && Number.isFinite(it.costUsd) && it.costUsd > 0) {
      totalCostUsd += it.costUsd;
    }
    if (
      typeof it.totalTokens === "number" &&
      Number.isFinite(it.totalTokens) &&
      it.totalTokens > 0
    ) {
      totalTokens += it.totalTokens;
    }
    if (it.status === "ERROR") errorCount++;
    if (it.model) models.add(it.model);
  }

  const { startNs, endNs } = sessionBounds(items);
  const windowMs = Number((endNs - startNs) / 1_000_000n);

  return {
    traceCount: items.length,
    windowMs,
    totalCostUsd,
    totalTokens,
    errorCount,
    models: [...models].sort(),
  };
}
