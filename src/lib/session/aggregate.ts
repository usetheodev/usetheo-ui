/**
 * Pure, total session-metric aggregation. Never throws, never does I/O. Honest sums: absent
 * cost/tokens count as 0 (never NaN); the window is max(end) − min(start) over parseable timestamps
 * (an unparseable start is skipped from the window, never a crash).
 */

import { toNs } from "../trace/duration.js";
import type { SessionMetrics, SessionTraceItem } from "./types.js";

export function aggregateSession(items: SessionTraceItem[]): SessionMetrics {
  let totalCostUsd = 0;
  let totalTokens = 0;
  let errorCount = 0;
  const models = new Set<string>();
  let minStart: bigint | null = null;
  let maxEnd: bigint | null = null;

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

    const start = toNs(it.startTime);
    if (start === null) continue; // cannot place this trace in the window
    if (minStart === null || start < minStart) minStart = start;
    const end = toNs(it.endTime ?? null) ?? start;
    const eff = end >= start ? end : start;
    if (maxEnd === null || eff > maxEnd) maxEnd = eff;
  }

  const windowMs =
    minStart !== null && maxEnd !== null ? Number((maxEnd - minStart) / 1_000_000n) : 0;

  return {
    traceCount: items.length,
    windowMs,
    totalCostUsd,
    totalTokens,
    errorCount,
    models: [...models].sort(),
  };
}
