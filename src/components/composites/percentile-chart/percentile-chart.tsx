import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { linScale, niceMax, seriesPath } from "../trend-chart/trend-chart.js";

/**
 * PercentileChart — p50/p95/p99 over time as shaded BANDS (not three flat
 * lines), pure-SVG (M3 anti-chart-lib ADR upheld, M11 ADR D1). The p50–p95 and
 * p95–p99 spans render as filled areas + a p50 reference line, so the spread is
 * read at a glance (phoenix `TraceLatencyPercentilesTimeSeries` pattern, M11
 * ADR D2 — the upgrade over the lens' current three-line overlay). Reuses
 * `linScale`/`niceMax`/`seriesPath` from TrendChart — zero new chart dep.
 *
 *   <PercentileChart title="Latency" buckets={latencyBuckets}
 *                    valueFormatter={(v) => `${v}ms`} />
 */

export interface PercentileBucket {
  /** p50 value for this time bucket. */
  p50: number;
  /** p95 value for this time bucket. */
  p95: number;
  /** p99 value for this time bucket. */
  p99: number;
  /** Optional bucket label (read in the a11y table). */
  label?: string;
}

const VIEW_W = 600;
const PAD = { top: 8, right: 8, bottom: 4, left: 40 };

/**
 * SVG area `d` for the band between an `upper` and `lower` series across the
 * buckets: forward along the upper edge, back along the lower edge, closed.
 */
function bandPath(
  upper: number[],
  lower: number[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
): string {
  if (upper.length === 0) return "";
  const top = upper.map(
    (v, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(2)},${yScale(v).toFixed(2)}`,
  );
  const bottom = lower
    .map((v, i) => ({ x: xScale(i), y: yScale(v) }))
    .reverse()
    .map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  return `${top.join(" ")} ${bottom.join(" ")} Z`;
}

export type PercentileChartProps = HTMLAttributes<HTMLElement> & {
  title: string;
  buckets: PercentileBucket[];
  height?: number;
  /** Formats the y-axis label and the a11y table cells. */
  valueFormatter?: (v: number) => string;
};

const PercentileChart = forwardRef<HTMLElement, PercentileChartProps>((props, ref) => {
  const {
    title,
    buckets,
    height = 180,
    valueFormatter = (v: number) => String(v),
    className,
    ...rest
  } = props;

  const hasData = buckets.length > 0;

  if (!hasData) {
    return (
      <figure
        data-slot="percentile-chart"
        ref={ref}
        className={cn("space-y-1", className)}
        aria-label={`${title} — no data`}
        {...rest}
      >
        <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
          {title}
        </figcaption>
        <div
          data-slot="percentile-empty"
          className="flex items-center justify-center rounded-md border border-dashed text-body-sm text-muted-foreground"
          style={{ height }}
        >
          No data in this time range.
        </div>
      </figure>
    );
  }

  const p50 = buckets.map((b) => b.p50);
  const p95 = buckets.map((b) => b.p95);
  const p99 = buckets.map((b) => b.p99);
  const yMax = niceMax([...p99]) || 1;
  // A single bucket collapses the x-domain to a point; [0, max(1, n-1)] keeps the band drawable.
  const xScale = linScale([0, Math.max(1, buckets.length - 1)], [PAD.left, VIEW_W - PAD.right]);
  const yScale = linScale([0, yMax], [height - PAD.bottom, PAD.top]); // inverted (SVG y grows down)
  const p50Points = p50.map((y, x) => ({ x, y }));

  return (
    <figure data-slot="percentile-chart" ref={ref} className={cn("space-y-1", className)} {...rest}>
      <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title} percentiles`}
        className="w-full"
        style={{ height }}
      >
        <line
          x1={PAD.left}
          y1={height - PAD.bottom}
          x2={VIEW_W - PAD.right}
          y2={height - PAD.bottom}
          className="stroke-border"
          strokeWidth={1}
        />
        <text x={4} y={PAD.top + 8} className="fill-muted-foreground text-[10px]">
          {valueFormatter(yMax)}
        </text>
        <text x={4} y={height - PAD.bottom} className="fill-muted-foreground text-[10px]">
          0
        </text>
        {/* outer band p95–p99 (lighter — the tail) drawn first, inner p50–p95 on top */}
        <path
          data-slot="percentile-band"
          data-band="p95-p99"
          d={bandPath(p99, p95, xScale, yScale)}
          className="fill-primary"
          fillOpacity={0.15}
        >
          <title>p95–p99</title>
        </path>
        <path
          data-slot="percentile-band"
          data-band="p50-p95"
          d={bandPath(p95, p50, xScale, yScale)}
          className="fill-primary"
          fillOpacity={0.3}
        >
          <title>p50–p95</title>
        </path>
        <path
          data-slot="percentile-p50-line"
          d={seriesPath(p50Points, xScale, yScale)}
          fill="none"
          className="stroke-primary"
          strokeWidth={1.5}
        >
          <title>p50</title>
        </path>
      </svg>

      {/* visually-hidden a11y table — screen-reader parity for the SVG */}
      <table data-slot="percentile-table" className="sr-only">
        <caption>{title} — data table</caption>
        <thead>
          <tr>
            <th>Bucket</th>
            <th>p50</th>
            <th>p95</th>
            <th>p99</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: buckets are positional time slots — index IS the identity
            <tr key={i}>
              <td>{b.label ?? i + 1}</td>
              <td>{valueFormatter(b.p50)}</td>
              <td>{valueFormatter(b.p95)}</td>
              <td>{valueFormatter(b.p99)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});
PercentileChart.displayName = "PercentileChart";

export { PercentileChart };
