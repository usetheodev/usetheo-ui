import { describe, expect, it } from "vitest";
import { extractVars } from "./extract-vars.js";

describe("extractVars", () => {
  it("extrai variáveis mustache {{name}}", () => {
    expect(extractVars("Hello {{name}}, welcome to {{place}}")).toEqual(["name", "place"]);
  });

  it("extrai variáveis f-string {name}", () => {
    expect(extractVars("Hello {name} from {city}")).toEqual(["name", "city"]);
  });

  it("extrai mustache e f-string misturados", () => {
    expect(extractVars("{{greeting}} {name}!")).toEqual(["greeting", "name"]);
  });

  it("deduplica preservando a primeira ocorrência", () => {
    expect(extractVars("{{a}} {{b}} {{a}} {b}")).toEqual(["a", "b"]);
  });

  it("retorna vazio quando não há variáveis", () => {
    expect(extractVars("just plain text")).toEqual([]);
  });

  it("ignora chaves vazias {{}} e {}", () => {
    expect(extractVars("{{}} {} {{ok}}")).toEqual(["ok"]);
  });

  it("faz trim do nome dentro das chaves", () => {
    expect(extractVars("{{ name }} { city }")).toEqual(["name", "city"]);
  });
});
