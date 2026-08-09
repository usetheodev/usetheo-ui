import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TagInput as TagInputFromBarrel } from "../../../index.js";
import { TagInput } from "./tag-input.js";

describe("TagInput", () => {
  it("renders one chip per value", () => {
    render(<TagInput value={["alpha", "beta", "gamma"]} onChange={() => {}} />);
    const chips = screen.getAllByTestId("tag-input-chip");
    expect(chips).toHaveLength(3);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("gamma")).toBeInTheDocument();
  });

  it("adding a tag emits onChange with the new tag", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["alpha", "beta"]);
  });

  it("adding a tag clears the input", () => {
    render(<TagInput value={[]} onChange={() => {}} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
  });

  it("removing a chip emits onChange without it", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha", "beta"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: /remove alpha/i }));
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("a duplicate tag is a no-op (it does not emit onChange)", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("an empty or whitespace tag is a no-op", () => {
    const onChange = vi.fn();
    render(<TagInput value={["alpha"]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("a new tag is trimmed before being emitted", () => {
    const onChange = vi.fn();
    render(<TagInput value={[]} onChange={onChange} placeholder="Add a tag" />);
    const input = screen.getByPlaceholderText("Add a tag");
    fireEvent.change(input, { target: { value: "  beta  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["beta"]);
  });

  it("disabled disables both add and remove", () => {
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

  it("each chip has a remove button with an accessible label", () => {
    render(<TagInput value={["alpha"]} onChange={() => {}} />);
    const chip = screen.getByTestId("tag-input-chip");
    expect(within(chip).getByRole("button", { name: /remove alpha/i })).toBeInTheDocument();
  });

  it("is exported from the root barrel", () => {
    expect(TagInputFromBarrel).toBe(TagInput);
  });

  it("sem violações axe", async () => {
    const { container } = render(
      <TagInput value={["alpha", "beta"]} onChange={() => {}} placeholder="Add a tag" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
