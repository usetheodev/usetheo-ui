import { describe, expect, it } from "vitest";
import { groupByNamespace } from "./attributes.js";

describe("groupByNamespace", () => {
  it("test_agrupa_por_prefixo_antes_do_primeiro_ponto", () => {
    const groups = groupByNamespace({
      "gen_ai.model": "x",
      "gen_ai.tokens": 1,
      "http.status": 200,
    });
    expect(groups.map((g) => g.namespace)).toEqual(["gen_ai", "http"]);
    expect(groups[0]?.entries).toHaveLength(2);
  });

  it("test_chave_sem_ponto_cai_em_general", () => {
    const groups = groupByNamespace({ status: "ok" });
    expect(groups[0]?.namespace).toBe("general");
  });

  it("test_vazio_retorna_lista_vazia", () => {
    expect(groupByNamespace({})).toEqual([]);
  });
});
