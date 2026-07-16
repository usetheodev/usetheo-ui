import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MessageBranchSelector as MessageBranchSelectorFromBarrel } from "../../../index.js";
import { MessageBranchSelector } from "./message-branch-selector.js";

describe("MessageBranchSelector", () => {
  it("mostra o index (1-based) e o count", () => {
    render(<MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
  });

  it("next chama onNext", () => {
    const onNext = vi.fn();
    render(<MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("prev chama onPrev", () => {
    const onPrev = vi.fn();
    render(<MessageBranchSelector index={2} count={5} onPrev={onPrev} onNext={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it("no index 0 o botão prev está desabilitado", () => {
    render(<MessageBranchSelector index={0} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });

  it("no último index o botão next está desabilitado", () => {
    render(<MessageBranchSelector index={4} count={5} onPrev={() => {}} onNext={() => {}} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /previous/i })).not.toBeDisabled();
  });

  it("disabled desabilita ambos os botões", () => {
    render(
      <MessageBranchSelector index={2} count={5} onPrev={() => {}} onNext={() => {}} disabled />,
    );
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("count <= 1 não renderiza nada", () => {
    const { container } = render(
      <MessageBranchSelector index={0} count={1} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(container.querySelector('[data-slot="message-branch-selector"]')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it("encaminha ref para o elemento raiz", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} ref={ref} />,
    );
    expect(ref.current?.getAttribute("data-slot")).toBe("message-branch-selector");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(MessageBranchSelectorFromBarrel).toBe(MessageBranchSelector);
  });

  it("não tem violações axe", async () => {
    const { container } = render(
      <MessageBranchSelector index={1} count={5} onPrev={() => {}} onNext={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
