import { describe, expect, it } from "vitest";
import { extractVars } from "./extract-vars.js";

describe("extractVars", () => {
  it("extracts mustache variables {{name}}", () => {
    expect(extractVars("Hello {{name}}, welcome to {{place}}")).toEqual(["name", "place"]);
  });

  it("extracts f-string variables {name}", () => {
    expect(extractVars("Hello {name} from {city}")).toEqual(["name", "city"]);
  });

  it("extracts mustache and f-string mixed together", () => {
    expect(extractVars("{{greeting}} {name}!")).toEqual(["greeting", "name"]);
  });

  it("deduplicates keeping the first occurrence", () => {
    expect(extractVars("{{a}} {{b}} {{a}} {b}")).toEqual(["a", "b"]);
  });

  it("returns empty when there are no variables", () => {
    expect(extractVars("just plain text")).toEqual([]);
  });

  it("ignores empty braces {{}} and {}", () => {
    expect(extractVars("{{}} {} {{ok}}")).toEqual(["ok"]);
  });

  it("trims the name inside the braces", () => {
    expect(extractVars("{{ name }} { city }")).toEqual(["name", "city"]);
  });
});
