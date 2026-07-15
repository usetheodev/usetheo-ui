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
  it("test_flattenVisible_respeita_collapsed_set_e_ordem_dfs", () => {
    const rows = flattenVisible(TREE, new Set(["a"]));
    expect(rows.map((r) => r.span.id)).toEqual(["root", "a", "c"]);
  });

  it("test_flattenVisible_sem_collapse_entrega_dfs_completo_com_depth", () => {
    const rows = flattenVisible(TREE, new Set());
    expect(rows.map((r) => r.span.id)).toEqual(["root", "a", "b", "c"]);
    expect(rows.map((r) => r.depth)).toEqual([0, 1, 2, 1]);
  });
});

describe("flattenAll", () => {
  it("test_flattenAll_ignora_collapse", () => {
    expect(flattenAll(TREE)).toHaveLength(4);
  });

  it("test_flattenAll_cycle_safe_nao_stack_overflow", () => {
    const cyc = span({ id: "c" });
    cyc.children = [cyc]; // self-reference
    expect(flattenAll(cyc)).toHaveLength(1);
  });
});

describe("toTranscriptRows", () => {
  it("test_fan_out_ganha_group_header_antes_dos_filhos", () => {
    const rows = toTranscriptRows(TREE); // root tem 2 filhos → group-header
    expect(rows[0]).toMatchObject({ kind: "span", spanId: "root" });
    expect(rows[1]).toMatchObject({ kind: "group-header", groupId: "root" });
  });

  it("test_span_unico_gera_uma_row_sem_header", () => {
    const rows = toTranscriptRows(span({ id: "solo" }));
    expect(rows).toEqual([expect.objectContaining({ kind: "span", spanId: "solo" })]);
  });

  it("test_stats_ausentes_colapsam_para_zero_nunca_nan", () => {
    const rows = toTranscriptRows(span({ id: "solo" }));
    expect(rows[0]?.stats).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      durationMs: null,
    });
  });

  it("test_preview_trunca_em_uma_linha", () => {
    const rows = toTranscriptRows(span({ id: "solo", outputValue: `${"x".repeat(200)}\nsegunda` }));
    expect(rows[0]?.preview?.length).toBeLessThanOrEqual(141);
    expect(rows[0]?.preview).not.toContain("\n");
  });
});

describe("VIRTUALIZE_THRESHOLD", () => {
  it("test_threshold_default_200", () => {
    expect(VIRTUALIZE_THRESHOLD).toBe(200);
  });
});
