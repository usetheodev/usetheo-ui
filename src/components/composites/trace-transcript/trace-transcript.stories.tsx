import type { Story } from "@ladle/react";
import { useState } from "react";
import { NESTED_TRACE } from "../../../test/fixtures/trace.js";
import { TraceTranscript } from "./trace-transcript.js";

export default { title: "Composites / Observability / TraceTranscript" };

function Demo() {
  const [selectedId, setSelectedId] = useState<string | null>("root");
  const [collapsedGroups, setCollapsed] = useState<Set<string>>(new Set());
  return (
    <div className="max-w-2xl">
      <TraceTranscript
        root={NESTED_TRACE}
        selectedId={selectedId}
        onSelect={setSelectedId}
        collapsedGroups={collapsedGroups}
        onToggleGroup={(id) =>
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

export const ReaderMode: Story = () => <Demo />;
