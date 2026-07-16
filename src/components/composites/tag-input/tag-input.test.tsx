import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TagInput as TagInputFromBarrel } from "../../../index.js";
import { TagInput } from "./tag-input.js";

describe("TagInput", () => {
  it("renderiza um chip por valor", () => {
    render(<TagInput value={["alpha", "beta", "gamma"]} onChange={() => {}} />);
    const chips = screen.getAllByTestId("tag-input-chip");
    expect(chips).toHaveLength(3);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("gamma")).toBeInTheDocument();
  });

  it("adicionar tag emite onChange com a nova tag", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["alpha", "beta"]);
  });

  it("adicionar tag limpa o input", () => {
    render(<TagInput value={[]} onChange={() => {}} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });

  it("remover chip emite onChange sem ela", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha", "beta"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("tag duplicada é no-op (não emite onChange)", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("tag vazia/whitespace é no-op", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("nova tag é trimada antes de emitir", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "  beta  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("disabled desabilita add e remove", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" disabled />);
    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;
    expect(input).toBeDisabled();
    const removeBtn = screen.getByRole("button", { name: /remove alpha/i });
    expect(removeBtn).toBeDisabled();
    fireEvent.click(removeBtn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("expõe data-slot no root e ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(<TagInput ref={ref} value={[]} onChange={() => {}} />);
    const root = container.querySelector('[data-slot="tag-input"]');
    expect(root).not.toBeNull();
    expect(ref.current).toBe(root);
  });

  it("cada chip tem um botão remover com label acessível", () => {
    render(<TagInput value={["alpha"]} onChange={() => {}} />);
    const chip = screen.getByTestId("tag-input-chip");
    expect(within(chip).getByRole("button", { name: /remove alpha/i })).toBeInTheDocument();
  });

  it("é exportado pelo barrel raiz", () => {
    expect(TagInputFromBarrel).toBe(TagInput);
  });

  it("sem violações axe", async () => {
    const { container } = render(
      <TagInput value={["alpha", "beta"]} onChange={() => {}} placeholder="Add a tag" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
