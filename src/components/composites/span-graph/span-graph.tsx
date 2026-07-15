import { useMemo } from "react";
import { cn } from "../../../lib/cn.js";
import { KIND_LABEL, buildLayeredGraph } from "../../../lib/trace/graph-layout.js";
import type { TraceSpan } from "../../../lib/trace/types.js";

const NODE_W = 132;
const NODE_H = 44;
const PAD = 24;

export interface SpanGraphProps {
  root: TraceSpan;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Max spans before the honest "too large" state renders. Default 200. */
  nodeCap?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * SpanGraph — a deterministic, dependency-free SVG rendering of the trace as a
 * layered agent graph (depth = distance from root, order = index within
 * depth). Edges follow parent/call order; the root→selected path is
 * highlighted. Over `nodeCap` spans it renders an honest "too large" state
 * instead of an unreadable hairball. No layout lib (elkjs/d3) — SVG-pure by
 * ADR D4. Nodes are focusable buttons; selection is controlled.
 */
export function SpanGraph({
  root,
  selectedId,
  onSelect,
  nodeCap = 200,
  className,
  "aria-label": ariaLabel = "Agent graph",
}: SpanGraphProps) {
  const graph = useMemo(
    () => buildLayeredGraph(root, selectedId ?? undefined, nodeCap),
    [root, selectedId, nodeCap],
  );

  if (graph.truncated) {
    return (
      <div
        data-slot="span-graph"
        className={cn(
          "rounded-md border border-border border-dashed p-4 text-center text-body-sm text-muted-foreground",
          className,
        )}
      >
        Graph too large to render ({graph.count} spans &gt; {nodeCap} cap). Use the tree or
        waterfall view instead.
      </div>
    );
  }

  const width = graph.width + PAD * 2 + NODE_W;
  const height = graph.height + PAD * 2;
  const byId = new Map(graph.nodes.map((n) => [n.spanId, n]));

  return (
    <div data-slot="span-graph" className={cn("overflow-auto", className)}>
      {/* biome-ignore lint/a11y/useSemanticElements: an SVG scene graph is the correct container here */}
      <svg
        role="group"
        aria-label={ariaLabel}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full"
      >
        <title>{ariaLabel}</title>
        {graph.edges.map((e) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              data-slot="span-graph-edge"
              data-on-path={e.onPath ? "true" : undefined}
              x1={from.x + PAD + NODE_W / 2}
              y1={from.y + PAD + NODE_H}
              x2={to.x + PAD + NODE_W / 2}
              y2={to.y + PAD}
              className={cn("stroke-1", e.onPath ? "stroke-primary" : "stroke-border")}
            />
          );
        })}
        {graph.nodes.map((n) => (
          <g
            key={n.spanId}
            data-slot="span-graph-node"
            data-span-id={n.spanId}
            data-error={n.error ? "true" : undefined}
            data-selected={n.selected ? "true" : undefined}
            transform={`translate(${n.x + PAD}, ${n.y + PAD})`}
            onClick={() => onSelect(n.spanId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(n.spanId);
              }
            }}
            tabIndex={0}
            // biome-ignore lint/a11y/useSemanticElements: a native <button> cannot be a child of <svg>; role="button" on <g> is the accessible-SVG idiom
            role="button"
            aria-label={`${KIND_LABEL[n.kind]}: ${n.name}`}
            aria-current={n.selected ? "true" : undefined}
            className="cursor-pointer outline-none focus-visible:[&>rect]:stroke-ring"
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={6}
              className={cn(
                "fill-card stroke-1",
                n.error ? "stroke-destructive" : "stroke-border",
                n.selected && "stroke-2 stroke-primary",
              )}
            />
            <circle cx={12} cy={NODE_H / 2} r={4} className={dotClass(n.kind)} />
            <text x={24} y={NODE_H / 2 - 2} className="fill-foreground font-mono text-[10px]">
              {truncate(n.name, 16)}
            </text>
            <text x={24} y={NODE_H / 2 + 12} className="fill-muted-foreground text-[9px]">
              {KIND_LABEL[n.kind]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function dotClass(kind: string): string {
  switch (kind) {
    case "llm":
      return "fill-primary";
    case "tool":
      return "fill-warning";
    case "retriever":
      return "fill-info";
    case "embedding":
      return "fill-accent";
    case "chain":
      return "fill-success";
    default:
      return "fill-muted-foreground";
  }
}
