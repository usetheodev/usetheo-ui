import { describe, expect, it } from "vitest";
import { aggregateSession, sessionBounds } from "./aggregate.js";
import type { SessionTraceItem } from "./types.js";

const NS = 1_000_000_000n;
const T0 = 1_750_000_000_000_000_000n;

const item = (over: Partial<SessionTraceItem>): SessionTraceItem => ({
  id: over.id ?? "t",
  ...over,
});

describe("aggregateSession", () => {
  it("test_aggregateSession_soma_custo_e_tokens", () => {
    const m = aggregateSession([
      item({ id: "a", costUsd: 0.02, totalTokens: 100 }),
      item({ id: "b", costUsd: 0.04, totalTokens: 250 }),
    ]);
    expect(m.totalCostUsd).toBeCloseTo(0.06);
    expect(m.totalTokens).toBe(350);
    expect(m.traceCount).toBe(2);
  });

  it("test_aggregateSession_custo_ausente_conta_zero_nunca_nan", () => {
    const m = aggregateSession([item({ id: "a" })]);
    expect(m.totalCostUsd).toBe(0);
    expect(m.totalTokens).toBe(0);
    expect(Number.isNaN(m.totalCostUsd)).toBe(false);
  });

  it("test_aggregateSession_conta_erros", () => {
    const m = aggregateSession([
      item({ id: "a", status: "ERROR" }),
      item({ id: "b", status: "OK" }),
      item({ id: "c" }),
    ]);
    expect(m.errorCount).toBe(1);
  });

  it("test_aggregateSession_janela_e_max_end_menos_min_start", () => {
    const m = aggregateSession([
      item({ id: "a", startTime: T0, endTime: T0 + 2n * NS }),
      item({ id: "b", startTime: T0 + NS, endTime: T0 + 5n * NS }),
    ]);
    expect(m.windowMs).toBe(5000);
  });

  it("test_aggregateSession_models_distintos_ordenados", () => {
    const m = aggregateSession([
      item({ id: "a", model: "haiku" }),
      item({ id: "b", model: "gpt" }),
      item({ id: "c", model: "haiku" }),
    ]);
    expect(m.models).toEqual(["gpt", "haiku"]);
  });

  it("test_aggregateSession_lista_vazia_retorna_zeros", () => {
    expect(aggregateSession([])).toMatchObject({
      traceCount: 0,
      windowMs: 0,
      totalCostUsd: 0,
      totalTokens: 0,
      errorCount: 0,
      models: [],
    });
  });

  it("test_aggregateSession_ignora_start_imparseavel_na_janela", () => {
    const m = aggregateSession([
      item({ id: "a", startTime: "garbage", endTime: "1000" }),
      item({ id: "b", startTime: T0, endTime: T0 + NS }),
    ]);
    expect(m.windowMs).toBe(1000);
  });
});

describe("sessionBounds", () => {
  it("test_bounds_min_start_max_end", () => {
    const b = sessionBounds([
      item({ id: "a", startTime: T0 + NS, endTime: T0 + 2n * NS }),
      item({ id: "b", startTime: T0, endTime: T0 + 5n * NS }),
    ]);
    expect(b.startNs).toBe(T0);
    expect(b.endNs).toBe(T0 + 5n * NS);
  });

  it("test_bounds_lista_vazia_zero", () => {
    expect(sessionBounds([])).toEqual({ startNs: 0n, endNs: 0n });
  });

  it("test_bounds_end_ausente_cai_no_start", () => {
    const b = sessionBounds([item({ id: "a", startTime: T0 })]);
    expect(b.endNs).toBe(T0);
  });
});
