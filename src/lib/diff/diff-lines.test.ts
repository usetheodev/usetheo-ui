import { describe, expect, it } from "vitest";
import { diffLines } from "./diff-lines.js";

describe("diffLines", () => {
  it("identical texts → every row is eq", () => {
    const rows = diffLines("a\nb\nc", "a\nb\nc");
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.kind === "eq")).toBe(true);
  });

  it("an empty old → everything is add", () => {
    const rows = diffLines("", "a\nb");
    expect(rows.map((r) => r.kind)).toEqual(["add", "add"]);
    expect(rows.map((r) => r.text)).toEqual(["a", "b"]);
  });

  it("an empty new → everything is del", () => {
    const rows = diffLines("a\nb", "");
    expect(rows.map((r) => r.kind)).toEqual(["del", "del"]);
  });

  it("both empty → []", () => {
    expect(diffLines("", "")).toEqual([]);
  });

  it("a changed line → del + add", () => {
    const rows = diffLines("a\nx\nc", "a\ny\nc");
    // a eq, x del, y add, c eq (ordem: eq, del, add, eq)
    expect(rows.map((r) => r.kind)).toEqual(["eq", "del", "add", "eq"]);
    expect(rows.find((r) => r.kind === "del")?.text).toBe("x");
    expect(rows.find((r) => r.kind === "add")?.text).toBe("y");
  });

  it("an insertion in the middle preserves eq around it", () => {
    const rows = diffLines("a\nc", "a\nb\nc");
    expect(rows.map((r) => r.kind)).toEqual(["eq", "add", "eq"]);
    expect(rows.find((r) => r.kind === "add")?.text).toBe("b");
  });

  it("a removal in the middle preserves eq around it", () => {
    const rows = diffLines("a\nb\nc", "a\nc");
    expect(rows.map((r) => r.kind)).toEqual(["eq", "del", "eq"]);
  });

  it("numbers the old (left) and new (right) lines honestly", () => {
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
