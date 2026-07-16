import type { Story } from "@ladle/react";
import type { ToolCall } from "../../../lib/trace/types.js";
import { ChatMessageCard } from "./chat-message-card.js";

export default { title: "Composites / Chat / ChatMessageCard" };

const wrap = (node: React.ReactNode) => <div className="max-w-lg space-y-3">{node}</div>;

const calls: ToolCall[] = [
  {
    id: "call_1",
    function: {
      name: "search_flights",
      arguments: '{"from":"POA","to":"GRU","date":"2026-08-01"}',
    },
  },
];

export const Conversation: Story = () =>
  wrap(
    <>
      <ChatMessageCard role="system" content="You are a helpful travel agent." />
      <ChatMessageCard role="user" content="Find me flights from POA to GRU next Friday." />
      <ChatMessageCard role="assistant" content="Searching now." toolCalls={calls} />
      <ChatMessageCard role="tool" toolResults={[{ flights: [{ id: "G3-1001", price: 320 }] }]} />
      <ChatMessageCard role="assistant" content="I found **G3-1001** for R$320." />
    </>,
  );

/** Empty message (no content, no tools) reads as an honest placeholder. */
export const Empty: Story = () => wrap(<ChatMessageCard role="assistant" />);
