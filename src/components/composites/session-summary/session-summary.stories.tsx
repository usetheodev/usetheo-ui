import type { Story } from "@ladle/react";
import type { SessionTraceItem } from "../../../lib/session/types.js";
import { SessionSummary } from "./session-summary.js";

export default { title: "Composites / Observability / SessionSummary" };

const NS = 1_000_000_000n;
const T0 = 1_750_000_000_000_000_000n;

const ITEMS: SessionTraceItem[] = [
  {
    id: "a",
    startTime: T0,
    endTime: T0 + 2n * NS,
    costUsd: 0.021,
    totalTokens: 920,
    model: "claude-haiku-4-5",
    status: "OK",
  },
  {
    id: "b",
    startTime: T0 + 2n * NS,
    endTime: T0 + 7n * NS,
    costUsd: 0.048,
    totalTokens: 2100,
    model: "claude-fable-5",
    status: "ERROR",
  },
  {
    id: "c",
    startTime: T0 + 7n * NS,
    endTime: T0 + 9n * NS,
    costUsd: 0.012,
    totalTokens: 640,
    model: "claude-haiku-4-5",
    status: "OK",
  },
];

export const ThreeTraces: Story = () => (
  <div className="max-w-3xl">
    <SessionSummary items={ITEMS} />
  </div>
);

export const Empty: Story = () => (
  <div className="max-w-3xl">
    <SessionSummary items={[]} />
  </div>
);
