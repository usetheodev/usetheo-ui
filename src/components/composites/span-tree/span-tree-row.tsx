import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { computeBarLayout } from "../../../lib/trace/bar-layout.js";
import { durationMs, formatDurationMs, isSpanError } from "../../../lib/trace/duration.js";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { Badge } from "../../primitives/badge/index.js";

export interface SpanTreeRowProps {
  span: TraceSpan;
  depth: number;
  selected: boolean;
  collapsed: boolean;
  hasChildren: boolean;
  posinset: number;
  setsize: number;
  showMetrics?: boolean;
  /** Optional trace window for the inline timeline bar. */
  bounds?: { startNs: bigint; endNs: bigint };
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  renderBadge?: (span: TraceSpan) => ReactNode;
}

/** The single clickable row for a span — shared by the recursive and virtualized paths. */
export function SpanTreeRow({
  span,
  depth,
  selected,
  collapsed,
  hasChildren,
  posinset,
  setsize,
  showMetrics = true,
  bounds,
  onSelect,
  onToggle,
  renderBadge,
}: SpanTreeRowProps) {
  const dur = durationMs(span);
  const error = isSpanError(span.status);
  return (
    <div
      role="treeitem"
      data-slot="span-tree-row"
      aria-level={depth + 1}
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-selected={selected}
      aria-expanded={hasChildren ? !collapsed : undefined}
      className="flex items-center gap-2"
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      {hasChildren ? (
        <button
          type="button"
          aria-label={collapsed ? `Expand ${span.name}` : `Collapse ${span.name}`}
          aria-expanded={!collapsed}
          onClick={() => onToggle(span.id)}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted/50"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <span className="w-4 shrink-0" aria-hidden="true" />
      )}
      <button
        type="button"
        tabIndex={-1}
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(span.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 pr-2 text-left text-body-sm hover:bg-muted/50",
          selected && "bg-muted font-medium",
        )}
      >
        <span className="min-w-0 truncate font-mono text-xs">{span.name}</span>
        {showMetrics && dur !== null ? (
          <span className="shrink-0 text-muted-foreground text-xs">{formatDurationMs(dur)}</span>
        ) : null}
        {span.model ? (
          <Badge variant="outline" className="shrink-0">
            {span.model}
          </Badge>
        ) : null}
        {showMetrics && (span.inputTokens !== undefined || span.outputTokens !== undefined) ? (
          <span className="shrink-0 text-muted-foreground text-xs">
            {span.inputTokens ?? 0}→{span.outputTokens ?? 0}
          </span>
        ) : null}
        {error ? (
          <Badge variant="destructive" className="shrink-0">
            error
          </Badge>
        ) : null}
        {renderBadge?.(span)}
        {bounds ? <InlineBar span={span} bounds={bounds} error={error} /> : null}
      </button>
    </div>
  );
}

/** Positioned timeline bar sized by `computeBarLayout`. Presentational (aria-hidden). */
function InlineBar({
  span,
  bounds,
  error,
}: {
  span: TraceSpan;
  bounds: { startNs: bigint; endNs: bigint };
  error: boolean;
}) {
  const { leftPct, widthPct, unbounded } = computeBarLayout(
    span.startTime,
    span.endTime,
    bounds.startNs,
    bounds.endNs,
  );
  return (
    <span
      className="relative ml-2 block h-4 min-w-[64px] flex-1 overflow-hidden rounded-sm bg-muted/30"
      aria-hidden="true"
    >
      <span
        data-slot="span-tree-bar"
        data-error={error ? "true" : undefined}
        data-unbounded={unbounded ? "true" : undefined}
        style={{ left: `${leftPct}%`, width: `max(${widthPct}%, 2px)` }}
        className={cn(
          "absolute top-0.5 bottom-0.5 rounded-sm",
          error ? "bg-destructive" : "bg-primary/60",
          unbounded && "border border-primary/60 border-dashed bg-transparent",
        )}
      />
    </span>
  );
}
