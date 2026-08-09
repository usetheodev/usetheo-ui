import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MessageBranchSelector as MessageBranchSelectorFromBarrel } from "../../../index.js";
import { MessageBranchSelector } from "./message-branch-selector.js";

describe("MessageBranchSelector", () => {
  it("shows the index (1-based) and the count", () => {
    render(<MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("next calls onNext", () => {
    const onNext = vi.fn();
    render(<MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("prev calls onPrev", () => {
    const onPrev = vi.fn();
    render(<MessageBranchSelector index={2} count={5} onPrev={onPrev} onNext={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("at index 0 the prev button is disabled", () => {
    render(<MessageBranchSelector index={0} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });

  it("at the last index the next button is disabled", () => {
    render(<MessageBranchSelector index={4} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
  });

  it("disabled disables both buttons", () => {
    render(
      <MessageBranchSelector index={2} count={5} onPrev={() => {}} onNext={() => {}} disabled />,
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("a count <= 1 renders nothing", () => {
    const { container } = render(
      <MessageBranchSelector index={0} count={1} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(container.querySelector('[data-slot="message-branch-selector"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} ref={ref} />,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("message-branch-selector");
  });

  it("is exported from the root barrel", () => {
    expect(MessageBranchSelectorFromBarrel).toBe(MessageBranchSelector);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
