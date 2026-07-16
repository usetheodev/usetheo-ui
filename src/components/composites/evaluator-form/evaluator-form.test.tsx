import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { EvaluatorForm as EvaluatorFormFromBarrel } from "../../../index.js";
import { EvaluatorForm } from "./evaluator-form.js";
import type { EvaluatorConfig } from "./types.js";

describe("EvaluatorForm — per-type fields", () => {
  it("exact_match renderiza um campo target", () => {
    render(<EvaluatorForm value={{ type: "exact_match", target: "hi" }} onChange={() => {}} />);
    const input = screen.getByLabelText(/target/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("hi");
  });

  it("regex renderiza pattern e flags", () => {
    render(
      <EvaluatorForm value={{ type: "regex", pattern: "^ok$", flags: "i" }} onChange={() => {}} />,
    );
    expect((screen.getByLabelText(/pattern/i) as HTMLInputElement).value).toBe("^ok$");
    expect((screen.getByLabelText(/flags/i) as HTMLInputElement).value).toBe("i");
  });

  it("levenshtein renderiza um campo threshold numérico", () => {
    render(<EvaluatorForm value={{ type: "levenshtein", threshold: 3 }} onChange={() => {}} />);
    const input = screen.getByLabelText(/threshold/i) as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.value).toBe("3");
  });
});

describe("EvaluatorForm — onChange emits typed config", () => {
  it("editar o target emite exact_match config", () => {
    const onChange = vi.fn();
    render(<EvaluatorForm value={{ type: "exact_match", target: "" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/target/i), { target: { value: "done" } });
    expect(onChange).toHaveBeenCalledWith({ type: "exact_match", target: "done" });
  });

  it("editar o pattern emite regex config preservando flags", () => {
    const onChange = vi.fn();
    render(
      <EvaluatorForm value={{ type: "regex", pattern: "", flags: "g" }} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText(/pattern/i), { target: { value: "\\d+" } });
    expect(onChange).toHaveBeenCalledWith({ type: "regex", pattern: "\\d+", flags: "g" });
  });

  it("editar o threshold emite number (nunca NaN)", () => {
    const onChange = vi.fn();
    render(<EvaluatorForm value={{ type: "json_distance", threshold: 0 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/threshold/i), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith({ type: "json_distance", threshold: 5 });
  });

  it("trocar o tipo emite um config fresco do novo tipo com defaults", () => {
    const onChange = vi.fn();
    render(<EvaluatorForm value={{ type: "exact_match", target: "keep?" }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/evaluator type/i), { target: { value: "regex" } });
    const emitted = onChange.mock.calls[0]?.[0] as EvaluatorConfig;
    expect(emitted.type).toBe("regex");
    expect(emitted).toEqual({ type: "regex", pattern: "", flags: "" });
  });
});

describe("EvaluatorForm — common", () => {
  it("disabled desabilita o seletor de tipo e os campos", () => {
    render(
      <EvaluatorForm value={{ type: "exact_match", target: "x" }} onChange={() => {}} disabled />,
    );
    expect(screen.getByLabelText(/evaluator type/i)).toBeDisabled();
    expect(screen.getByLabelText(/target/i)).toBeDisabled();
  });

  it("expõe data-slot e data-eval-type no root", () => {
    const { container } = render(
      <EvaluatorForm value={{ type: "regex", pattern: "a" }} onChange={() => {}} />,
    );
    const root = container.querySelector('[data-slot="evaluator-form"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-eval-type")).toBe("regex");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(EvaluatorFormFromBarrel).toBe(EvaluatorForm);
  });

  it("sem violações axe — regex", async () => {
    const { container } = render(
      <EvaluatorForm value={{ type: "regex", pattern: "^x$", flags: "i" }} onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sem violações axe — levenshtein", async () => {
    const { container } = render(
      <EvaluatorForm value={{ type: "levenshtein", threshold: 2 }} onChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
