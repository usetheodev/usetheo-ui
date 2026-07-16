import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PromptTemplateEditor as PromptTemplateEditorFromBarrel } from "../../../index.js";
import { PromptTemplateEditor } from "./prompt-template-editor.js";

describe("PromptTemplateEditor", () => {
  it("renderiza um textarea com o value", () => {
    render(<PromptTemplateEditor value="Hello {{name}}" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Hello {{name}}");
  });

  it("digitar emite onChange com o novo texto", () => {
    const onChange = vi.fn();
    render(<PromptTemplateEditor value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hi {{x}}" } });
    expect(onChange).toHaveBeenCalledWith("Hi {{x}}");
  });

  it("mostra as variáveis disponíveis", () => {
    const { container } = render(
      <PromptTemplateEditor value="" onChange={() => {}} variables={["name", "city"]} />,
    );
    const chips = container.querySelectorAll('[data-slot="prompt-template-editor-var"]');
    const labels = Array.from(chips).map((c) => c.textContent);
    expect(labels).toContain("name");
    expect(labels).toContain("city");
  });

  it("dedup: variables duplicadas não geram chips repetidos (review V3 LOW-1)", () => {
    const { container } = render(
      <PromptTemplateEditor value="" onChange={() => {}} variables={["name", "name", "city"]} />,
    );
    const labels = Array.from(
      container.querySelectorAll('[data-slot="prompt-template-editor-var"]'),
    ).map((c) => c.textContent);
    expect(labels.filter((l) => l === "name")).toHaveLength(1);
    expect(labels).toContain("city");
  });

  it("marca variável como usada quando aparece no value (data-used)", () => {
    const { container } = render(
      <PromptTemplateEditor value="Hi {{name}}" onChange={() => {}} variables={["name", "city"]} />,
    );
    const name = container.querySelector(
      '[data-slot="prompt-template-editor-var"][data-var="name"]',
    );
    const city = container.querySelector(
      '[data-slot="prompt-template-editor-var"][data-var="city"]',
    );
    expect(name?.getAttribute("data-used")).toBe("true");
    expect(city?.getAttribute("data-used")).toBe("false");
  });

  it("sinaliza variável usada mas ausente da lista disponível (missing)", () => {
    const { container } = render(
      <PromptTemplateEditor value="Hi {{ghost}}" onChange={() => {}} variables={["name"]} />,
    );
    const missing = container.querySelector(
      '[data-slot="prompt-template-editor-var"][data-var="ghost"]',
    );
    expect(missing?.getAttribute("data-missing")).toBe("true");
  });

  it("disabled desabilita o textarea", () => {
    render(<PromptTemplateEditor value="x" onChange={() => {}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("o textarea é rotulado (a11y)", () => {
    render(<PromptTemplateEditor value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox", { name: /template/i })).toBeInTheDocument();
  });

  it("encaminha ref para o textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<PromptTemplateEditor value="x" onChange={() => {}} ref={ref} />);
    expect(ref.current?.tagName).toBe("TEXTAREA");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(PromptTemplateEditorFromBarrel).toBe(PromptTemplateEditor);
  });

  it("não tem violações axe", async () => {
    const { container } = render(
      <PromptTemplateEditor value="Hi {{name}}" onChange={() => {}} variables={["name", "city"]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
