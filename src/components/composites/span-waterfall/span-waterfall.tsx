import { type MouseEvent, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/cn.js";
import {
  computeBarLayout,
  computeTraceBounds,
  niceAxisTicks,
} from "../../../lib/trace/bar-layout.js";
import { packRows } from "../../../lib/trace/bar-layout.js";
import { aggregateCost } from "../../../lib/trace/cost.js";
import { durationMs, formatDurationMs, isSpanError, toNs } from "../../../lib/trace/duration.js";
import { flattenVisible } from "../../../lib/trace/flatten.js";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { Badge } from "../../primitives/badge/index.js";

// Nominal lane width for tick selection — jsdom reports 0-width rects; the math only depends on the
// window/width ratio, so real browsers get the same ticks. ≥70px spacing at 600px yields 1/2/5×10ⁿ.
const AXIS_PX = 600;

type Bounds = { startNs: bigint; endNs: bigint };

export interface SpanWaterfallProps {
  root: TraceSpan;
  /** Trace window; defaults to the honest min-start/max-end envelope of the whole tree. */
  bounds?: Bounds;
  selectedId: string | null;
  onSelect: (id: string) => void;
  collapsed: Set<string>;
  /** ns → label for the hover-needle. Default ISO datetime. */
  formatTimestamp?: (ns: bigint) => string;
  /** USD cost formatter for the ∑ rollup badge. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  className?: string;
  "aria-label"?: string;
}

const defaultTimestamp = (ns: bigint) => new Date(Number(ns / 1_000_000n)).toISOString();
const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

/**
 * SpanWaterfall — a nice-interval time axis over row-packed span bars, a
 * hover-needle reading the absolute wall-clock time under the pointer, and a
 * `∑` rollup-cost badge on parent rows. Bars are percentage-positioned via
 * `computeBarLayout` (clock-skew / in-flight → dashed unbounded). Controlled:
 * selection lives in the consumer. Escaped text only — no HTML injection.
 */
export function SpanWaterfall({
  root,
  bounds,
  selectedId,
  onSelect,
  collapsed,
  formatTimestamp = defaultTimestamp,
  formatCostUsd = defaultCost,
  className,
  "aria-label": ariaLabel = "Trace waterfall",
}: SpanWaterfallProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const [needle, setNeedle] = useState<{ leftPct: number; label: string } | null>(null);

  const window = useMemo(() => bounds ?? computeTraceBounds(root), [bounds, root]);
  const visible = useMemo(() => flattenVisible(root, collapsed), [root, collapsed]);
  const rows = useMemo(() => {
    const items = visible
      .map((f) => {
        const startNs = toNs(f.span.startTime);
        if (startNs === null) return null;
        return { id: f.span.id, startNs, endNs: toNs(f.span.endTime ?? null) ?? startNs };
      })
      .filter((x): x is { id: string; startNs: bigint; endNs: bigint } => x !== null);
    return packRows(items);
  }, [visible]);

  const spanNs = window.endNs > window.startNs ? window.endNs - window.startNs : 0n;
  const ticks = useMemo(() => niceAxisTicks(window.startNs, window.endNs, AXIS_PX), [window]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (spanNs <= 0n) return;
    const rect = laneRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const frac = width > 0 ? Math.min(Math.max((e.clientX - (rect?.left ?? 0)) / width, 0), 1) : 0;
    const offsetNs = BigInt(Math.round(frac * Number(spanNs)));
    setNeedle({ leftPct: frac * 100, label: formatTimestamp(window.startNs + offsetNs) });
  };

  return (
    <div data-slot="span-waterfall" aria-label={ariaLabel} className={cn("space-y-1", className)}>
      {ticks.length > 0 ? (
        <div
          className="relative mb-1 h-4 w-full text-[10px] text-muted-foreground"
          aria-hidden="true"
        >
          {ticks.map((t) => (
            <span
              key={t.offsetNs.toString()}
              data-slot="span-waterfall-tick"
              className="-translate-x-1/2 absolute whitespace-nowrap"
              style={{ left: `${Math.min(t.leftPct, 100)}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      ) : null}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: hover-needle is a presentational enhancement over interactive rows */}
      <div
        ref={laneRef}
        className="relative space-y-0.5"
        onMouseMove={onMove}
        onMouseLeave={() => setNeedle(null)}
      >
        {needle ? (
          <span
            data-slot="span-waterfall-needle"
            aria-hidden="true"
            className="-top-4 -translate-x-1/2 pointer-events-none absolute z-10 whitespace-nowrap rounded bg-foreground px-1 text-[10px] text-background"
            style={{ left: `${Math.min(needle.leftPct, 100)}%` }}
          >
            {needle.label}
          </span>
        ) : null}
        {visible.map((f) => (
          <WaterfallRow
            key={f.span.id}
            span={f.span}
            bounds={window}
            row={rows.get(f.span.id) ?? 0}
            selected={f.span.id === selectedId}
            onSelect={onSelect}
            formatCostUsd={formatCostUsd}
          />
        ))}
      </div>
    </div>
  );
}

function WaterfallRow({
  span,
  bounds,
  row,
  selected,
  onSelect,
  formatCostUsd,
}: {
  span: TraceSpan;
  bounds: Bounds;
  row: number;
  selected: boolean;
  onSelect: (id: string) => void;
  formatCostUsd: (usd: number) => string;
}) {
  const { leftPct, widthPct, unbounded } = computeBarLayout(
    span.startTime,
    span.endTime,
    bounds.startNs,
    bounds.endNs,
  );
  const error = isSpanError(span.status);
  const hasChildren = (span.children?.length ?? 0) > 0;
  const rollupCost = hasChildren ? aggregateCost(span) : 0;
  const dur = durationMs(span);
  const tip = `${span.name} · ${formatDurationMs(dur)}`;

  return (
    <button
      type="button"
      data-slot="span-waterfall-row"
      aria-label={`Timeline: ${tip}`}
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(span.id)}
      title={tip}
      className="flex w-full items-center gap-2 rounded-sm py-0.5 text-left hover:bg-muted/40"
    >
      <span
        aria-hidden="true"
        className="min-w-0 shrink-0 basis-40 truncate font-mono text-xs"
        style={{ paddingLeft: `${row * 8}px` }}
      >
        {span.name}
      </span>
      <span
        className="relative block h-4 flex-1 overflow-hidden rounded-sm bg-muted/30"
        aria-hidden="true"
      >
        <span
          data-slot="span-waterfall-bar"
          data-error={error ? "true" : undefined}
          data-selected={selected ? "true" : undefined}
          data-unbounded={unbounded ? "true" : undefined}
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "2px" }}
          className={cn(
            "absolute top-0.5 bottom-0.5 rounded-sm",
            error ? "bg-destructive" : "bg-primary/60",
            selected && "ring-2 ring-primary ring-offset-1",
            unbounded && "border border-primary/60 border-dashed bg-transparent",
          )}
        />
      </span>
      {hasChildren && rollupCost > 0 ? (
        <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
          ∑ {formatCostUsd(rollupCost)}
        </Badge>
      ) : null}
    </button>
  );
}
