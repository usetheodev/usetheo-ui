import { forwardRef, useCallback, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * TrendChart — multi-series time-trend chart in pure SVG (no chart lib —
 * keeps the registry copy-pasteable). Promoted from the theo-cloud dashboard
 * (production since M51, with the M76 sparse-marker and M90 ragged-series
 * lessons pinned by tests).
 *
 * Input contract: `y` values are expected finite and >= 0 (latency, counts);
 * non-finite points are skipped in the line and read as "—" in the table;
 * gaps are modeled by OMITTING the point (the a11y table reads each value
 * under its own period — never positionally). Points are connected in the
 * order given; sort by `x` upstream. Series `color` is any CSS color — prefer
 * theme tokens (e.g. `var(--primary)`).
 *
 *   <TrendChart title="Latency" valueFormatter={(v) => `${v}ms`}
 *               series={[{ name: "p50", color: "var(--primary)", points }]} />
 */

export interface TrendPoint {
  /** X in the series' own units (bucket index or epoch-ms); scaled linearly. */
  x: number;
  /** Y value for this point. */
  y: number;
}
export interface TrendSeries {
  name: string;
  /** CSS color for the line + legend swatch (prefer theme tokens). */
  color: string;
  points: TrendPoint[];
}

// ---- pure helpers (exported for unit tests) ----

/** Linear scale mapping a value in `domain` to `range`. A zero-width domain maps everything to r0. */
export function linScale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (v: number) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0));
}

/** A clean upper Y bound ≥ max(values). Returns 0 when there is no positive value. */
export function niceMax(values: number[]): number {
  const m = Math.max(0, ...values.filter((v) => Number.isFinite(v)));
  if (m <= 0) return 0;
  const pow = 10 ** Math.floor(Math.log10(m));
  // `Number(x.toPrecision(12))` strips the binary-float artifact a fractional `pow`
  // introduces: Math.ceil(0.68 / 0.1) * 0.1 === 0.7000000000000001, which otherwise
  // renders raw on the y-axis. toPrecision(12) → "0.700000000000" → 0.7.
  return Number((Math.ceil(m / pow) * pow).toPrecision(12));
}

/**
 * SVG path `d` for a polyline over the given scales. A non-finite point is a GAP: the path BREAKS
 * there and resumes with a new `M` subpath.
 *
 * M144 — this used to `filter(Number.isFinite)` and then join everything with `L`, which drew a
 * continuous line straight over the hole. The filter is what made it wrong: it erased the
 * information of WHERE the gap was, so the line could not break even in principle.
 *
 * Breaking is what every serious charting library does by default — `spanGaps` (Chart.js),
 * `connectNulls` (Highcharts, ECharts, Recharts) and `connectgaps` (Plotly) all default to `false`,
 * and Grafana ships "Connect null values: Never". It is also the only honest reading: connecting
 * asserts continuity the data does not have, and the rest of THIS file already treats a non-finite
 * `y` as absent (`niceMax` filters it, `hasData` filters it, and the accessible table renders `—`
 * for a period a series has no point for).
 *
 * A run of one point emits a lone `M` and no `L` — a one-point line has no length, and the sparse
 * marker is what makes it visible.
 */
export function seriesPath(
  points: TrendPoint[],
  xScale: (x: number) => number,
  yScale: (y: number) => number,
): string {
  const out: string[] = [];
  let inStretch = false;
  for (const p of points) {
    if (!Number.isFinite(p.y)) {
      inStretch = false; // the gap closes the stretch; the next finite point opens another
      continue;
    }
    out.push(`${inStretch ? "L" : "M"}${xScale(p.x).toFixed(2)},${yScale(p.y).toFixed(2)}`);
    inStretch = true;
  }
  return out.join(" ");
}

// ---- component ----

const VIEW_W = 600;
const PAD = { top: 8, right: 8, bottom: 4, left: 40 };
/** Extra footer height when there is an X axis. Zero without one — see `PAD.bottom` below. */
const X_AXIS_PX = 14;
/** Minimum space between X-axis labels. Same density rule as `lib/trace/bar-layout.ts`. */
const MIN_TICK_PX = 70;

/**
 * Which axis positions receive a label.
 *
 * Labelling 31 points in ~450px is illegible; labelling only the edges does not answer "when was
 * the spike". The density comes from the REAL width (`viewW`, which the ResizeObserver already
 * tracks), with the first and the last ALWAYS present: they are the window's edges, and without
 * them the reader does not know from when to when the chart speaks.
 *
 * Outside the JSX because it is arithmetic, and isolated arithmetic is arithmetic mutation reaches.
 */
