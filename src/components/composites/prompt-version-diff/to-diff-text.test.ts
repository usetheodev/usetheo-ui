import { describe, expect, it } from "vitest";
import { configToText, templateToText } from "./to-diff-text.js";

describe("templateToText", () => {
  it("a string template passes through unchanged", () => {
    expect(templateToText("You are helpful.")).toBe("You are helpful.");
  });

  it("a chat array normalises to 'role: content' per message", () => {
    const text = templateToText([
      { role: "system", content: "Be concise." },
      { role: "user", content: "Hi" },
    ]);
    expect(text).toBe("system: Be concise.\n\nuser: Hi");
  });

  it("an empty chat array becomes an empty string", () => {
    expect(templateToText([])).toBe("");
  });
});

describe("configToText", () => {
  it("a present config becomes pretty JSON (2 spaces)", () => {
    expect(configToText({ temperature: 0.7 })).toBe('{\n  "temperature": 0.7\n}');
  });

  it("an absent config becomes an empty string (the section is honestly omitted)", () => {
    expect(configToText(undefined)).toBe("");
  });

  it("an empty config object also becomes an empty string", () => {
    expect(configToText({})).toBe("");
  });
});
