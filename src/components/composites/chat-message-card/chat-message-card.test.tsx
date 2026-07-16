import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ChatMessageCard as ChatMessageCardFromBarrel } from "../../../index.js";
import type { ToolCall } from "../../../lib/trace/types.js";
import { ChatMessageCard } from "./chat-message-card.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

const toolCalls: ToolCall[] = [
  { id: "call_1", function: { name: "search_flights", arguments: '{"from":"POA"}' } },
];

describe("ChatMessageCard", () => {
  it("renderiza um badge com o role", () => {
    const { container } = render(<ChatMessageCard role="assistant" content="Hi" />);
    const badge = container.querySelector('[data-slot="badge"]');
    expect(badge?.textContent).toMatch(/assistant/i);
  });

  it("expõe o role via data-role no root", () => {
    const { container } = render(<ChatMessageCard role="user" content="Hi" />);
    expect(
      container.querySelector('[data-slot="chat-message-card"]')?.getAttribute("data-role"),
    ).toBe("user");
  });

  it("renderiza o content como texto", () => {
    render(<ChatMessageCard role="user" content="Find me flights" />);
    expect(screen.getByText("Find me flights")).toBeInTheDocument();
  });

  it("renderiza toolCalls via code block", () => {
    const { container } = render(
      <ChatMessageCard role="assistant" content="Searching" toolCalls={toolCalls} />,
    );
    const codeBlocks = slots(container, "code-block");
    expect(codeBlocks.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain("search_flights");
  });

  it("renderiza toolResults via code block", () => {
    const { container } = render(
      <ChatMessageCard role="tool" toolResults={[{ ok: true, id: 42 }]} />,
    );
    expect(slots(container, "code-block").length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain("42");
  });

  it("sem content e sem tools mostra empty state honesto", () => {
    const { container } = render(<ChatMessageCard role="assistant" />);
    expect(slots(container, "chat-message-card-empty")).toHaveLength(1);
    expect(slots(container, "code-block")).toHaveLength(0);
  });

  it("encaminha ref para o elemento raiz", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ChatMessageCard role="user" content="Hi" ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("chat-message-card");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(ChatMessageCardFromBarrel).toBe(ChatMessageCard);
  });

  it("não tem violações axe", async () => {
    const { container } = render(
      <ChatMessageCard role="assistant" content="Hello" toolCalls={toolCalls} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("não tem violações axe no empty state", async () => {
    const { container } = render(<ChatMessageCard role="assistant" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
