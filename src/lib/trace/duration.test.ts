import { describe, expect, it } from "vitest";
import { durationMs, isSpanError, toNs } from "./duration.js";

describe("toNs", () => {
  it("test_toNs_aceita_bigint_ns_direto", () => {
    expect(toNs(1_000_000_000n)).toBe(1_000_000_000n);
  });

  it("test_toNs_aceita_string_numerica_ns", () => {
    expect(toNs("1750000000000000000")).toBe(1_750_000_000_000_000_000n);
  });

  it("test_toNs_aceita_iso_string_e_converte_para_ns", () => {
    expect(toNs("1970-01-01T00:00:01.000Z")).toBe(1_000_000_000n);
  });

  it("test_toNs_retorna_null_para_invalido", () => {
    expect(toNs("not-a-date")).toBeNull();
    expect(toNs(undefined)).toBeNull();
    expect(toNs(null)).toBeNull();
    expect(toNs("")).toBeNull();
  });
});

describe("durationMs", () => {
  it("test_durationMs_calcula_ms_de_ns", () => {
    expect(durationMs({ startTime: 0n, endTime: 1_500_000_000n })).toBe(1500);
  });

  it("test_durationMs_retorna_null_quando_end_antes_de_start", () => {
    expect(durationMs({ startTime: 2_000_000_000n, endTime: 1_000_000_000n })).toBeNull();
  });

  it("test_durationMs_retorna_null_sem_end_ou_start", () => {
    expect(durationMs({ startTime: 1n })).toBeNull();
    expect(durationMs({ startTime: undefined as unknown as bigint, endTime: 1n })).toBeNull();
  });

  it("test_durationMs_retorna_null_para_timestamp_imparseavel", () => {
    expect(durationMs({ startTime: "garbage", endTime: "1000" })).toBeNull();
  });
});

describe("isSpanError", () => {
  it("test_isSpanError_reconhece_error", () => {
    expect(isSpanError("ERROR")).toBe(true);
    expect(isSpanError("OK")).toBe(false);
    expect(isSpanError(undefined)).toBe(false);
  });
});
