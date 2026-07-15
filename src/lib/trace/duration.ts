/**
 * Timestamp normalization + duration math. Pure and total — never throws,
 * never does I/O. All internal math is bigint ns (ADR D2 of the plan): no
 * float precision loss on unix-ns timestamps.
 */

import type { SpanStatus, TraceSpan } from "./types.js";

/**
 * Normalize a timestamp to unix ns. Accepts bigint ns, a numeric string
 * (treated as ns), or an ISO-8601 string (ms precision → ns). Returns null
 * for anything unparseable — callers treat null as "cannot place this span".
 */
export function toNs(value: bigint | string | null | undefined): bigint | null {
  if (typeof value === "bigint") return value;
  if (typeof value !== "string" || value === "") return null;
  try {
    return BigInt(value);
  } catch {
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? null : BigInt(ms) * 1_000_000n;
  }
}

/** Span duration in ms; null when unavailable or clock-skewed (end < start). */
export function durationMs(span: Pick<TraceSpan, "startTime" | "endTime">): number | null {
  const start = toNs(span.startTime);
  const end = toNs(span.endTime ?? null);
  if (start === null || end === null) return null;
  const ms = (end - start) / 1_000_000n;
  return ms < 0n ? null : Number(ms);
}

/** Whether a span status counts as an error. Total: unknown statuses are not errors. */
export function isSpanError(status: SpanStatus | string | undefined): boolean {
  return status === "ERROR";
}

/** Compact ms/s/min duration label (`1500 → "1.5s"`). Null → "in-flight". Pure, no locale. */
export function formatDurationMs(ms: number | null): string {
  if (ms === null) return "in-flight";
  if (ms >= 60_000) return `${trimZeros(ms / 60_000)}min`;
  if (ms >= 1000) return `${trimZeros(ms / 1000)}s`;
  return `${Math.round(ms)}ms`;
}

function trimZeros(n: number): string {
  return Number.parseFloat(n.toFixed(2)).toString();
}
