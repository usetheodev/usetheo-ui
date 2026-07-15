import type { Story } from "@ladle/react";
import { useState } from "react";
import { computeTraceBounds } from "../../../lib/trace/bar-layout.js";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { MALFORMED_TRACE, NESTED_TRACE, makeTrace } from "../../../test/fixtures/trace.js";
import { SpanTree } from "./span-tree.js";

export default { title: "Composites / Observability / SpanTree" };

function Demo({ root, withBars = false }: { root: TraceSpan; withBars?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  return (
    <div className="max-w-2xl rounded-lg border border-border p-3">
      <SpanTree
        root={root}
        selectedId={selectedId}
        onSelect={setSelectedId}
        collapsed={collapsed}
        bounds={withBars ? computeTraceBounds(root) : undefined}
        onToggleCollapse={(id) =>
          setCollapsed((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })
        }
      />
    </div>
  );
}

export const NestedAgentTrace: Story = () => <Demo root={NESTED_TRACE} />;
export const WithTimelineBars: Story = () => <Demo root={NESTED_TRACE} withBars />;
export const Malformed: Story = () => <Demo root={MALFORMED_TRACE} />;
export const Virtualized250Spans: Story = () => <Demo root={makeTrace(250)} />;
