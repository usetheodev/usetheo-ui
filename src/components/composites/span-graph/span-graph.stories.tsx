import type { Story } from "@ladle/react";
import { useState } from "react";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { MALFORMED_TRACE, NESTED_TRACE } from "../../../test/fixtures/trace.js";
import { SpanGraph } from "./span-graph.js";

export default { title: "Composites / Observability / SpanGraph" };

function Demo({ root }: { root: TraceSpan }) {
  const [selectedId, setSelectedId] = useState<string | null>("root");
  return (
    <div className="max-w-3xl rounded-lg border border-border p-3">
      <SpanGraph root={root} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

export const AgentGraph: Story = () => <Demo root={NESTED_TRACE} />;
export const WithOrphan: Story = () => <Demo root={MALFORMED_TRACE} />;
