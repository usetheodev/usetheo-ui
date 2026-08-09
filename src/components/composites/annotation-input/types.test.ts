import { describe, expect, it } from "vitest";
import {
  type AnnotationConfig,
  isCategoricalConfig,
  isContinuousConfig,
  isFreeformConfig,
} from "./types.js";

const categorical: AnnotationConfig = {
  type: "categorical",
  options: [
    { label: "good", score: 1 },
    { label: "bad", score: 0 },
  ],
};
const continuous: AnnotationConfig = { type: "continuous", min: 0, max: 1, step: 0.1 };
const freeform: AnnotationConfig = { type: "freeform", maxLength: 500 };

describe("annotation config type guards", () => {
  it("isCategoricalConfig discriminates by type", () => {
    expect(isCategoricalConfig(categorical)).toBe(true);
    expect(isCategoricalConfig(continuous)).toBe(false);
    expect(isCategoricalConfig(freeform)).toBe(false);
  });

  it("isContinuousConfig é true só para continuous", () => {
    expect(isContinuousConfig(continuous)).toBe(true);
    expect(isContinuousConfig(categorical)).toBe(false);
    expect(isContinuousConfig(freeform)).toBe(false);
  });

  it("isFreeformConfig é true só para freeform", () => {
    expect(isFreeformConfig(freeform)).toBe(true);
    expect(isFreeformConfig(categorical)).toBe(false);
    expect(isFreeformConfig(continuous)).toBe(false);
  });

  it("the guards return false for an unknown type (negative case)", () => {
    const bogus = { type: "x" } as unknown as AnnotationConfig;
    expect(isCategoricalConfig(bogus)).toBe(false);
    expect(isContinuousConfig(bogus)).toBe(false);
    expect(isFreeformConfig(bogus)).toBe(false);
  });
});
