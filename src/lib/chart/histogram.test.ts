import { describe, expect, it } from "vitest";
import { computeHistogram } from "./histogram.js";

describe("computeHistogram", () => {
  it("distributes values into equal-width bins", () => {
    // 0..9 em 5 bins → 2 por bin
    const bins = computeHistogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    expect(bins).toHaveLength(5);
    expect(bins.map((b) => b.count)).toEqual([2, 2, 2, 2, 2]);
  });

  it("the total count is the number of finite values", () => {
    const bins = computeHistogram([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(10);
  });

  it("each bin exposes an increasing, contiguous lo/hi", () => {
    const bins = computeHistogram([0, 10], 2);
    expect(bins[0]?.lo).toBe(0);
    expect(bins[0]?.hi).toBeCloseTo(5);
    expect(bins[1]?.lo).toBeCloseTo(5);
    expect(bins[1]?.hi).toBe(10);
  });

  it("an empty list returns empty", () => {
    expect(computeHistogram([], 5)).toEqual([]);
  });

  it("filters out non-finite values (NaN/Infinity)", () => {
    const bins = computeHistogram([1, Number.NaN, Number.POSITIVE_INFINITY, 2], 4);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(2);
  });

  it("all-equal values fall into a single bin without losing the count", () => {
    const bins = computeHistogram([5, 5, 5], 4);
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(3);
  });

  it("an invalid binCount (0 or negative) returns empty", () => {
    expect(computeHistogram([1, 2, 3], 0)).toEqual([]);
    expect(computeHistogram([1, 2, 3], -2)).toEqual([]);
  });

  it("the maximum value falls in the last bin (inclusive upper edge)", () => {
    const bins = computeHistogram([0, 1, 2, 3, 4], 2);
    // 4 é o max — deve contar no bin final, não escapar
    expect(bins.reduce((a, b) => a + b.count, 0)).toBe(5);
    expect(bins[bins.length - 1]?.count).toBeGreaterThan(0);
  });
});
