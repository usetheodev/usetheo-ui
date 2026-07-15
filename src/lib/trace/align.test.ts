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
  it("test_pares_iguais_ficam_matched_com_delta", () => {
    const a = span({ id: "a-root", name: "run", startTime: 0n, endTime: 2_000_000n });
    const b = span({ id: "b-root", name: "run", startTime: 0n, endTime: 4_000_000n });
    const rows = alignSpanTrees(a, b);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("matched");
    expect(rows[0]?.delta?.durationMs?.to).toBe(4);
  });

  it("test_span_so_em_a_marca_only_in_a_e_suprime_delta", () => {
    const a = span({ id: "ar", name: "run", children: [span({ id: "a1", name: "extra" })] });
    const b = span({ id: "br", name: "run" });
    const rows = alignSpanTrees(a, b);
    const extra = rows.find((r) => r.key === "extra");
    expect(extra?.status).toBe("only-in-a");
    expect(extra?.delta).toBeUndefined();
  });

  it("test_span_so_em_b_marca_only_in_b", () => {
    const a = span({ id: "ar", name: "run" });
    const b = span({ id: "br", name: "run", children: [span({ id: "b1", name: "added" })] });
    const rows = alignSpanTrees(a, b);
    expect(rows.find((r) => r.key === "added")?.status).toBe("only-in-b");
  });

  it("test_ciclo_malformado_nao_trava", () => {
    const cyc = span({ id: "x", name: "x" });
    cyc.children = [cyc]; // self-reference
    expect(() => alignSpanTrees(cyc, span({ id: "y", name: "x" }))).not.toThrow();
  });

  it("test_filhos_pareiam_por_nome", () => {
    const a = span({ id: "ar", name: "run", children: [span({ id: "a1", name: "step", startTime: 0n, endTime: 1_000_000n })] });
    const b = span({ id: "br", name: "run", children: [span({ id: "b1", name: "step", startTime: 0n, endTime: 3_000_000n })] });
    const rows = alignSpanTrees(a, b);
    const step = rows.find((r) => r.key === "step");
    expect(step?.status).toBe("matched");
    expect(step?.delta?.durationMs?.deltaPct).toBeGreaterThan(0);
  });
});

describe("traceMetrics", () => {
  it("test_agrega_duracao_tokens_custo_e_erro", () => {
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
