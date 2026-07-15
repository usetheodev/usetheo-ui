import { describe, expect, it } from "vitest";
import { computeHistogram } from "./histogram.js";

describe("computeHistogram", () => {
  it("distribui valores em bins de largura igual", () => {
    // 0..9 em 5 bins → 2 por bin
    const bins = computeHistogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    expect(bins).toHaveLength(5);
    expect(bins.map((b) => b.count)).toEqual([2, 2, 2, 2, 2]);
  });

  it("count total é o número de valores finitos", () => {
    const bins = computeHistogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(10);
  });

  it("cada bin expõe lo/hi crescentes e contíguos", () => {
    const bins = computeHistogram([0, 10], 2);
    expect(bins[0]?.lo).toBe(0);
    expect(bins[0]?.hi).toBeCloseTo(5);
    expect(bins[1]?.lo).toBeCloseTo(5);
    expect(bins[1]?.hi).toBe(10);
  });

  it("lista vazia retorna vazio", () => {
    expect(computeHistogram([], 5)).toEqual([]);
  });

  it("filtra valores não-finitos (NaN/Infinity)", () => {
    const bins = computeHistogram([1, Number.NaN, Number.POSITIVE_INFINITY, 2], 4);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(2);
  });

  it("valores todos iguais caem num único bin sem perder count", () => {
    const bins = computeHistogram([5, 5, 5], 4);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(3);
  });

  it("binCount inválido (0 ou negativo) retorna vazio", () => {
    expect(computeHistogram([1, 2, 3], 0)).toEqual([]);
    expect(computeHistogram([1, 2, 3], -2)).toEqual([]);
  });

  it("o valor máximo cai no último bin (borda superior inclusiva)", () => {
    const bins = computeHistogram([0, 1, 2, 3, 4], 2);
    // 4 é o max — deve contar no bin final, não escapar
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(5);
    expect(bins[bins.length - 1]?.count).toBeGreaterThan(0);
  });
});
