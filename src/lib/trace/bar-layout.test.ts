import { describe, expect, it } from "vitest";
import { computeBarLayout, computeTraceBounds, niceAxisTicks, packRows } from "./bar-layout.js";
import { aggregateCost, spanCostUsd } from "./cost.js";
import type { TraceSpan } from "./types.js";

const span = (over: Partial<TraceSpan>): TraceSpan => ({
  id: over.id ?? "span-1",
  parentId: over.parentId ?? null,
  name: over.name ?? "op",
  ...over,
});

describe("computeTraceBounds", () => {
  it("test_bounds_takes_the_smallest_start_and_largest_end_of_the_whole_tree", () => {
    const root = span({
      id: "root",
      startTime: 100n,
      endTime: 200n,
      children: [span({ id: "span-2", parentId: "root", startTime: 50n, endTime: 400n })],
    });
    expect(computeTraceBounds(root)).toEqual({ startNs: 50n, endNs: 400n });
  });

  it("test_bounds_falls_back_to_start_when_end_is_absent", () => {
    const root = span({ id: "root", startTime: 100n });
    expect(computeTraceBounds(root)).toEqual({ startNs: 100n, endNs: 100n });
  });

  it("test_bounds_of_a_trace_without_timestamps_returns_zero", () => {
    expect(computeTraceBounds(span({ id: "root" }))).toEqual({ startNs: 0n, endNs: 0n });
  });
});

describe("computeBarLayout", () => {
  it("test_bar_maps_to_a_percentage_of_the_window", () => {
    const l = computeBarLayout(25n, 75n, 0n, 100n);
    expect(l).toEqual({ leftPct: 25, widthPct: 50, unbounded: false });
  });

  it("test_bar_clamps_to_0_100_and_marks_unbounded_without_end", () => {
    const l = computeBarLayout(150n, undefined, 0n, 100n);
    expect(l.leftPct).toBeLessThanOrEqual(100);
    expect(l.widthPct).toBe(0);
    expect(l.unbounded).toBe(true);
  });

  it("test_clock_skew_end_before_start_becomes_unbounded_without_throwing", () => {
    const l = computeBarLayout(80n, 20n, 0n, 100n);
    expect(l.unbounded).toBe(true);
    expect(l.widthPct).toBe(0);
  });

  it("test_a_zero_duration_window_does_not_throw", () => {
    expect(() => computeBarLayout(10n, 20n, 50n, 50n)).not.toThrow();
  });

  it("test_an_unparseable_start_becomes_unbounded", () => {
    expect(computeBarLayout("garbage", "20", 0n, 100n).unbounded).toBe(true);
  });
});

describe("niceAxisTicks", () => {
  it("test_ticks_use_the_1_2_5_ladder_and_respect_the_width", () => {
    const ticks = niceAxisTicks(0n, 10_000_000_000n, 600); // 10s / 600px
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks[0]).toMatchObject({ offsetNs: 0n, leftPct: 0 });
    expect(ticks.at(-1)?.leftPct).toBeLessThanOrEqual(100);
  });

  it("test_ticks_of_a_degenerate_window_return_empty", () => {
    expect(niceAxisTicks(100n, 100n, 600)).toEqual([]);
    expect(niceAxisTicks(0n, 100n, 0)).toEqual([]);
  });
});

describe("packRows", () => {
  it("test_overlapping_spans_land_on_distinct_rows", () => {
    const rows = packRows([
      { id: "a", startNs: 0n, endNs: 100n },
      { id: "b", startNs: 50n, endNs: 150n },
      { id: "c", startNs: 100n, endNs: 200n },
    ]);
    expect(rows.get("a")).toBe(0);
    expect(rows.get("b")).toBe(1);
    expect(rows.get("c")).toBe(0); // reuses row 0, which ended at 100
  });

  it("test_an_empty_list_returns_an_empty_map", () => {
    expect(packRows([]).size).toBe(0);
  });
});

describe("spanCostUsd / aggregateCost", () => {
  it("test_cost_prefers_the_promoted_field_and_falls_back_to_the_attribute", () => {
    expect(spanCostUsd(span({ costUsd: 0.5 }))).toBe(0.5);
    expect(spanCostUsd(span({ attributes: { "gen_ai.usage.cost": "0.25" } }))).toBe(0.25);
    expect(spanCostUsd(span({}))).toBe(0);
  });

  it("test_a_negative_or_non_numeric_cost_becomes_zero_never_nan", () => {
    expect(spanCostUsd(span({ costUsd: -1 }))).toBe(0);
    expect(spanCostUsd(span({ attributes: { cost: "abc" } }))).toBe(0);
  });

  it("test_aggregate_cycle_safe_counts_once", () => {
    const cyc = span({ id: "c", costUsd: 1 });
    cyc.children = [cyc];
    expect(aggregateCost(cyc)).toBe(1);
  });

  it("test_aggregate_soma_subtree", () => {
    const root = span({
      costUsd: 1,
      children: [span({ id: "span-2", costUsd: 2 }), span({ id: "span-3", costUsd: 3 })],
    });
    expect(aggregateCost(root)).toBe(6);
  });
});
