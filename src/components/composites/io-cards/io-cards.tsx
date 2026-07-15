import { useState } from "react";
import { asChat, prettyValue } from "../../../lib/trace/chat.js";
import type { ChatMessage } from "../../../lib/trace/types.js";
import { Button } from "../../primitives/button/index.js";
import { JsonViewer } from "../../primitives/json-viewer/index.js";
import { MessageItem, type RenderMarkdown } from "./message-card.js";

const REDACTED = "<REDACTED>";
// Above this many messages a history collapses to first + last N behind a "Show N more" toggle.
const COLLAPSE_THRESHOLD = 8;
const HEAD_TAIL = 3;

export interface IOCardsProps {
  /** Raw payload string: a chat-message-array JSON, other JSON, or plain text. */
  value?: string;
  /** Optional slot for rendering markdown bodies (e.g. react-markdown + sanitize). Default: plain text. */
  renderMarkdown?: RenderMarkdown;
  "data-testid"?: string;
}

/**
 * IOCards — renders a span's input/output value. A chat-message array becomes
 * role-labeled cards (with tool-call/result linkage and long-history
 * collapse); a redacted marker and non-chat payloads fall back to a plain
 * message or the dependency-free `JsonViewer`. Markdown bodies go through the
 * optional `renderMarkdown` slot — the default renderer NEVER interprets HTML
 * (XSS-safe by construction; no `dangerouslySetInnerHTML` anywhere).
 */
export function IOCards({ value, renderMarkdown, "data-testid": testId }: IOCardsProps) {
  if (value === undefined || value === null || value === "") {
    return <p className="text-muted-foreground text-xs">—</p>;
  }
  if (value === REDACTED) {
    return (
      <p className="text-muted-foreground text-xs" data-testid={testId}>
        Redacted by the client (prompt logging is off).
      </p>
    );
  }
  const chat = asChat(value);
  if (chat) {
    return (
      <div data-slot="io-cards" data-testid={testId}>
        <MessageFeed messages={chat} renderMarkdown={renderMarkdown} />
      </div>
    );
  }
  // Non-chat payload → the JsonViewer fallback (dependency-free, ADR D3).
  return <NonChatFallback value={value} testId={testId} />;
}

function NonChatFallback({ value, testId }: { value: string; testId?: string }) {
  try {
    return <JsonViewer value={JSON.parse(value)} collapsed={1} enableCopy />;
  } catch {
    return (
      <pre data-testid={testId} className="overflow-auto rounded-md border p-2 font-mono text-xs">
        {prettyValue(value)}
      </pre>
    );
  }
}

function MessageFeed({
  messages,
  renderMarkdown,
}: {
  messages: ChatMessage[];
  renderMarkdown?: RenderMarkdown;
}) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = messages.length > COLLAPSE_THRESHOLD;

  if (!collapsible || expanded) {
    return (
      <div className="space-y-2">
        {messages.map((m, i) => (
          <MessageItem key={i} message={m} renderMarkdown={renderMarkdown} />
        ))}
        {collapsible && expanded ? (
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            Show less
          </Button>
        ) : null}
      </div>
    );
  }

  const head = messages.slice(0, HEAD_TAIL);
  const tail = messages.slice(messages.length - HEAD_TAIL);
  const hiddenCount = messages.length - head.length - tail.length;

  return (
    <div className="space-y-2">
      {head.map((m, i) => (
        <MessageItem key={`h-${i}`} message={m} renderMarkdown={renderMarkdown} />
      ))}
      <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
        {`Show ${hiddenCount} more`}
      </Button>
      {tail.map((m, i) => (
        <MessageItem key={`t-${i}`} message={m} renderMarkdown={renderMarkdown} />
      ))}
    </div>
  );
}