export function xTicks(axisXs: number[], viewW: number): number[] {
  if (axisXs.length <= 2) return [...axisXs];
  const maxTicks = Math.max(2, Math.floor((viewW - PAD.left - PAD.right) / MIN_TICK_PX));
  if (axisXs.length <= maxTicks) return [...axisXs];
  const step = (axisXs.length - 1) / (maxTicks - 1);
  // The loop ALREADY guarantees both edges: i=0 gives index 0, and i=maxTicks-1 gives
  // round((maxTicks-1) * (n-1)/(maxTicks-1)) = exactly n-1. Two lines of explicit `add` sat here
  // as a seatbelt and were dead code — the mutation campaign caught them, because removing them
  // broke no test. The test asserting the property still holds; what goes is the redundancy, not
  // the guarantee.
  const chosen = new Set<number>();
  for (let i = 0; i < maxTicks; i++) chosen.add(Math.round(i * step));
  return [...chosen].sort((a, b) => a - b).map((i) => axisXs[i] as number);
}
// M76 (O-2): series with fewer points than this draw a marker at each point (a 2-4 point
// line reads as a cliff without them); a denser series draws the line only.
const SPARSE_MARKER_MAX = 5;

/**
 * Which points receive a marker.
 *
 * Two distinct reasons to mark, and the second only appeared once series with gaps came to exist
 * (M144):
 *
 * 1. **Sparse series** (< `SPARSE_MARKER_MAX` FINITE points) — 1-4 points read as a dramatic
 *    cliff; the marker anchors the reader on the real data. M76's rule — which now counts data,
 *    not slots, because M144's densification broke the equivalence between the two.
 * 2. **Isolated point** — a finite point surrounded by gaps on both sides becomes a lone `M` in
 *    the `path`, and a lone `M` **draws nothing**: zero bounding box, invisible. The data exists,
 *    it is correct, and the operator does not see it. Measured in M144's e2e
 *    (`d="M419.86,92.00 M448.00,36.00"`).
 *
 * The old rule covered only (1), keying on the TOTAL number of points instead of asking whether
 * the point is actually drawn — even though its own comment already stated the intent *"a dot
 * keeps real data from rendering as an invisible line"*. After the densification, a 30-day series
 * with two finite days separated by a gap falls outside (1) and disappears. Chart.js and Plotly
 * mark the isolated point for exactly this reason.
 *
 * Outside the JSX on purpose: it is the decision's arithmetic, and isolated arithmetic is the kind
 * a mutation reaches.
 */
export function markedPoints(points: TrendPoint[]): TrendPoint[] {
  const isFinitePoint = (p: TrendPoint | undefined): boolean => Number.isFinite(p?.y);
  // We count FINITE points, not slots. A densified 30-day series with 3 days of usage is sparse in
  // DATA and dense in slots; keying on the array's length switched rule (1) off for exactly the
  // series M144 created, with nothing flagging it.
  const finitePoints = points.filter(isFinitePoint);
  if (finitePoints.length < SPARSE_MARKER_MAX) return finitePoints;
  // A missing neighbour (the edges) counts as a gap — a finite edge followed by a hole is as
  // invisible as a point in the middle.
  return points.filter(
    (p, i) => isFinitePoint(p) && !isFinitePoint(points[i - 1]) && !isFinitePoint(points[i + 1]),
  );
}

export interface TrendChartProps extends HTMLAttributes<HTMLElement> {
  title: string;
  series: TrendSeries[];
  height?: number;
  /** Formats y-axis labels and table cells (tremor vocabulary). */
  valueFormatter?: (v: number) => string;
  /**
   * Pin the top of the y-axis. Pass a fixed bound (e.g. `1` for a 0–1 score) so the
   * scale is stable and comparable across renders instead of auto-fitting to the data
   * max via {@link niceMax} (which makes 0.68 look near the top of a [0, 0.7] axis).
   * Ignored when ≤ 0. Default: auto (`niceMax`).
   */
  yMax?: number;
  /**
   * Formats the `x` for the axis and for the accessible table. **Optional on purpose.**
   *
   * The `x` contract is ambiguous — "bucket index or epoch-ms" — and in practice nearly unanimous:
   * of the consumer's six series factories, five pass an INDEX and one passes epoch-ms. Inferring by
   * magnitude would work, and would be the exact shape of the defect this component has already paid
   * for (M76's marker rule keyed on `points.length` instead of asking what it wanted to know, and
   * M144's densification switched it off silently). The one who knows what `x` means is the caller.
   *
   * Without this prop nothing changes: no X-axis label is drawn and the table keeps numbering.
   */
  xFormatter?: (x: number) => string;
  /** Header of the accessible table's first column. "Point" over dates would be dishonest. */
  xLabel?: string;
}

