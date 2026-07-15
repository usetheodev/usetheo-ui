import type { Story } from "@ladle/react";
import { useState } from "react";
import type { SessionTraceItem } from "../../../lib/session/types.js";
import { SessionTimeline } from "./session-timeline.js";

export default { title: "Composites / Observability / SessionTimeline" };

const NS = 1_000_000_000n;
const T0 = 1_750_000_000_000_000_000n;

const ITEMS: SessionTraceItem[] = [
  {
    id: "t1",
    name: "agent.run #1",
    startTime: T0,
    endTime: T0 + 3n * NS,
    costUsd: 0.021,
    status: "OK",
  },
  {
    id: "t2",
    name: "agent.run #2",
    startTime: T0 + 4n * NS,
    endTime: T0 + 9n * NS,
    costUsd: 0.048,
    status: "ERROR",
  },
  {
    id: "t3",
    name: "agent.run #3",
    startTime: T0 + 10n * NS,
    endTime: T0 + 12n * NS,
    costUsd: 0.012,
    status: "OK",
  },
];

function Demo({ items }: { items: SessionTraceItem[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div className="max-w-3xl rounded-lg border border-border p-3">
      <SessionTimeline items={items} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

export const Replay: Story = () => <Demo items={ITEMS} />;
export const Empty: Story = () => <Demo items={[]} />;
