/**
 * Pure histogram binning — distributes numeric values into `binCount`
 * equal-width bins over [min, max] and counts how many fall in each.
 *
 * Zero-dependency, total, deterministic (M11 ADR D2 — binning is pure logic,
 * distinct from the SVG scaling reused from TrendChart). Non-finite values
 * (NaN / ±Infinity) are dropped, mirroring the trace-core `Number.isFinite`
 * discipline. A degenerate range (all values equal) collapses to a single
 * populated bin so no count is lost.
 */

/** One histogram bucket: half-open [lo, hi) except the final bin, which is [lo, hi] (max-inclusive). */
export interface HistogramBin {
  lo: number;
  hi: number;
  count: number;
}

/**
 * Bin `values` into `binCount` equal-width buckets.
 * Returns `[]` for an empty input or a non-positive `binCount`.
 */
export function computeHistogram(values: number[], binCount: number): HistogramBin[] {
  if (!Number.isFinite(binCount) || binCount <= 0) return [];
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [];

  const n = Math.floor(binCount);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const span = max - min;
  const width = span / n;

  const bins: HistogramBin[] = Array.from({ length: n }, (_, i) => ({
    lo: span === 0 ? min : min + i * width,
    hi: span === 0 ? min : min + (i + 1) * width,
    count: 0,
  }));

  for (const v of finite) {
    // Degenerate range: every value lands in the single conceptual bucket.
    const idx = span === 0 ? 0 : Math.min(n - 1, Math.floor((v - min) / width));
    const bin = bins[idx];
    if (bin) bin.count += 1;
  }

  return bins;
}
