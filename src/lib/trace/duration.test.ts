import { describe, expect, it } from "vitest";
import { durationMs, isSpanError, toNs } from "./duration.js";

describe("toNs", () => {
  it("test_toNs_accepts_a_bigint_ns_directly", () => {
    expect(toNs(1_000_000_000n)).toBe(1_000_000_000n);
  });

  it("test_toNs_accepts_a_numeric_ns_string", () => {
    expect(toNs("1750000000000000000")).toBe(1_750_000_000_000_000_000n);
  });

  it("test_toNs_accepts_an_iso_string_and_converts_it_to_ns", () => {
    expect(toNs("1970-01-01T00:00:01.000Z")).toBe(1_000_000_000n);
  });

  it("test_toNs_returns_null_for_invalid_input", () => {
    expect(toNs("not-a-date")).toBeNull();
    expect(toNs(undefined)).toBeNull();
    expect(toNs(null)).toBeNull();
    expect(toNs("")).toBeNull();
  });
});

describe("durationMs", () => {
  it("test_durationMs_computes_ms_from_ns", () => {
    expect(durationMs({ startTime: 0n, endTime: 1_500_000_000n })).toBe(1500);
  });

  it("test_durationMs_returns_null_when_end_precedes_start", () => {
    expect(durationMs({ startTime: 2_000_000_000n, endTime: 1_000_000_000n })).toBeNull();
  });

  it("test_durationMs_returns_null_without_end_or_start", () => {
    expect(durationMs({ startTime: 1n })).toBeNull();
    expect(durationMs({ startTime: undefined as unknown as bigint, endTime: 1n })).toBeNull();
  });

  it("test_durationMs_returns_null_for_an_unparseable_timestamp", () => {
    expect(durationMs({ startTime: "garbage", endTime: "1000" })).toBeNull();
  });
});

describe("isSpanError", () => {
  it("test_isSpanError_recognises_an_error", () => {
    expect(isSpanError("ERROR")).toBe(true);
    expect(isSpanError("OK")).toBe(false);
    expect(isSpanError(undefined)).toBe(false);
  });
});
