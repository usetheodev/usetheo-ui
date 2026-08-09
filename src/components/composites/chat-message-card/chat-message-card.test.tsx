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
  it("renders a badge with the role", () => {
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

  it("renders the content as text", () => {
    render(<ChatMessageCard role="user" content="Find me flights" />);
    expect(screen.getByText("Find me flights")).toBeInTheDocument();
  });

  it("renders toolCalls through a code block", () => {
    const { container } = render(
      <ChatMessageCard role="assistant" content="Searching" toolCalls={toolCalls} />,
    );
    const codeBlocks = slots(container, "code-block");
    expect(codeBlocks.length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain("search_flights");
  });

  it("renders toolResults through a code block", () => {
    const { container } = render(
      <ChatMessageCard role="tool" toolResults={[{ ok: true, id: 42 }]} />,
    );
    expect(slots(container, "code-block").length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain("42");
  });

  it("with no content and no tools it shows an honest empty state", () => {
    const { container } = render(<ChatMessageCard role="assistant" />);
    expect(slots(container, "chat-message-card-empty")).toHaveLength(1);
    expect(slots(container, "code-block")).toHaveLength(0);
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ChatMessageCard role="user" content="Hi" ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("chat-message-card");
  });

  it("is exported from the root barrel", () => {
    expect(ChatMessageCardFromBarrel).toBe(ChatMessageCard);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ChatMessageCard role="assistant" content="Hello" toolCalls={toolCalls} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = render(<ChatMessageCard role="assistant" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
