import { describe, expect, it } from "vitest";
import { groupByNamespace } from "./attributes.js";

describe("groupByNamespace", () => {
  it("test_groups_by_the_prefix_before_the_first_dot", () => {
    const groups = groupByNamespace({
      "gen_ai.model": "x",
      "gen_ai.tokens": 1,
      "http.status": 200,
    });
    expect(groups.map((g) => g.namespace)).toEqual(["gen_ai", "http"]);
    expect(groups[0]?.entries).toHaveLength(2);
  });

  it("test_a_key_without_a_dot_falls_into_general", () => {
    const groups = groupByNamespace({ status: "ok" });
    expect(groups[0]?.namespace).toBe("general");
  });

  it("test_empty_returns_an_empty_list", () => {
    expect(groupByNamespace({})).toEqual([]);
  });
});
