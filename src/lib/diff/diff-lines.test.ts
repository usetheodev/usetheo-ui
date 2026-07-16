import { describe, expect, it } from "vitest";
import { diffLines } from "./diff-lines.js";

describe("diffLines", () => {
  it("textos idênticos → todas as rows eq", () => {
    const rows = diffLines("a\nb\nc", "a\nb\nc");
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.kind === "eq")).toBe(true);
  });

  it("old vazio → tudo add", () => {
    const rows = diffLines("", "a\nb");
    expect(rows.map((r) => r.kind)).toEqual(["add", "add"]);
    expect(rows.map((r) => r.text)).toEqual(["a", "b"]);
  });

  it("new vazio → tudo del", () => {
    const rows = diffLines("a\nb", "");
    expect(rows.map((r) => r.kind)).toEqual(["del", "del"]);
  });

  it("ambos vazios → []", () => {
    expect(diffLines("", "")).toEqual([]);
  });

  it("linha alterada → del + add", () => {
    const rows = diffLines("a\nx\nc", "a\ny\nc");
    // a eq, x del, y add, c eq (ordem: eq, del, add, eq)
    expect(rows.map((r) => r.kind)).toEqual(["eq", "del", "add", "eq"]);
    expect(rows.find((r) => r.kind === "del")?.text).toBe("x");
    expect(rows.find((r) => r.kind === "add")?.text).toBe("y");
  });

  it("inserção no meio preserva eq ao redor", () => {
    const rows = diffLines("a\nc", "a\nb\nc");
    expect(rows.map((r) => r.kind)).toEqual(["eq", "add", "eq"]);
    expect(rows.find((r) => r.kind === "add")?.text).toBe("b");
  });

  it("remoção no meio preserva eq ao redor", () => {
    const rows = diffLines("a\nb\nc", "a\nc");
    expect(rows.map((r) => r.kind)).toEqual(["eq", "del", "eq"]);
  });

  it("numera linhas old (left) e new (right) honestamente", () => {
    const rows = diffLines("a\nx", "a\ny");
    const eq = rows.find((r) => r.kind === "eq");
    expect(eq?.leftNo).toBe(1);
    expect(eq?.rightNo).toBe(1);
    const del = rows.find((r) => r.kind === "del");
    expect(del?.leftNo).toBe(2);
    expect(del?.rightNo).toBeUndefined();
    const add = rows.find((r) => r.kind === "add");
    expect(add?.rightNo).toBe(2);
    expect(add?.leftNo).toBeUndefined();
  });
});
