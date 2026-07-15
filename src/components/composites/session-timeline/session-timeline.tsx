import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import { cn } from "../../../lib/cn.js";
import type { SessionTraceItem } from "../../../lib/session/types.js";
import { computeBarLayout } from "../../../lib/trace/bar-layout.js";
import { durationMs, formatDurationMs, isSpanError, toNs } from "../../../lib/trace/duration.js";
import { Badge } from "../../primitives/badge/index.js";
import { EmptyState } from "../../primitives/empty-state/index.js";

export interface SessionTimelineProps {
  /** The session's traces (rendered in start-time order regardless of input order). */
  items: SessionTraceItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** ns → label for the row timestamp. Default ISO datetime. */
  formatTimestamp?: (ns: bigint) => string;
  /** USD cost formatter. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  /** Row count at/above which the virtualized path engages. Default 200. */
  virtualizeThreshold?: number;
  className?: string;
  "aria-label"?: string;
}

const defaultTimestamp = (ns: bigint) => new Date(Number(ns / 1_000_000n)).toISOString();
const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

type Bounds = { startNs: bigint; endNs: bigint };

/**
 * SessionTimeline — a temporal replay of a session: one row per trace, sorted by start time, each
 * showing the timestamp, name, a duration bar relative to the session window (via the trace-core
 * `computeBarLayout`), status, and cost. Controlled selection; virtualizes above the threshold.
 * Escaped text only.
 */
export function SessionTimeline({
  items,
  selectedId,
  onSelect,
  formatTimestamp = defaultTimestamp,
  formatCostUsd = defaultCost,
  virtualizeThreshold = 200,
  className,
  "aria-label": ariaLabel = "Session timeline",
}: SessionTimelineProps) {
  const sorted = useMemo(() => {
    const withNs = items.map((it) => ({ it, ns: toNs(it.startTime) ?? 0n }));
    withNs.sort((a, b) => (a.ns < b.ns ? -1 : a.ns > b.ns ? 1 : a.it.id < b.it.id ? -1 : 1));
    return withNs.map((w) => w.it);
  }, [items]);

  const bounds = useMemo<Bounds>(() => {
    let start: bigint | null = null;
    let end: bigint | null = null;
    for (const it of sorted) {
      const s = toNs(it.startTime);
      if (s === null) continue;
      if (start === null || s < start) start = s;
      const e = toNs(it.endTime ?? null) ?? s;
      const eff = e >= s ? e : s;
      if (end === null || eff > end) end = eff;
    }
    const s = start ?? 0n;
    return { startNs: s, endNs: end ?? s };
  }, [sorted]);

  if (sorted.length === 0) {
    return <EmptyState title="No traces" description="This session has no traces to replay." />;
  }

  const virtualized = sorted.length >= virtualizeThreshold;
  const ctx = { bounds, selectedId, onSelect, formatTimestamp, formatCostUsd };

  return (
    // biome-ignore lint/a11y/useSemanticElements: role="list" keeps the virtualized wrapper divs valid (a <div> cannot be an <li>)
    <div
      role="list"
      data-slot="session-timeline"
      aria-label={ariaLabel}
      className={cn("space-y-1", className)}
    >
      {virtualized ? (
        <VirtualRows items={sorted} {...ctx} />
      ) : (
        sorted.map((it) => <Row key={it.id} item={it} {...ctx} />)
      )}
    </div>
  );
}

interface RowCtx {
  bounds: Bounds;
  selectedId: string | null;
  onSelect: (id: string) => void;
  formatTimestamp: (ns: bigint) => string;
  formatCostUsd: (usd: number) => string;
}

function Row({ item, ...ctx }: { item: SessionTraceItem } & RowCtx) {
  const { leftPct, widthPct, unbounded } = computeBarLayout(
    item.startTime,
    item.endTime,
    ctx.bounds.startNs,
    ctx.bounds.endNs,
  );
  const error = isSpanError(item.status);
  const selected = item.id === ctx.selectedId;
  const startNs = toNs(item.startTime);
  const dur = durationMs({ startTime: item.startTime, endTime: item.endTime });
  return (
    // biome-ignore lint/a11y/useSemanticElements: pairs with the role="list" container (virtualized wrappers forbid <li>)
    <div role="listitem">
      <button
        type="button"
        data-slot="session-timeline-row"
        aria-current={selected ? "true" : undefined}
        onClick={() => ctx.onSelect(item.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted/40",
          selected && "bg-muted ring-1 ring-primary",
        )}
      >
        <span className="w-32 shrink-0 font-mono text-[10px] text-muted-foreground">
          {startNs !== null ? ctx.formatTimestamp(startNs) : "—"}
        </span>
        <span data-testid="session-trace-name" className="w-40 shrink-0 truncate font-mono text-xs">
          {item.name ?? item.id}
        </span>
        <span
          className="relative block h-4 flex-1 overflow-hidden rounded-sm bg-muted/30"
          aria-hidden="true"
        >
          <span
            data-slot="session-timeline-bar"
            data-error={error ? "true" : undefined}
            data-unbounded={unbounded ? "true" : undefined}
            style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: "2px" }}
            className={cn(
              "absolute top-0.5 bottom-0.5 rounded-sm",
              error ? "bg-destructive" : "bg-primary/60",
              unbounded && "border border-primary/60 border-dashed bg-transparent",
            )}
          />
        </span>
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
          {dur !== null ? formatDurationMs(dur) : "—"}
        </span>
        {item.costUsd !== undefined ? (
          <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
            {ctx.formatCostUsd(item.costUsd)}
          </Badge>
        ) : null}
        {error ? (
          <Badge variant="destructive" className="shrink-0">
            error
          </Badge>
        ) : null}
      </button>
    </div>
  );
}

function VirtualRows({ items, ...ctx }: { items: SessionTraceItem[] } & RowCtx) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
    initialRect: { width: 640, height: 640 },
  });
  return (
    <div
      ref={parentRef}
      data-slot="session-timeline-virtual"
      className="max-h-[70vh] overflow-auto"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index];
          if (!item) return null;
          return (
            <div
              key={`${vi.index}-${item.id}`}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <Row item={item} {...ctx} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
