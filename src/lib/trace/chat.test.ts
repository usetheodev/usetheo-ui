import { describe, expect, it } from "vitest";
import { asChat, contentText, isRedactedThinking, prettyValue } from "./chat.js";

describe("contentText", () => {
  it("test_extracts_a_direct_string", () => {
    expect(contentText("hello")).toBe("hello");
  });
  it("test_joins_text_blocks", () => {
    expect(
      contentText([
        { type: "text", text: "a" },
        { type: "text", text: "b" },
      ]),
    ).toBe("a\n\nb");
  });
  it("test_null_becomes_empty", () => {
    expect(contentText(null)).toBe("");
  });
});

describe("isRedactedThinking", () => {
  it("test_recognises_redacted_content", () => {
    expect(isRedactedThinking({ role: "assistant", content: "<REDACTED>" })).toBe(true);
  });
  it("test_recognises_a_redacted_thinking_block", () => {
    expect(
      isRedactedThinking({ role: "assistant", content: [{ type: "redacted_thinking" }] }),
    ).toBe(true);
  });
  it("test_ordinary_content_is_not_redacted", () => {
    expect(isRedactedThinking({ role: "user", content: "hi" })).toBe(false);
  });
});

describe("asChat", () => {
  it("test_asChat_detects_a_chatml_array_and_rejects_generic_json", () => {
    expect(asChat('[{"role":"user","content":"x"}]')).not.toBeNull();
    expect(asChat('{"a":1}')).toBeNull();
    expect(asChat("plain text")).toBeNull();
    expect(asChat("[]")).toBeNull();
  });

  it("test_asChat_preserves_tool_calls_and_tool_call_id", () => {
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

  it("test_asChat_rejects_input_without_role_or_content", () => {
    expect(asChat('[{"role":"user"}]')).toBeNull();
    expect(asChat("[null]")).toBeNull();
  });
});

describe("prettyValue", () => {
  it("test_prettyValue_indents_parseable_json", () => {
    expect(prettyValue('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it("test_prettyValue_returns_raw_when_not_json", () => {
    expect(prettyValue("hello")).toBe("hello");
  });
});
