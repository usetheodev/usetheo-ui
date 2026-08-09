import { describe, expect, it } from "vitest";
import { alignSpanTrees, traceMetrics } from "./align.js";
import type { TraceSpan } from "./types.js";

const span = (over: Partial<TraceSpan>): TraceSpan => ({
  id: over.id ?? "s",
  parentId: over.parentId ?? null,
  name: over.name ?? "op",
  ...over,
});

describe("alignSpanTrees", () => {
  it("test_equal_pairs_end_up_matched_with_a_delta", () => {
    const a = span({ id: "a-root", name: "run", startTime: 0n, endTime: 2_000_000n });
    const b = span({ id: "b-root", name: "run", startTime: 0n, endTime: 4_000_000n });
    const rows = alignSpanTrees(a, b);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("matched");
    expect(rows[0]?.delta?.durationMs?.to).toBe(4);
  });

  it("test_a_span_only_in_a_is_marked_only_in_a_and_its_delta_suppressed", () => {
    const a = span({ id: "ar", name: "run", children: [span({ id: "a1", name: "extra" })] });
    const b = span({ id: "br", name: "run" });
    const rows = alignSpanTrees(a, b);
    const extra = rows.find((r) => r.key === "extra");
    expect(extra?.status).toBe("only-in-a");
    expect(extra?.delta).toBeUndefined();
  });

  it("test_a_span_only_in_b_is_marked_only_in_b", () => {
    const a = span({ id: "ar", name: "run" });
    const b = span({ id: "br", name: "run", children: [span({ id: "b1", name: "added" })] });
    const rows = alignSpanTrees(a, b);
    expect(rows.find((r) => r.key === "added")?.status).toBe("only-in-b");
  });

  it("test_a_malformed_cycle_does_not_hang", () => {
    const cyc = span({ id: "x", name: "x" });
    cyc.children = [cyc]; // self-reference
    const rows = alignSpanTrees(cyc, span({ id: "y", name: "x" }));
    expect(rows.length).toBeGreaterThanOrEqual(1); // terminou + emitiu ao menos a raiz
    expect(rows[0]?.key).toBe("x");
  });

  it("test_children_pair_by_name", () => {
    const a = span({
      id: "ar",
      name: "run",
      children: [span({ id: "a1", name: "step", startTime: 0n, endTime: 1_000_000n })],
    });
    const b = span({
      id: "br",
      name: "run",
      children: [span({ id: "b1", name: "step", startTime: 0n, endTime: 3_000_000n })],
    });
    const rows = alignSpanTrees(a, b);
    const step = rows.find((r) => r.key === "step");
    expect(step?.status).toBe("matched");
    expect(step?.delta?.durationMs?.deltaPct).toBeGreaterThan(0);
  });
});

describe("traceMetrics", () => {
  it("test_aggregates_duration_tokens_cost_and_error", () => {
    const root = span({
      id: "r",
      name: "run",
      startTime: 0n,
      endTime: 5_000_000n,
      inputTokens: 100,
      outputTokens: 50,
      costUsd: 0.01,
      children: [span({ id: "c", name: "c", status: "ERROR", costUsd: 0.02 })],
    });
    const m = traceMetrics(root);
    expect(m.durationMs).toBe(5);
    expect(m.totalTokens).toBe(150);
    expect(m.costUsd).toBeCloseTo(0.03);
    expect(m.hasError).toBe(true);
  });
});
