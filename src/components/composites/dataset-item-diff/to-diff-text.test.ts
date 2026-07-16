import { describe, expect, it } from "vitest";
import { fieldPresent, fieldToText } from "./to-diff-text.js";

describe("fieldToText", () => {
  it("string passa direto (sem aspas/escape)", () => {
    expect(fieldToText("hello world")).toBe("hello world");
  });

  it("objeto vira JSON pretty (2 espaços)", () => {
    expect(fieldToText({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it("undefined vira string vazia", () => {
    expect(fieldToText(undefined)).toBe("");
  });

  it("null vira string vazia", () => {
    expect(fieldToText(null)).toBe("");
  });
});

describe("fieldPresent", () => {
  it("true quando presente em um dos lados", () => {
    expect(fieldPresent(undefined, "x")).toBe(true);
    expect(fieldPresent({ a: 1 }, undefined)).toBe(true);
  });

  it("false quando ausente em AMBOS (seção omitida honestamente)", () => {
    expect(fieldPresent(undefined, undefined)).toBe(false);
    expect(fieldPresent(null, null)).toBe(false);
  });
});
