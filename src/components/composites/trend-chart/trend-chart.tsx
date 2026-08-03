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
  let emTrecho = false;
  for (const p of points) {
    if (!Number.isFinite(p.y)) {
      emTrecho = false; // a lacuna fecha o trecho; o proximo ponto finito abre outro
      continue;
    }
    out.push(`${emTrecho ? "L" : "M"}${xScale(p.x).toFixed(2)},${yScale(p.y).toFixed(2)}`);
    emTrecho = true;
  }
  return out.join(" ");
}

// ---- component ----

const VIEW_W = 600;
const PAD = { top: 8, right: 8, bottom: 4, left: 40 };
// M76 (O-2): series with fewer points than this draw a marker at each point (a 2-4 point
// line reads as a cliff without them); a denser series draws the line only.
const SPARSE_MARKER_MAX = 5;

/**
 * Quais pontos recebem marcador.
 *
 * Duas razões distintas para marcar, e a segunda só apareceu quando séries com lacuna passaram a
 * existir (M144):
 *
 * 1. **Série esparsa** (< `SPARSE_MARKER_MAX` baldes) — 1-4 pontos leem como um penhasco dramático;
 *    o marcador ancora o leitor no dado real. Regra do M76, preservada.
 * 2. **Ponto isolado** — um ponto finito cercado de lacunas dos dois lados vira um `M` sozinho no
 *    `path`, e um `M` sozinho **desenha nada**: bounding-box zero, invisível. O dado existe, está
 *    correto, e o operador não vê. Medido no e2e do M144 (`d="M419.86,92.00 M448.00,36.00"`).
 *
 * A regra antiga só cobria (1), chaveando no TOTAL de pontos em vez de perguntar se o ponto de fato
 * é desenhado — apesar de o comentário dela já declarar a intenção *"a dot keeps real data from
 * rendering as an invisible line"*. Depois da densificação, uma série de 30 dias com dois dias
 * finitos separados por lacuna cai fora de (1) e desaparece. Chart.js e Plotly marcam o ponto
 * isolado exatamente por isto.
 *
 * Fora do JSX de propósito: é a aritmética da decisão, e aritmética isolada é aritmética que a
 * mutação alcança.
 */
export function pontosComMarcador(points: TrendPoint[]): TrendPoint[] {
  const finito = (p: TrendPoint | undefined): boolean => Number.isFinite(p?.y);
  if (points.length < SPARSE_MARKER_MAX) return points.filter(finito);
  // Vizinho ausente (as pontas) conta como lacuna — uma ponta finita seguida de buraco é tão
  // invisível quanto um ponto no meio.
  return points.filter((p, i) => finito(p) && !finito(points[i - 1]) && !finito(points[i + 1]));
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
}

const TrendChart = forwardRef<HTMLElement, TrendChartProps>(
  (
    {
      title,
      series,
      height = 180,
      valueFormatter = (v: number) => String(v),
      yMax: yMaxProp,
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
    const xScale = linScale([xMin, xMax], [PAD.left, viewW - PAD.right]);
    const yScale = linScale([0, yMax], [height - PAD.bottom, PAD.top]); // inverted (SVG y grows down)

    return (
      <figure data-slot="trend-chart" ref={ref} className={cn("space-y-1", className)} {...props}>
        <figcaption className="font-semibold text-label-caps text-muted-foreground uppercase">
          {title}
        </figcaption>
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
            y1={height - PAD.bottom}
            x2={viewW - PAD.right}
            y2={height - PAD.bottom}
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
          <text x={4} y={height - PAD.bottom} className="fill-muted-foreground text-[10px]">
            0
          </text>
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
              {/* Série esparsa OU ponto isolado entre lacunas — a regra e o porquê de cada uma
                  estão em `pontosComMarcador`. Sem o segundo caso, dado correto fica invisível. */}
              {pontosComMarcador(s.points).map((p, i) => (
                <circle
                  key={`${s.name}-${p.x}-${i}`}
                  data-slot="trend-chart-dot"
                  cx={xScale(p.x)}
                  cy={yScale(p.y)}
                  r={2.5}
                  fill={s.color}
                >
                  <title>{s.name}</title>
                </circle>
              ))}
            </g>
          ))}
        </svg>

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
              <th>Point</th>
              {series.map((s) => (
                <th key={s.name}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {axisXs.map((x, i) => (
              <tr key={x}>
                <td>{i + 1}</td>
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
