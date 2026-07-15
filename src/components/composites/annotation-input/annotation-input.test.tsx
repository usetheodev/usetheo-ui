import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AnnotationInput as AnnotationInputFromBarrel } from "../../../index.js";
import { AnnotationInput } from "./annotation-input.js";
import type {
  AnnotationCategoricalConfig,
  AnnotationContinuousConfig,
  AnnotationFreeformConfig,
} from "./types.js";

const categorical: AnnotationCategoricalConfig = {
  type: "categorical",
  options: [
    { label: "good", score: 1 },
    { label: "ok", score: 0.5 },
    { label: "bad", score: 0 },
  ],
};
const continuous: AnnotationContinuousConfig = { type: "continuous", min: 0, max: 1, step: 0.1 };
const freeform: AnnotationFreeformConfig = { type: "freeform", maxLength: 500 };

describe("AnnotationInput — categorical", () => {
  it("renderiza um radio por opção do config", () => {
    render(
      <AnnotationInput name="Quality" config={categorical} value={null} onValueChange={() => {}} />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("onValueChange emite a label selecionada", () => {
    const onChange = vi.fn();
    render(
      <AnnotationInput name="Quality" config={categorical} value={null} onValueChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /good/i }));
    expect(onChange).toHaveBeenCalledWith("good");
  });

  it("reflete o value controlado (radio marcado)", () => {
    render(
      <AnnotationInput name="Quality" config={categorical} value="ok" onValueChange={() => {}} />,
    );
    expect(screen.getByRole("radio", { name: /ok/i })).toBeChecked();
  });

  it("expõe o name como accessible name do radiogroup", () => {
    render(
      <AnnotationInput name="Quality" config={categorical} value={null} onValueChange={() => {}} />,
    );
    expect(screen.getByRole("radiogroup", { name: /quality/i })).toBeInTheDocument();
  });
});

describe("AnnotationInput — continuous", () => {
  it("renderiza number input com bounds do config", () => {
    render(
      <AnnotationInput name="Rating" config={continuous} value={null} onValueChange={() => {}} />,
    );
    const input = screen.getByLabelText(/rating/i) as HTMLInputElement;
    expect(input.type).toBe("number");
    expect(input.min).toBe("0");
    expect(input.max).toBe("1");
    expect(input.step).toBe("0.1");
  });

  it("emite number ao digitar e null ao esvaziar (nunca NaN)", () => {
    const onChange = vi.fn();
    render(
      <AnnotationInput name="Rating" config={continuous} value={0.5} onValueChange={onChange} />,
    );
    const input = screen.getByLabelText(/rating/i);
    fireEvent.change(input, { target: { value: "0.8" } });
    expect(onChange).toHaveBeenLastCalledWith(0.8);
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe("AnnotationInput — freeform", () => {
  it("renderiza textarea e emite string", () => {
    const onChange = vi.fn();
    render(<AnnotationInput name="Note" config={freeform} value={null} onValueChange={onChange} />);
    const ta = screen.getByLabelText(/note/i);
    expect(ta.tagName).toBe("TEXTAREA");
    fireEvent.change(ta, { target: { value: "looks off" } });
    expect(onChange).toHaveBeenCalledWith("looks off");
  });

  it("emite null ao esvaziar", () => {
    const onChange = vi.fn();
    render(<AnnotationInput name="Note" config={freeform} value="x" onValueChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/note/i), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe("AnnotationInput — comum", () => {
  it("required marca aria-required no controle (continuous)", () => {
    render(
      <AnnotationInput
        name="Rating"
        config={continuous}
        value={null}
        onValueChange={() => {}}
        required
      />,
    );
    expect(screen.getByLabelText(/rating/i)).toHaveAttribute("aria-required", "true");
  });

  it("disabled desabilita o controle (freeform)", () => {
    render(
      <AnnotationInput
        name="Note"
        config={freeform}
        value={null}
        onValueChange={() => {}}
        disabled
      />,
    );
    expect(screen.getByLabelText(/note/i)).toBeDisabled();
  });

  it("expõe data-slot e data-type no root", () => {
    const { container } = render(
      <AnnotationInput name="Note" config={freeform} value={null} onValueChange={() => {}} />,
    );
    const root = container.querySelector('[data-slot="annotation-input"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute("data-type")).toBe("freeform");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(AnnotationInputFromBarrel).toBe(AnnotationInput);
  });

  it("sem violações axe — categorical", async () => {
    const { container } = render(
      <AnnotationInput name="Quality" config={categorical} value="good" onValueChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sem violações axe — continuous", async () => {
    const { container } = render(
      <AnnotationInput name="Rating" config={continuous} value={0.5} onValueChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sem violações axe — freeform", async () => {
    const { container } = render(
      <AnnotationInput name="Note" config={freeform} value="hi" onValueChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
