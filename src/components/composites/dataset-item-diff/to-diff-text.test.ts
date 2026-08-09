import { describe, expect, it } from "vitest";
import { fieldPresent, fieldToText } from "./to-diff-text.js";

describe("fieldToText", () => {
  it("a string passes through (no quoting or escaping)", () => {
    expect(fieldToText("hello world")).toBe("hello world");
  });

  it("an object becomes pretty JSON (2 spaces)", () => {
    expect(fieldToText({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("undefined becomes an empty string", () => {
    expect(fieldToText(undefined)).toBe("");
  });

  it("null becomes an empty string", () => {
    expect(fieldToText(null)).toBe("");
  });
});

describe("fieldPresent", () => {
  it("true when present on either side", () => {
    expect(fieldPresent(undefined, "x")).toBe(true);
    expect(fieldPresent({ a: 1 }, undefined)).toBe(true);
  });

  it("false when absent from BOTH (the section is honestly omitted)", () => {
    expect(fieldPresent(undefined, undefined)).toBe(false);
    expect(fieldPresent(null, null)).toBe(false);
  });
});
