import type { Story } from "@ladle/react";
import { useState } from "react";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { MALFORMED_TRACE, NESTED_TRACE } from "../../../test/fixtures/trace.js";
import { SpanWaterfall } from "./span-waterfall.js";

export default { title: "Composites / Observability / SpanWaterfall" };

function Demo({ root }: { root: TraceSpan }) {
  const [selectedId, setSelectedId] = useState<string | null>(root.id);
  return (
    <div className="max-w-2xl rounded-lg border border-border p-3">
      <SpanWaterfall
        root={root}
        selectedId={selectedId}
        onSelect={setSelectedId}
        collapsed={new Set()}
      />
    </div>
  );
}

export const NestedAgentTrace: Story = () => <Demo root={NESTED_TRACE} />;
export const WithOrphanAndSkew: Story = () => <Demo root={MALFORMED_TRACE} />;
