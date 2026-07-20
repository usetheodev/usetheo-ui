import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { cn } from "../../../lib/cn.js";
import { formatDurationMs } from "../../../lib/trace/duration.js";
import { toTranscriptRows } from "../../../lib/trace/flatten.js";
import type { TraceSpan, TranscriptRow } from "../../../lib/trace/types.js";
import { Badge } from "../../primitives/badge/index.js";
import { EmptyState } from "../../primitives/empty-state/index.js";

export interface TraceTranscriptProps {
  /** Trace root — the row model is derived via `toTranscriptRows`. */
  root: TraceSpan;
  /** Pre-computed rows (overrides `root` derivation — mainly for tests / custom row models). */
  rows?: TranscriptRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Collapsed group ids (subagent subtrees). Uncontrolled-friendly: omit to keep all expanded. */
  collapsedGroups?: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  /** USD cost formatter for per-row stats. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  /** Row count at/above which the virtualized path engages. Default 200. */
  virtualizeThreshold?: number;
  className?: string;
  "aria-label"?: string;
}

const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

/**
 * TraceTranscript — a reader-mode feed of a trace: one card per span (role
 * badge + name + output preview + micro-stats), with collapsible group
 * headers for subagent subtrees. Virtualizes at/above `virtualizeThreshold`.
 * Controlled selection; group collapse is controlled when `collapsedGroups`
 * is supplied. Escaped text only.
 */
export function TraceTranscript({
  root,
  rows: rowsProp,
  selectedId,
  onSelect,
  collapsedGroups,
  onToggleGroup,
  formatCostUsd = defaultCost,
  virtualizeThreshold = 200,
  className,
  "aria-label": ariaLabel = "Trace transcript",
}: TraceTranscriptProps) {
  const allRows = useMemo(() => rowsProp ?? toTranscriptRows(root), [rowsProp, root]);

  // Hide every row belonging to a span that DESCENDS from a collapsed group. Descendants come from the
  // tree (not a flat heuristic), so nested groups collapse correctly. The group's own span row + header
  // stay visible (that's the expand affordance); only its subtree hides.
  const hidden = useMemo(() => collectHidden(root, collapsedGroups), [root, collapsedGroups]);
  const visible = useMemo(() => allRows.filter((r) => !hidden.has(r.spanId)), [allRows, hidden]);

  if (visible.length === 0) {
    return <EmptyState title="No transcript" description="This trace has no spans to show." />;
  }

  const virtualized = visible.length >= virtualizeThreshold;
  const ctx = { selectedId, onSelect, collapsedGroups, onToggleGroup, formatCostUsd };

  return (
    <div data-slot="trace-transcript" aria-label={ariaLabel} className={cn("space-y-2", className)}>
      {virtualized ? (
        <VirtualFeed rows={visible} {...ctx} />
      ) : (
        visible.map((row) => <Row key={`${row.kind}-${row.spanId}`} row={row} {...ctx} />)
      )}
    </div>
  );
}

interface RowCtx {
  selectedId: string | null;
  onSelect: (id: string) => void;
  collapsedGroups?: Set<string>;
  onToggleGroup?: (groupId: string) => void;
  formatCostUsd: (usd: number) => string;
}

/**
 * The set of span ids to hide: the DESCENDANTS (not self) of every collapsed group. Uses the tree so
 * nested groups collapse correctly — the flat row order alone can't tell where a subtree ends.
 */
function collectHidden(root: TraceSpan, collapsed?: Set<string>): Set<string> {
  const hidden = new Set<string>();
  if (!collapsed || collapsed.size === 0) return hidden;
  const hideSubtree = (span: TraceSpan) => {
    for (const c of span.children ?? []) {
      hidden.add(c.id);
      hideSubtree(c);
    }
  };
  const walk = (span: TraceSpan) => {
    if (collapsed.has(span.id)) hideSubtree(span);
    for (const c of span.children ?? []) walk(c);
  };
  walk(root);
  return hidden;
}

function Row({ row, ...ctx }: { row: TranscriptRow } & RowCtx) {
  if (row.kind === "group-header") {
    const collapsed = ctx.collapsedGroups?.has(row.groupId ?? "") ?? false;
    return (
      <button
        type="button"
        data-slot="transcript-group"
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand group" : "Collapse group"}
        onClick={() => ctx.onToggleGroup?.(row.groupId ?? "")}
        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-muted-foreground text-xs hover:bg-muted/40"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        subagent group
      </button>
    );
  }
  const selected = row.spanId === ctx.selectedId;
  const stats = row.stats;
  return (
    <button
      type="button"
      data-slot="transcript-span"
      aria-current={selected ? "true" : undefined}
      onClick={() => ctx.onSelect(row.spanId)}
      className={cn(
        "flex w-full flex-col gap-1 rounded-md border border-border p-2 text-left hover:bg-muted/40",
        selected && "bg-muted ring-1 ring-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="shrink-0">
          {row.role ?? "span"}
        </Badge>
        {stats ? (
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
            {stats.inputTokens}→{stats.outputTokens} ·{" "}
            {stats.costUsd === undefined ? "—" : ctx.formatCostUsd(stats.costUsd)} ·{" "}
            {formatDurationMs(stats.durationMs)}
          </span>
        ) : null}
      </div>
      {row.preview ? (
        <p className="line-clamp-2 whitespace-pre-wrap break-words text-body-sm text-muted-foreground">
          {row.preview}
        </p>
      ) : null}
    </button>
  );
}

function VirtualFeed({ rows, ...ctx }: { rows: TranscriptRow[] } & RowCtx) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 12,
    initialRect: { width: 480, height: 640 },
  });
  return (
    <div
      ref={parentRef}
      data-slot="trace-transcript-virtual"
      className="max-h-[70vh] overflow-auto"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const row = rows[vi.index];
          if (!row) return null;
          return (
            <div
              key={`${vi.index}-${row.spanId}`}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
                paddingBottom: 8,
              }}
            >
              <Row row={row} {...ctx} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
