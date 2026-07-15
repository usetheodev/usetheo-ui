import type { Story } from "@ladle/react";
import { IOCards } from "./io-cards.js";

export default { title: "Composites / Observability / IOCards" };

const CHAT = JSON.stringify([
  { role: "system", content: "You are a helpful travel agent." },
  { role: "user", content: "Find me flights from POA to GRU next Friday." },
  {
    role: "assistant",
    content: "Let me search for that.",
    tool_calls: [
      {
        id: "call_1",
        function: { name: "search_flights", arguments: '{"from":"POA","to":"GRU"}' },
      },
    ],
  },
  { role: "tool", content: '{"flights":[{"id":"G3-1001","price":320}]}', tool_call_id: "call_1" },
  { role: "assistant", content: "I found **G3-1001** for R$320." },
]);

export const ChatWithToolCalls: Story = () => (
  <div className="max-w-2xl">
    <IOCards value={CHAT} />
  </div>
);

export const NonChatJson: Story = () => (
  <div className="max-w-2xl">
    <IOCards value='{"query":"flights","results":42,"nested":{"a":[1,2,3]}}' />
  </div>
);

export const Empty: Story = () => <IOCards value="" />;
