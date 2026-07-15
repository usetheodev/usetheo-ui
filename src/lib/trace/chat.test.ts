import { describe, expect, it } from "vitest";
import { asChat, contentText, isRedactedThinking, prettyValue } from "./chat.js";

describe("contentText", () => {
  it("test_extrai_string_direta", () => {
    expect(contentText("hello")).toBe("hello");
  });
  it("test_junta_blocos_de_texto", () => {
    expect(
      contentText([
        { type: "text", text: "a" },
        { type: "text", text: "b" },
      ]),
    ).toBe("a\n\nb");
  });
  it("test_null_vira_vazio", () => {
    expect(contentText(null)).toBe("");
  });
});

describe("isRedactedThinking", () => {
  it("test_reconhece_content_redacted", () => {
    expect(isRedactedThinking({ role: "assistant", content: "<REDACTED>" })).toBe(true);
  });
  it("test_reconhece_bloco_redacted_thinking", () => {
    expect(
      isRedactedThinking({ role: "assistant", content: [{ type: "redacted_thinking" }] }),
    ).toBe(true);
  });
  it("test_conteudo_normal_nao_e_redacted", () => {
    expect(isRedactedThinking({ role: "user", content: "hi" })).toBe(false);
  });
});

describe("asChat", () => {
  it("test_asChat_detecta_array_chatml_e_rejeita_json_generico", () => {
    expect(asChat('[{"role":"user","content":"x"}]')).not.toBeNull();
    expect(asChat('{"a":1}')).toBeNull();
    expect(asChat("plain text")).toBeNull();
    expect(asChat("[]")).toBeNull();
  });

  it("test_asChat_preserva_tool_calls_e_tool_call_id", () => {
    const msgs = asChat(
      JSON.stringify([
        {
          role: "assistant",
          content: "",
          tool_calls: [{ id: "call_1", function: { name: "search", arguments: "{}" } }],
        },
        { role: "tool", content: "result", tool_call_id: "call_1" },
      ]),
    );
    expect(msgs?.[0]?.tool_calls?.[0]?.id).toBe("call_1");
    expect(msgs?.[1]?.tool_call_id).toBe("call_1");
  });

  it("test_asChat_rejeita_entrada_sem_role_ou_content", () => {
    expect(asChat('[{"role":"user"}]')).toBeNull();
    expect(asChat("[null]")).toBeNull();
  });
});

describe("prettyValue", () => {
  it("test_prettyValue_indenta_json_parseavel", () => {
    expect(prettyValue('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it("test_prettyValue_devolve_raw_quando_nao_json", () => {
    expect(prettyValue("hello")).toBe("hello");
  });
});
