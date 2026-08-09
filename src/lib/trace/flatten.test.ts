import { describe, expect, it } from "vitest";
import { VIRTUALIZE_THRESHOLD, flattenAll, flattenVisible, toTranscriptRows } from "./flatten.js";
import type { TraceSpan } from "./types.js";

const span = (over: Partial<TraceSpan>): TraceSpan => ({
  id: over.id ?? "span-1",
  parentId: over.parentId ?? null,
  name: over.name ?? "op",
  ...over,
});

const TREE = span({
  id: "root",
  children: [
    span({ id: "a", parentId: "root", children: [span({ id: "b", parentId: "a" })] }),
    span({ id: "c", parentId: "root" }),
  ],
});

describe("flattenVisible", () => {
  it("test_flattenVisible_respects_the_collapsed_set_and_dfs_order", () => {
    const rows = flattenVisible(TREE, new Set(["a"]));
    expect(rows.map((r) => r.span.id)).toEqual(["root", "a", "c"]);
  });

  it("test_flattenVisible_without_collapse_yields_the_full_dfs_with_depth", () => {
    const rows = flattenVisible(TREE, new Set());
    expect(rows.map((r) => r.span.id)).toEqual(["root", "a", "b", "c"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 1]);
  });
});

describe("flattenAll", () => {
  it("test_flattenAll_ignores_collapse", () => {
    expect(flattenAll(TREE)).toHaveLength(4);
  });

  it("test_flattenAll_cycle_safe_nao_stack_overflow", () => {
    const cyc = span({ id: "c" });
    cyc.children = [cyc]; // self-reference
    expect(flattenAll(cyc)).toHaveLength(1);
  });
});

describe("toTranscriptRows", () => {
  it("test_a_fan_out_gets_a_group_header_before_its_children", () => {
    const rows = toTranscriptRows(TREE); // the root has 2 children → a group header
    expect(rows[0]).toMatchObject({ kind: "span", spanId: "root" });
    expect(rows[1]).toMatchObject({ kind: "group-header", groupId: "root" });
  });

  it("test_a_single_span_yields_one_row_without_a_header", () => {
    const rows = toTranscriptRows(span({ id: "solo" }));
    expect(rows).toEqual([expect.objectContaining({ kind: "span", spanId: "solo" })]);
  });

  it("test_absent_stats_collapse_to_zero_never_nan", () => {
    const rows = toTranscriptRows(span({ id: "solo" }));
    expect(rows[0]?.stats).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      durationMs: null,
    });
    // Cost is a per-span DISPLAY value, not a sum: a span with no individually-computed cost
    // carries `undefined` (→ em-dash in the feed), never a fabricated 0 (→ "$0.0000").
    expect(rows[0]?.stats?.costUsd).toBeUndefined();
  });

  it("test_stats_with_their_own_cost_preserve_the_value", () => {
    const rows = toTranscriptRows(span({ id: "solo", costUsd: 0.0234 }));
    expect(rows[0]?.stats?.costUsd).toBe(0.0234);
  });

  it("test_the_preview_truncates_to_one_line", () => {
    const rows = toTranscriptRows(span({ id: "solo", outputValue: `${"x".repeat(200)}\nsecond` }));
    expect(rows[0]?.preview?.length).toBeLessThanOrEqual(141);
    expect(rows[0]?.preview).not.toContain("\n");
  });
});

describe("VIRTUALIZE_THRESHOLD", () => {
  it("test_threshold_default_200", () => {
    expect(VIRTUALIZE_THRESHOLD).toBe(200);
  });
});
