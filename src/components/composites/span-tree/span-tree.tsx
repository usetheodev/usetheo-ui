import { type KeyboardEvent, type ReactNode, useMemo } from "react";
import { cn } from "../../../lib/cn.js";
import { VIRTUALIZE_THRESHOLD, flattenVisible } from "../../../lib/trace/flatten.js";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { SpanTreeRow } from "./span-tree-row.js";
import { SpanTreeVirtual } from "./span-tree-virtual.js";

/** Shared render context threaded to every row (kills per-node prop duplication). */
export interface SpanTreeRenderCtx {
  selectedId: string | null;
  collapsed: Set<string>;
  showMetrics?: boolean;
  bounds?: { startNs: bigint; endNs: bigint };
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  renderBadge?: (span: TraceSpan) => ReactNode;
}

export interface SpanTreeProps extends Omit<SpanTreeRenderCtx, "onToggle"> {
  /** Root span of the trace. */
  root: TraceSpan;
  /** Collapse toggle (controlled). */
  onToggleCollapse: (id: string) => void;
  /** Visible-row count at/above which the virtualized path engages. Default 200. */
  virtualizeThreshold?: number;
  className?: string;
  "aria-label"?: string;
}

/**
 * SpanTree — an accessible, controllable tree of trace spans with full
 * WAI-ARIA APG TreeView semantics (treeitem / level / posinset / setsize /
 * selected / expanded / group). Renders recursively for small traces and
 * switches to a virtualized flat-list at/above `virtualizeThreshold`. The
 * container is keyboard-navigable (↑/↓ move, Home/End jump, Enter/Space
 * select). Fully controlled: selection + collapse live in the consumer.
 */
export function SpanTree({
  root,
  selectedId,
  onSelect,
  collapsed,
  onToggleCollapse,
  showMetrics = true,
  bounds,
  virtualizeThreshold = VIRTUALIZE_THRESHOLD,
  renderBadge,
  className,
  "aria-label": ariaLabel = "Trace span tree",
}: SpanTreeProps) {
  const flat = useMemo(() => flattenVisible(root, collapsed), [root, collapsed]);
  const virtualized = flat.length >= virtualizeThreshold;
  const ctx: SpanTreeRenderCtx = {
    selectedId,
    collapsed,
    showMetrics,
    bounds,
    onSelect,
    onToggle: onToggleCollapse,
    renderBadge,
  };

  // ↑/↓ move selection through the visible order; Home/End jump; Enter/Space (re)select.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = flat.findIndex((f) => f.span.id === selectedId);
    const go = (i: number) => {
      const target = flat[i];
      if (target) onSelect(target.span.id);
    };
    if (e.key === "ArrowDown") {
      e.preventDefault();
      go(Math.min(idx + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      go(Math.max(idx - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(flat.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && idx >= 0) {
      e.preventDefault();
      go(idx);
    }
  };

  return (
    <div
      // `role="tree"` is the correct WAI-ARIA pattern here; no native element expresses it.
      // (The `biome-ignore` this comment replaced no longer suppresses anything — Biome stopped
      // flagging the case, and an unused suppression is itself a lint error.)
      role="tree"
      data-slot="span-tree"
      aria-label={ariaLabel}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the tree is a composite widget owning roving focus
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      {virtualized ? (
        <SpanTreeVirtual flat={flat} {...ctx} />
      ) : (
        <RecursiveNode span={root} depth={0} posinset={1} setsize={1} ctx={ctx} />
      )}
    </div>
  );
}

function RecursiveNode({
  span,
  depth,
  posinset,
  setsize,
  ctx,
}: {
  span: TraceSpan;
  depth: number;
  posinset: number;
  setsize: number;
  ctx: SpanTreeRenderCtx;
}) {
  const isCollapsed = ctx.collapsed.has(span.id);
  const children = span.children ?? [];
  return (
    <div>
      <SpanTreeRow
        span={span}
        depth={depth}
        selected={span.id === ctx.selectedId}
        collapsed={isCollapsed}
        hasChildren={children.length > 0}
        posinset={posinset}
        setsize={setsize}
        showMetrics={ctx.showMetrics}
        bounds={ctx.bounds}
        onSelect={ctx.onSelect}
        onToggle={ctx.onToggle}
        renderBadge={ctx.renderBadge}
      />
      {!isCollapsed && children.length > 0 ? (
        <div
          // biome-ignore lint/a11y/useSemanticElements: role="group" is the WAI-ARIA TreeView nesting contract
          role="group"
        >
          {children.map((c, i) => (
            <RecursiveNode
              key={`${i}-${c.id}`}
              span={c}
              depth={depth + 1}
              posinset={i + 1}
              setsize={children.length}
              ctx={ctx}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
