/**
 * Waterfall-layout math: trace time envelope, per-span bar geometry, a
 * human-friendly time axis, overlapping-span row packing, and ∑-cost
 * aggregation. Every function is pure and total — it NEVER throws and NEVER
 * does I/O — so skew / missing-timestamp / overlap / degenerate-bounds
 * negative cases are provable without rendering.
 */

import { toNs } from "./duration.js";
import { flattenAll } from "./flatten.js";
import type { TraceSpan } from "./types.js";

/**
 * Trace time bounds — min start / max end across ALL spans (ns, bigint-safe):
 * the honest envelope for the waterfall denominator (not root-only, which
 * would let a child overflow). Unparseable timestamps are skipped; a trace
 * with no timestamps returns 0/0.
 */
export function computeTraceBounds(root: TraceSpan): { startNs: bigint; endNs: bigint } {
  let start: bigint | null = null;
  let end: bigint | null = null;
  for (const span of flattenAll(root)) {
    const s = toNs(span.startTime);
    if (s === null) continue;
    if (start === null || s < start) start = s;
    // A valid start always counts even when the end is missing/unparseable.
    const e = toNs(span.endTime ?? null) ?? s;
    const eff = e >= s ? e : s;
    if (end === null || eff > end) end = eff;
  }
  const s = start ?? 0n;
  return { startNs: s, endNs: end ?? s };
}

export interface BarLayout {
  leftPct: number;
  widthPct: number;
  unbounded: boolean;
}

/**
 * Map a span's [start, end] against the trace bounds → clamped {leftPct,
 * widthPct} in [0,100] with `leftPct + widthPct ≤ 100`. Missing end and
 * clock-skew (end < start) are flagged `unbounded` with zero width — never a
 * throw. Percentages carry 2 decimals via integer bigint math.
 */
export function computeBarLayout(
  spanStart: bigint | string | undefined,
  spanEnd: bigint | string | null | undefined,
  traceStartNs: bigint,
  traceEndNs: bigint,
): BarLayout {
  const window = traceEndNs > traceStartNs ? traceEndNs - traceStartNs : 1n; // div-by-zero guard
  const start = toNs(spanStart);
  if (start === null) return { leftPct: 0, widthPct: 0, unbounded: true };
  const end = toNs(spanEnd ?? null);
  const skewed = end !== null && end < start;
  const unbounded = end === null || skewed;
  const effEnd = end !== null && !skewed ? end : start;
  const pct = (delta: bigint) => (delta > 0n ? Number((delta * 10_000n) / window) / 100 : 0);
  const leftPct = Math.min(Math.max(pct(start - traceStartNs), 0), 100);
  const rawWidth = effEnd > start ? pct(effEnd - start) : 0;
  const widthPct = Math.min(Math.max(rawWidth, 0), 100 - leftPct);
  return { leftPct, widthPct, unbounded };
}

/** One tick on the waterfall time axis. */
export interface AxisTick {
  offsetNs: bigint;
  label: string;
  leftPct: number;
}

// The 1/2/5×10ⁿ "nice number" ladder — the mantissas step size snaps to.
const NICE_MANTISSAS = [1n, 2n, 5n];
const MIN_TICK_PX = 70; // ≥70px between ticks so labels never collide

/** Render a number with at most 2 decimals and no trailing zeros. */
function trimZeros(n: number): string {
  return Number.parseFloat(n.toFixed(2)).toString();
}

/** Format a nanosecond offset as a compact ms / s / min label by magnitude. Pure, no locale. */
function labelForNs(offsetNs: bigint): string {
  const ns = Number(offsetNs);
  if (ns >= 60_000_000_000) return `${trimZeros(ns / 60_000_000_000)}min`;
  if (ns >= 1_000_000_000) return `${trimZeros(ns / 1_000_000_000)}s`;
  return `${trimZeros(ns / 1_000_000)}ms`;
}

/** The smallest 1/2/5×10ⁿ step ≥ `targetNs`. Pure integer ladder walk (no Math.log rounding traps). */
function niceStep(targetNs: number): bigint {
  if (!(targetNs > 0)) return 0n;
  let pow = 1n;
  for (let guard = 0; guard < 32; guard++) {
    for (const m of NICE_MANTISSAS) {
      const candidate = m * pow;
      if (Number(candidate) >= targetNs) return candidate;
    }
    pow *= 10n;
  }
  return pow; // unreachable in practice; a total fallback rather than a throw
}

/**
 * Human-friendly time axis: pick a step from the 1/2/5×10ⁿ ladder so ticks
 * sit ≥70px apart, then emit ticks at 0, step, 2·step, … across the span.
 * Total: a degenerate window or non-positive width yields an empty axis.
 */
export function niceAxisTicks(startNs: bigint, endNs: bigint, pxWidth: number): AxisTick[] {
  if (endNs <= startNs || !(pxWidth > 0)) return [];
  const spanNs = endNs - startNs;
  const maxTicks = Math.max(1, Math.floor(pxWidth / MIN_TICK_PX));
  const step = niceStep(Number(spanNs) / maxTicks);
  if (step <= 0n) return [];
  const ticks: AxisTick[] = [];
  const spanNum = Number(spanNs);
  for (let offset = 0n; offset <= spanNs; offset += step) {
    ticks.push({
      offsetNs: offset,
      label: labelForNs(offset),
      leftPct: (Number(offset) / spanNum) * 100,
    });
  }
  return ticks;
}

/**
 * Greedy single-pass row packing for overlapping spans: sort by start, then
 * assign each span the lowest row whose last-placed span ended at/before this
 * span's start. Returns `Map<id, rowIndex>`. Total: `[]` → empty map.
 */
export function packRows(
  spans: Array<{ id: string; startNs: bigint; endNs: bigint }>,
): Map<string, number> {
  const rows = new Map<string, number>();
  const rowEnds: bigint[] = [];
  const ordered = [...spans].sort((a, b) =>
    a.startNs < b.startNs ? -1 : a.startNs > b.startNs ? 1 : 0,
  );
  for (const s of ordered) {
    // A skewed span (end < start) occupies a point at its start so it never covers a later row.
    const end = s.endNs >= s.startNs ? s.endNs : s.startNs;
    let placed = -1;
    for (let r = 0; r < rowEnds.length; r++) {
      const rowEnd = rowEnds[r];
      if (rowEnd !== undefined && rowEnd <= s.startNs) {
        placed = r;
        break;
      }
    }
    if (placed === -1) {
      placed = rowEnds.length;
      rowEnds.push(end);
    } else {
      rowEnds[placed] = end;
    }
    rows.set(s.id, placed);
  }
  return rows;
}
