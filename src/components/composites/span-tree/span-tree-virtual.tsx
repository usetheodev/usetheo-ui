import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { FlatSpan } from "../../../lib/trace/types.js";
import { SpanTreeRow } from "./span-tree-row.js";
import type { SpanTreeRenderCtx } from "./span-tree.js";

export interface SpanTreeVirtualProps extends SpanTreeRenderCtx {
  flat: FlatSpan[];
}

/** Virtualized flat-list tree (large traces at/above the threshold), reusing @tanstack/react-virtual. */
export function SpanTreeVirtual({
  flat,
  selectedId,
  collapsed,
  showMetrics,
  bounds,
  onSelect,
  onToggle,
  renderBadge,
}: SpanTreeVirtualProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 20,
    // A default viewport so rows render before the real ResizeObserver measures the element
    // (SSR/jsdom have no layout). The real observer overrides this in the browser.
    initialRect: { width: 320, height: 640 },
  });

  // Scroll the selected row into view when selection changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on selectedId only
  useEffect(() => {
    const index = flat.findIndex((f) => f.span.id === selectedId);
    if (index >= 0) virtualizer.scrollToIndex(index, { align: "center", behavior: "auto" });
  }, [selectedId]);

  return (
    <div ref={parentRef} data-slot="span-tree-virtual" className="max-h-[70vh] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const row = flat[vi.index];
          if (!row) return null;
          return (
            <div
              key={`${vi.index}-${row.span.id}`}
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
              <SpanTreeRow
                span={row.span}
                depth={row.depth}
                selected={row.span.id === selectedId}
                collapsed={collapsed.has(row.span.id)}
                hasChildren={(row.span.children?.length ?? 0) > 0}
                posinset={vi.index + 1}
                setsize={flat.length}
                showMetrics={showMetrics}
                bounds={bounds}
                onSelect={onSelect}
                onToggle={onToggle}
                renderBadge={renderBadge}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