const TrendChart = forwardRef<HTMLElement, TrendChartProps>(
  (
    {
      title,
      series,
      height = 180,
      valueFormatter = (v: number) => String(v),
      yMax: yMaxProp,
      xFormatter,
      xLabel,
      className,
      ...props
    },
    ref,
  ) => {
    // Width-aware viewBox: track the SVG's real pixel width so the viewBox is 1 unit = 1px.
    // The chart previously used a FIXED 600-wide viewBox with preserveAspectRatio="none",
    // so on a wider container everything stretched horizontally (round markers → ovals).
    // Measuring the width keeps the geometry undistorted while still filling the width.
    // jsdom/SSR has no ResizeObserver / zero clientWidth → we keep the VIEW_W fallback,
    // so existing snapshot-style tests (viewBox "0 0 600 …") stay green.
    const [viewW, setViewW] = useState<number>(VIEW_W);
    // The index only, never the object: a `setState` per `mousemove` carrying structure would
    // recompute the series dozens of times a second just to draw a rectangle.
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);
    const roRef = useRef<ResizeObserver | null>(null);
    const setSvgNode = useCallback((node: SVGSVGElement | null) => {
      roRef.current?.disconnect();
      roRef.current = null;
      if (!node || typeof ResizeObserver === "undefined") return;
      const measure = () => {
        const w = node.clientWidth;
        if (w > 0) setViewW(w);
      };
      measure();
      roRef.current = new ResizeObserver(measure);
      roRef.current.observe(node);
    }, []);

    const allPoints = series.flatMap((s) => s.points);
    const hasData = allPoints.some((p) => Number.isFinite(p.y));

    if (!hasData) {
      return (
        <figure
          data-slot="trend-chart"
          ref={ref}
          className={cn("space-y-1", className)}
          aria-label={`${title} — no data`}
          {...props}
        >
          <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
            {title}
          </figcaption>
          <div
            data-slot="trend-chart-empty"
            className="flex items-center justify-center rounded-md border border-dashed text-body-sm text-muted-foreground"
            style={{ height }}
          >
            No data in this time range.
          </div>
        </figure>
      );
    }

    const xs = allPoints.map((p) => p.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMax =
      yMaxProp != null && yMaxProp > 0 ? yMaxProp : niceMax(allPoints.map((p) => p.y)) || 1;

    // M90: the a11y-table row axis is the SORTED UNION of every series' x-values, so a
    // value is read under its own period — NOT positionally off series[0] (which
    // mis-attributes ragged/sparse series where a period gap is a real gap). Each series
    // looks its cell up BY x; a period it has no point for renders "—".
    const axisXs = Array.from(new Set(allPoints.map((p) => p.x))).sort((a, b) => a - b);
    const yByX = series.map((s) => new Map(s.points.map((p) => [p.x, p.y] as const)));
    // The footer only grows when there is a label to draw. `PAD.bottom` is 4: always growing would
    // move the `yScale` and with it every `y` coordinate of every `path` already tested in the index
    // consumers.
    const padBottom = PAD.bottom + (xFormatter ? X_AXIS_PX : 0);
    const xScale = linScale([xMin, xMax], [PAD.left, viewW - PAD.right]);
    const yScale = linScale([0, yMax], [height - padBottom, PAD.top]); // inverted (SVG y grows down)

    return (
      <figure data-slot="trend-chart" ref={ref} className={cn("space-y-1", className)} {...props}>
        <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
          {title}
        </figcaption>
        {/* Hover surface. The pattern comes from this same design system's `span-waterfall`:
        an HTML overlay positioned by %, with no new dependency. Radix Tooltip was refused —
        it would drag in `@radix-ui/react-tooltip` and require a Provider in the app, breaking
        the property that defines this component ("no chart lib — keeps the registry
        copy-pasteable") and failing at runtime, not at build. */}
        <div
          data-slot="trend-chart-surface"
          className="relative"
          onMouseMove={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            if (box.width === 0 || axisXs.length === 0) return;
            const frac = (e.clientX - box.left) / box.width;
            const target = xMin + frac * (xMax - xMin);
            let best = 0;
            for (let i = 1; i < axisXs.length; i++) {
              if (
                Math.abs((axisXs[i] as number) - target) <
                Math.abs((axisXs[best] as number) - target)
              )
                best = i;
            }
            setHoverIdx(best);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <svg
            ref={setSvgNode}
            viewBox={`0 0 ${viewW} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${title} trend`}
            className="w-full"
            style={{ height }}
          >
            {/* baseline + top gridline */}
            <line
              x1={PAD.left}
              y1={height - padBottom}
              x2={viewW - PAD.right}
              y2={height - padBottom}
              className="stroke-border"
              strokeWidth={1}
            />
            <line
              x1={PAD.left}
              y1={PAD.top}
              x2={viewW - PAD.right}
              y2={PAD.top}
              className="stroke-border/50"
              strokeWidth={1}
              strokeDasharray="2 3"
            />
            <text x={4} y={PAD.top + 8} className="fill-muted-foreground text-[10px]">
              {valueFormatter(yMax)}
            </text>
            <text x={4} y={height - padBottom} className="fill-muted-foreground text-[10px]">
              0
            </text>
            {/* X axis — it exists only when the caller says how to read the `x`. Without `xFormatter`
            there is nothing honest to write there, and drawing the ordinal would repeat the problem
            in different ink. `textAnchor` follows the position so the first and last do not spill
            out of the box. */}
            {xFormatter
              ? xTicks(axisXs, viewW).map((x, i, todos) => (
                  <text
                    key={x}
                    data-slot="trend-chart-xtick"
                    x={xScale(x)}
                    y={height - 2}
                    textAnchor={i === 0 ? "start" : i === todos.length - 1 ? "end" : "middle"}
                    className="fill-muted-foreground text-[10px]"
                  >
                    {xFormatter(x)}
                  </text>
                ))
              : null}
            {series.map((s) => (
              <g key={s.name}>
                <path
                  data-slot="trend-chart-line"
                  data-series={s.name}
                  d={seriesPath(s.points, xScale, yScale)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.5}
                >
                  <title>{s.name}</title>
                </path>
                {/* Sparse series OR an isolated point between gaps — the rule and the why of each live
                in `markedPoints`. Without the second case, correct data stays invisible. */}
                {markedPoints(s.points).map((p, i) => (
                  <circle
                    key={`${s.name}-${p.x}-${i}`}
                    data-slot="trend-chart-dot"
                    cx={xScale(p.x)}
                    cy={yScale(p.y)}
                    r={4}
                    fill={s.color}
                  >
                    <title>{s.name}</title>
                  </circle>
                ))}
              </g>
            ))}
            {/* Crosshair: a vertical line at the point nearest the cursor. Inside the SVG because it
            needs the same scale as the series. */}
            {hoverIdx !== null && axisXs[hoverIdx] !== undefined ? (
              <line
                data-slot="trend-chart-crosshair"
                x1={xScale(axisXs[hoverIdx] as number)}
                y1={PAD.top}
                x2={xScale(axisXs[hoverIdx] as number)}
                y2={height - padBottom}
                className="stroke-muted-foreground/40"
                strokeWidth={1}
              />
            ) : null}
          </svg>
          {/* DECORATIVE tooltip (`aria-hidden`) — the screen-reader channel is the table below, which
          now carries the date and the value. Before the X-axis fix it numbered, and a decorative
          tooltip would have created information exclusive to mouse users. */}
          {hoverIdx !== null && axisXs[hoverIdx] !== undefined ? (
            <div
              data-slot="trend-chart-tooltip"
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-10 rounded border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow"
              style={{
                left: `${(xScale(axisXs[hoverIdx] as number) / viewW) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="font-medium">
                {xFormatter ? xFormatter(axisXs[hoverIdx] as number) : `#${hoverIdx + 1}`}
              </div>
              {series.map((s, si) => {
                const y = yByX[si]?.get(axisXs[hoverIdx] as number);
                return (
                  <div key={s.name} className="whitespace-nowrap">
                    <span
                      className="mr-1 inline-block size-2 rounded-full align-middle"
                      style={{ background: s.color }}
                    />
                    {s.name}: {y !== undefined && Number.isFinite(y) ? valueFormatter(y) : "\u2014"}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* color legend */}
        <ul
          data-slot="trend-chart-legend"
          className="flex flex-wrap gap-3 text-body-sm text-muted-foreground"
        >
          {series.map((s) => (
            <li key={s.name} className="flex items-center gap-1">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </li>
          ))}
        </ul>

        {/* visually-hidden a11y table — screen-reader parity for the SVG */}
        <table data-slot="trend-chart-table" className="sr-only">
          <caption>{title} — data table</caption>
          <thead>
            <tr>
              <th>{xLabel ?? "Point"}</th>
              {series.map((s) => (
                <th key={s.name}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axisXs.map((x, i) => (
              <tr key={x}>
                <td>{xFormatter ? xFormatter(x) : i + 1}</td>
                {series.map((s, si) => {
                  const y = yByX[si]?.get(x);
                  return (
                    <td key={s.name}>
                      {y !== undefined && Number.isFinite(y) ? valueFormatter(y) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    );
  },
);
TrendChart.displayName = "TrendChart";

export { TrendChart };
