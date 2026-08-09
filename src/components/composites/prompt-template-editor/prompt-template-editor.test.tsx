import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { PromptTemplateEditor as PromptTemplateEditorFromBarrel } from "../../../index.js";
import { PromptTemplateEditor } from "./prompt-template-editor.js";

describe("PromptTemplateEditor", () => {
  it("renders a textarea carrying the value", () => {
    render(<PromptTemplateEditor value="Hello {{name}}" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("Hello {{name}}");
  });

  it("typing emits onChange with the new text", () => {
    const onChange = vi.fn();
    render(<PromptTemplateEditor value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hi {{x}}" } });
    expect(onChange).toHaveBeenCalledWith("Hi {{x}}");
  });

  it("shows the available variables", () => {
    const { container } = render(
      <PromptTemplateEditor value="" onChange={() => {}} variables={["name", "city"]} />,
    );
    const chips = container.querySelectorAll('[data-slot="prompt-template-editor-var"]');
    const labels = Array.from(chips).map((c) => c.textContent);
    expect(labels).toContain("name");
    expect(labels).toContain("city");
  });

  it("dedup: duplicate variables do not produce repeated chips (review V3 LOW-1)", () => {
    const { container } = render(
      <PromptTemplateEditor value="" onChange={() => {}} variables={["name", "name", "city"]} />,
    );
    const labels = Array.from(
      container.querySelectorAll('[data-slot="prompt-template-editor-var"]'),
    ).map((c) => c.textContent);
    expect(labels.filter((l) => l === "name")).toHaveLength(1);
    expect(labels).toContain("city");
  });

  it("marks a variable as used when it appears in the value (data-used)", () => {
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

  it("flags a variable that is used but absent from the available list (missing)", () => {
    const { container } = render(
      <PromptTemplateEditor value="Hi {{ghost}}" onChange={() => {}} variables={["name"]} />,
    );
    const missing = container.querySelector(
      '[data-slot="prompt-template-editor-var"][data-var="ghost"]',
    );
    expect(missing?.getAttribute("data-missing")).toBe("true");
  });

  it("disabled disables the textarea", () => {
    render(<PromptTemplateEditor value="x" onChange={() => {}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("the textarea is labelled (a11y)", () => {
    render(<PromptTemplateEditor value="" onChange={() => {}} />);
    expect(screen.getByRole("textbox", { name: /template/i })).toBeInTheDocument();
  });

  it("forwards ref to the textarea", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<PromptTemplateEditor value="x" onChange={() => {}} ref={ref} />);
    expect(ref.current?.tagName).toBe("TEXTAREA");
  });

  it("is exported from the root barrel", () => {
    expect(PromptTemplateEditorFromBarrel).toBe(PromptTemplateEditor);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <PromptTemplateEditor value="Hi {{name}}" onChange={() => {}} variables={["name", "city"]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
