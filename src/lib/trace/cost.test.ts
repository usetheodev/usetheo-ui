import { describe, expect, it } from "vitest";
import { aggregateCost, spanCostUsd, spanOwnCostUsd } from "./cost.js";
import type { TraceSpan } from "./types.js";

const span = (over: Partial<TraceSpan>): TraceSpan => ({
  id: over.id ?? "s",
  parentId: over.parentId ?? null,
  name: over.name ?? "op",
  ...over,
});

// spanOwnCostUsd is the PER-SPAN display cost: it returns `undefined` when a span has no
// individually-computed cost, so the UI renders `—` (em-dash) instead of a fabricated `$0.0000`.
// This is distinct from spanCostUsd/aggregateCost, which collapse to 0 for honest `∑` badges.
describe("spanOwnCostUsd", () => {
  it("test_a_span_without_a_cost_returns_undefined_never_zero", () => {
    expect(spanOwnCostUsd(span({}))).toBeUndefined();
  });

  it("test_a_positive_costUsd_returns_the_value", () => {
    expect(spanOwnCostUsd(span({ costUsd: 0.0234 }))).toBe(0.0234);
  });

  it("test_a_zero_or_negative_costUsd_returns_undefined", () => {
    // A literal 0 is "no individually-computed cost" for display — not a computed $0.0000.
    expect(spanOwnCostUsd(span({ costUsd: 0 }))).toBeUndefined();
    expect(spanOwnCostUsd(span({ costUsd: -5 }))).toBeUndefined();
  });

  it("test_reads_the_cost_attribute_when_the_field_is_absent", () => {
    expect(spanOwnCostUsd(span({ attributes: { "gen_ai.usage.cost": "0.5" } }))).toBe(0.5);
  });

  it("test_a_zero_attribute_returns_undefined", () => {
    expect(spanOwnCostUsd(span({ attributes: { cost_usd: "0" } }))).toBeUndefined();
  });
});

// Regression guard: the aggregate helpers are UNCHANGED — absent cost still sums as an honest 0
// (a `∑`-badge of $0.00 over zero-cost spans is legitimate; only per-span DISPLAY em-dashes).
describe("spanCostUsd / aggregateCost stay honest-zero", () => {
  it("test_an_absent_spanCostUsd_collapses_to_zero", () => {
    expect(spanCostUsd(span({}))).toBe(0);
    expect(spanCostUsd(span({ costUsd: 0 }))).toBe(0);
  });

  it("test_aggregateCost_sums_to_zero_never_undefined", () => {
    const tree = span({ id: "r", children: [span({ id: "a" }), span({ id: "b", costUsd: 0.1 })] });
    expect(aggregateCost(tree)).toBeCloseTo(0.1, 6);
  });
});
