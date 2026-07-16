import { describe, expect, it } from "vitest";
import { configToText, templateToText } from "./to-diff-text.js";

describe("templateToText", () => {
  it("string template passa direto sem alteração", () => {
    expect(templateToText("You are helpful.")).toBe("You are helpful.");
  });

  it("chat array normaliza para 'role: content' por mensagem", () => {
    const text = templateToText([
      { role: "system", content: "Be concise." },
      { role: "user", content: "Hi" },
    ]);
    expect(text).toBe("system: Be concise.\n\nuser: Hi");
  });

  it("chat array vazio vira string vazia", () => {
    expect(templateToText([])).toBe("");
  });
});

describe("configToText", () => {
  it("config presente vira JSON pretty (2 espaços)", () => {
    expect(configToText({ temperature: 0.7 })).toBe('{\n  "temperature": 0.7\n}');
  });

  it("config ausente vira string vazia (seção omitida honestamente)", () => {
    expect(configToText(undefined)).toBe("");
  });

  it("config objeto vazio também vira string vazia", () => {
    expect(configToText({})).toBe("");
  });
});
