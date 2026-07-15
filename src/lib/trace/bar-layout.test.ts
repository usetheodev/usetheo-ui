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
  it("test_bounds_toma_menor_start_e_maior_end_da_arvore_toda", () => {
    const root = span({
      id: "root",
      startTime: 100n,
      endTime: 200n,
      children: [span({ id: "span-2", parentId: "root", startTime: 50n, endTime: 400n })],
    });
    expect(computeTraceBounds(root)).toEqual({ startNs: 50n, endNs: 400n });
  });

  it("test_bounds_cai_no_start_quando_end_ausente", () => {
    const root = span({ id: "root", startTime: 100n });
    expect(computeTraceBounds(root)).toEqual({ startNs: 100n, endNs: 100n });
  });

  it("test_bounds_trace_sem_timestamps_retorna_zero", () => {
    expect(computeTraceBounds(span({ id: "root" }))).toEqual({ startNs: 0n, endNs: 0n });
  });
});

describe("computeBarLayout", () => {
  it("test_barra_mapeia_para_percentual_da_janela", () => {
    const l = computeBarLayout(25n, 75n, 0n, 100n);
    expect(l).toEqual({ leftPct: 25, widthPct: 50, unbounded: false });
  });

  it("test_barra_clampa_em_0_100_e_marca_unbounded_sem_end", () => {
    const l = computeBarLayout(150n, undefined, 0n, 100n);
    expect(l.leftPct).toBeLessThanOrEqual(100);
    expect(l.widthPct).toBe(0);
    expect(l.unbounded).toBe(true);
  });

  it("test_clock_skew_end_antes_do_start_vira_unbounded_sem_throw", () => {
    const l = computeBarLayout(80n, 20n, 0n, 100n);
    expect(l.unbounded).toBe(true);
    expect(l.widthPct).toBe(0);
  });

  it("test_janela_zero_duration_nao_lanca", () => {
    expect(() => computeBarLayout(10n, 20n, 50n, 50n)).not.toThrow();
  });

  it("test_start_imparseavel_vira_unbounded", () => {
    expect(computeBarLayout("garbage", "20", 0n, 100n).unbounded).toBe(true);
  });
});

describe("niceAxisTicks", () => {
  it("test_ticks_usam_ladder_1_2_5_e_respeitam_largura", () => {
    const ticks = niceAxisTicks(0n, 10_000_000_000n, 600); // 10s / 600px
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks[0]).toMatchObject({ offsetNs: 0n, leftPct: 0 });
    expect(ticks.at(-1)?.leftPct).toBeLessThanOrEqual(100);
  });

  it("test_ticks_janela_degenerada_retorna_vazio", () => {
    expect(niceAxisTicks(100n, 100n, 600)).toEqual([]);
    expect(niceAxisTicks(0n, 100n, 0)).toEqual([]);
  });
});

describe("packRows", () => {
  it("test_spans_sobrepostos_caem_em_rows_distintas", () => {
    const rows = packRows([
      { id: "a", startNs: 0n, endNs: 100n },
      { id: "b", startNs: 50n, endNs: 150n },
      { id: "c", startNs: 100n, endNs: 200n },
    ]);
    expect(rows.get("a")).toBe(0);
    expect(rows.get("b")).toBe(1);
    expect(rows.get("c")).toBe(0); // reusa a row 0, que terminou em 100
  });

  it("test_lista_vazia_retorna_mapa_vazio", () => {
    expect(packRows([]).size).toBe(0);
  });
});

describe("spanCostUsd / aggregateCost", () => {
  it("test_custo_prefere_campo_promovido_e_cai_no_atributo", () => {
    expect(spanCostUsd(span({ costUsd: 0.5 }))).toBe(0.5);
    expect(spanCostUsd(span({ attributes: { "gen_ai.usage.cost": "0.25" } }))).toBe(0.25);
    expect(spanCostUsd(span({}))).toBe(0);
  });

  it("test_custo_negativo_ou_nao_numerico_vira_zero_nunca_nan", () => {
    expect(spanCostUsd(span({ costUsd: -1 }))).toBe(0);
    expect(spanCostUsd(span({ attributes: { cost: "abc" } }))).toBe(0);
  });

  it("test_aggregate_soma_subtree", () => {
    const root = span({
      costUsd: 1,
      children: [span({ id: "span-2", costUsd: 2 }), span({ id: "span-3", costUsd: 3 })],
    });
    expect(aggregateCost(root)).toBe(6);
  });
});
