import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { type HistogramBin, computeHistogram } from "../../../lib/chart/histogram.js";
import { cn } from "../../../lib/cn.js";
import { linScale, niceMax } from "../trend-chart/trend-chart.js";

/**
 * Histogram — distribution of numeric values as pure-SVG bars (no chart lib —
 * keeps the registry copy-pasteable; M3 anti-chart-lib ADR upheld, M11 ADR D1).
 *
 * Accepts pre-computed `bins` OR raw `values` + `binCount` (binned client-side
 * via the pure `computeHistogram` helper — M11 ADR D2). Bar height is scaled to
 * a clean upper bound over the counts (`niceMax`); an empty distribution reads
 * as an honest empty state, not a zero-height chart. A visually-hidden table
 * gives screen readers per-bin parity.
 *
 *   <Histogram title="Trace duration" values={durationsMs} binCount={20}
 *              valueFormatter={(v) => `${v}ms`} />
 */

const VIEW_W = 600;
const PAD = { top: 8, right: 8, bottom: 4, left: 40 };
const BAR_GAP = 2;

type HistogramData =
  | { bins: HistogramBin[]; values?: never; binCount?: never }
  | { values: number[]; binCount: number; bins?: never };

export type HistogramProps = HTMLAttributes<HTMLElement> & {
  title: string;
  height?: number;
  /** Formats the count axis label and the bin bounds in the a11y table. */
  valueFormatter?: (v: number) => string;
} & HistogramData;

const Histogram = forwardRef<HTMLElement, HistogramProps>((props, ref) => {
  const {
    title,
    height = 180,
    valueFormatter = (v: number) => String(v),
    className,
    bins: binsProp,
    values,
    binCount,
    ...rest
  } = props;

  const bins = binsProp ?? computeHistogram(values ?? [], binCount ?? 0);
  const hasData = bins.length > 0 && bins.some((b) => b.count > 0);

  if (!hasData) {
    return (
      <figure
        data-slot="histogram"
        ref={ref}
        className={cn("space-y-1", className)}
        aria-label={`${title} — no data`}
        {...rest}
      >
        <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
          {title}
        </figcaption>
        <div
          data-slot="histogram-empty"
          className="flex items-center justify-center rounded-md border border-dashed text-body-sm text-muted-foreground"
          style={{ height }}
        >
          No data to distribute.
        </div>
      </figure>
    );
  }

  const countMax = niceMax(bins.map((b) => b.count)) || 1;
  const yScale = linScale([0, countMax], [height - PAD.bottom, PAD.top]); // inverted (SVG y grows down)
  const plotW = VIEW_W - PAD.left - PAD.right;
  const slotW = plotW / bins.length;
  const barW = Math.max(1, slotW - BAR_GAP);

  return (
    <figure data-slot="histogram" ref={ref} className={cn("space-y-1", className)} {...rest}>
      <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title} distribution`}
        className="w-full"
        style={{ height }}
      >
        {/* baseline */}
        <line
          x1={PAD.left}
          y1={height - PAD.bottom}
          x2={VIEW_W - PAD.right}
          y2={height - PAD.bottom}
          className="stroke-border"
          strokeWidth={1}
        />
        <text x={4} y={PAD.top + 8} className="fill-muted-foreground text-[10px]">
          {valueFormatter(countMax)}
        </text>
        <text x={4} y={height - PAD.bottom} className="fill-muted-foreground text-[10px]">
          0
        </text>
        {bins.map((b, i) => {
          const y = yScale(b.count);
          const barH = Math.max(0, height - PAD.bottom - y);
          return (
            <rect
              // biome-ignore lint/suspicious/noArrayIndexKey: bins are positional buckets — index IS the identity
              key={i}
              data-slot="histogram-bar"
              data-count={b.count}
              x={PAD.left + i * slotW + BAR_GAP / 2}
              y={y}
              width={barW}
              height={barH}
              className="fill-primary"
            >
              <title>{`${valueFormatter(b.lo)}–${valueFormatter(b.hi)}: ${b.count}`}</title>
            </rect>
          );
        })}
      </svg>

      {/* visually-hidden a11y table — screen-reader parity for the SVG */}
      <table data-slot="histogram-table" className="sr-only">
        <caption>{title} — data table</caption>
        <thead>
          <tr>
            <th>Range</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: bins are positional buckets — index IS the identity
            <tr key={i}>
              <td>{`${valueFormatter(b.lo)}–${valueFormatter(b.hi)}`}</td>
              <td>{b.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
});
Histogram.displayName = "Histogram";

export { Histogram };
