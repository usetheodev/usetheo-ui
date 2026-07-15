import { describe, expect, it } from "vitest";
import { flattenAll } from "../../lib/trace/flatten.js";
import { MALFORMED_TRACE, NESTED_TRACE, makeTrace } from "./trace.js";

describe("trace fixtures", () => {
  it("test_fixture_nested_tem_ramificacao_retry_e_erro", () => {
    const all = flattenAll(NESTED_TRACE);
    expect(all).toHaveLength(5);
    expect(all.some((s) => s.status === "ERROR")).toBe(true);
    expect(all.some((s) => s.name.includes("retry"))).toBe(true);
  });

  it("test_fixture_malformada_tem_orfao_skew_e_inflight", () => {
    const all = flattenAll(MALFORMED_TRACE);
    expect(all.find((s) => s.id === "orphan")?.parentId).toBe("ghost-not-in-trace");
    expect(all.find((s) => s.id === "inflight")?.endTime).toBeNull();
  });

  it("test_fixture_generator_produz_n_spans_deterministicos", () => {
    expect(makeTrace(250)).toEqual(makeTrace(250));
    expect(flattenAll(makeTrace(250))).toHaveLength(251);
  });
});
