/**
 * Shared trace fixtures for the trace-native component family (M8 T1.1).
 * Modeled after real agent traces from the theo-lens suite: branching,
 * a retried tool call, an errored span, an orphan (malformed parent) and a
 * clock-skewed span. Deterministic — no Date.now(), no randomness.
 */

import type { TraceSpan } from "../../lib/trace/types.js";

const NS = 1_000_000_000n; // 1s in ns
const T0 = 1_750_000_000_000_000_000n; // fixed epoch ns

/** Root-span factory — the shared shell every fixture starts from. */
function rootSpan(endOffsetNs: bigint, children: TraceSpan[]): TraceSpan {
  return {
    id: "root",
    parentId: null,
    name: "agent.run",
    startTime: T0,
    endTime: T0 + endOffsetNs,
    children,
  };
}

/**
 * Nested agent trace: root agent → llm plan → 2 tool branches (one retried,
 * one errored) → final llm answer. 7 spans, depth 3.
 */
export const NESTED_TRACE: TraceSpan = {
  ...rootSpan(10n * NS, []),
  status: "OK",
  attributes: { "gen_ai.operation.name": "chat" },
  children: [
    {
      id: "plan",
      parentId: "root",
      name: "llm.plan",
      model: "claude-fable-5",
      startTime: T0,
      endTime: T0 + 2n * NS,
      status: "OK",
      inputTokens: 900,
      outputTokens: 120,
      costUsd: 0.012,
      inputValue: JSON.stringify([
        { role: "system", content: "You are a travel agent." },
        { role: "user", content: "Find flights POA→GRU" },
      ]),
      outputValue: JSON.stringify([{ role: "assistant", content: "Searching flights…" }]),
    },
    {
      id: "search-1",
      parentId: "root",
      name: "tool.search_flights",
      startTime: T0 + 2n * NS,
      endTime: T0 + 4n * NS,
      status: "ERROR",
      attributes: { "gen_ai.tool.name": "search_flights", "user.email": "pii@example.com" },
      outputValue: "upstream timeout",
      children: [
        {
          id: "search-retry",
          parentId: "search-1",
          name: "tool.search_flights#retry",
          startTime: T0 + 4n * NS,
          endTime: T0 + 6n * NS,
          status: "OK",
          attributes: { "gen_ai.tool.name": "search_flights" },
          outputValue: JSON.stringify({ flights: [{ id: "G3-1001" }, { id: "LA-3322" }] }),
        },
      ],
    },
    {
      id: "answer",
      parentId: "root",
      name: "llm.answer",
      model: "claude-fable-5",
      startTime: T0 + 6n * NS,
      endTime: T0 + 10n * NS,
      status: "OK",
      inputTokens: 1400,
      outputTokens: 480,
      costUsd: 0.031,
      outputValue: JSON.stringify([
        { role: "assistant", content: "Found 2 flights: **G3-1001** and LA-3322." },
      ]),
    },
  ],
};

/** Trace with an orphan (parent missing from the tree) and a clock-skewed span. */
export const MALFORMED_TRACE: TraceSpan = rootSpan(5n * NS, [
  {
    id: "orphan",
    parentId: "ghost-not-in-trace",
    name: "tool.detached",
    startTime: T0 + NS,
    endTime: T0 + 2n * NS,
  },
  {
    id: "skewed",
    parentId: "root",
    name: "llm.skewed",
    startTime: T0 + 4n * NS,
    endTime: T0 + 3n * NS,
  },
  {
    id: "inflight",
    parentId: "root",
    name: "tool.streaming",
    startTime: T0 + 4n * NS,
    endTime: null,
  },
]);

/**
 * Deterministic wide trace generator for virtualization paths: `n` children
 * under one root, timings derived from the index (no randomness).
 */
export function makeTrace(n: number): TraceSpan {
  return rootSpan(
    BigInt(n + 1) * NS,
    Array.from({ length: n }, (_, i) => ({
      id: `gen-${i}`,
      parentId: "root",
      name: `tool.step_${i}`,
      startTime: T0 + BigInt(i) * NS,
      endTime: T0 + BigInt(i + 1) * NS,
      status: i % 17 === 0 ? ("ERROR" as const) : ("OK" as const),
    })),
  );
}
