import type { Story } from "@ladle/react";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { TraceCompare } from "./trace-compare.js";

export default { title: "Composites / Observability / TraceCompare" };

const T0 = 1_750_000_000_000_000_000n;
const NS = 1_000_000_000n;

const laneA: TraceSpan = {
  id: "trace-A",
  parentId: null,
  name: "agent.run",
  startTime: T0,
  endTime: T0 + 4n * NS,
  inputTokens: 900,
  outputTokens: 320,
  costUsd: 0.04,
  children: [
    { id: "a1", parentId: "trace-A", name: "tool.search", startTime: T0, endTime: T0 + 2n * NS },
  ],
};

const laneB: TraceSpan = {
  id: "trace-B",
  parentId: null,
  name: "agent.run",
  startTime: T0,
  endTime: T0 + 9n * NS,
  inputTokens: 1800,
  outputTokens: 640,
  costUsd: 0.09,
  children: [
    { id: "b1", parentId: "trace-B", name: "tool.search", startTime: T0, endTime: T0 + 3n * NS },
    {
      id: "b2",
      parentId: "trace-B",
      name: "tool.rerank",
      startTime: T0 + 3n * NS,
      endTime: T0 + 6n * NS,
    },
  ],
};

export const SideBySide: Story = () => (
  <div className="max-w-4xl">
    <TraceCompare laneA={{ id: "trace-A", root: laneA }} laneB={{ id: "trace-B", root: laneB }} />
  </div>
);

export const OneLanePending: Story = () => (
  <div className="max-w-4xl">
    <TraceCompare
      laneA={{ id: "trace-A", root: laneA }}
      laneB={{ id: "trace-B", root: laneB, pending: true }}
    />
  </div>
);
