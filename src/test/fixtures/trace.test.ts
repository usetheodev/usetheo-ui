import { describe, expect, it } from "vitest";
import { flattenAll } from "../../lib/trace/flatten.js";
import { MALFORMED_TRACE, NESTED_TRACE, makeTrace } from "./trace.js";

describe("trace fixtures", () => {
  it("test_the_nested_fixture_has_a_branch_a_retry_and_an_error", () => {
    const all = flattenAll(NESTED_TRACE);
    expect(all).toHaveLength(5);
    expect(all.some((s) => s.status === "ERROR")).toBe(true);
    expect(all.some((s) => s.name.includes("retry"))).toBe(true);
  });

  it("test_the_malformed_fixture_has_an_orphan_skew_and_in_flight", () => {
    const all = flattenAll(MALFORMED_TRACE);
    expect(all.find((s) => s.id === "orphan")?.parentId).toBe("ghost-not-in-trace");
    expect(all.find((s) => s.id === "inflight")?.endTime).toBeNull();
  });

  it("test_the_fixture_generator_produces_n_deterministic_spans", () => {
    expect(makeTrace(250)).toEqual(makeTrace(250));
    expect(flattenAll(makeTrace(250))).toHaveLength(251);
  });
});
