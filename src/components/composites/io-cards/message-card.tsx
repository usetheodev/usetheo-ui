import type { ReactNode } from "react";
import { useState } from "react";
import { contentText, isRedactedThinking, prettyValue } from "../../../lib/trace/chat.js";
import type { ChatMessage, ToolCall } from "../../../lib/trace/types.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Card } from "../../primitives/card/index.js";
import { CopyButton } from "../../primitives/copy-button/index.js";
import { JsonViewer } from "../../primitives/json-viewer/index.js";

/** Chat role → Badge variant (visual triage, not bubbles). */
function roleVariant(role: string): "default" | "primary" | "accent" | "outline" {
  if (role === "user") return "primary";
  if (role === "assistant") return "accent";
  if (role === "system") return "default";
  return "outline";
}

export type RenderMarkdown = (text: string) => ReactNode;

/** Props shared by the message-rendering components (kills the repeated `{message, renderMarkdown}` shape). */
interface MessageProps {
  message: ChatMessage;
  renderMarkdown?: RenderMarkdown;
}

/** Default body renderer — plain text with preserved whitespace. NEVER interprets HTML (XSS-safe). */
function PlainText({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap break-words text-body-sm">{text}</p>;
}

/** A bordered, role-labeled Card: role Badge + body (markdown slot or plain text) + raw-JSON toggle. */
export function MessageCard({ message, renderMarkdown }: MessageProps) {
  const [showRaw, setShowRaw] = useState(false);
  const redacted = isRedactedThinking(message);
  const body = contentText(message.content);

  return (
    <Card size="sm" data-slot="io-card" data-testid="io-card">
      <Card.Body className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={roleVariant(message.role)}>{message.role}</Badge>
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={showRaw ? "Hide raw JSON" : "Show raw JSON"}
              onClick={() => setShowRaw((r) => !r)}
            >
              {showRaw ? "Hide JSON" : "Raw JSON"}
            </Button>
            <CopyButton
              value={JSON.stringify(message)}
              aria-label="Copy message JSON"
              variant="ghost"
              size="sm"
            />
          </div>
        </div>
        {redacted ? (
          <p className="text-muted-foreground text-xs italic">[Redacted thinking]</p>
        ) : body ? (
          renderMarkdown ? (
            renderMarkdown(body)
          ) : (
            <PlainText text={body} />
          )
        ) : (
          <p className="text-muted-foreground text-xs">—</p>
        )}
        {showRaw ? <JsonViewer value={message} collapsed={1} enableCopy /> : null}
      </Card.Body>
    </Card>
  );
}

/** A dedicated tool-call card: function name + call-id + JSON arguments. Linked to its result by id. */
export function ToolCallCard({ call }: { call: ToolCall }) {
  const name = call.function?.name ?? "(unnamed tool)";
  const args = call.function?.arguments ?? "";
  return (
    <Card size="sm" data-slot="io-tool-call">
      <Card.Body className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">tool call</Badge>
          <span className="font-mono font-semibold text-xs">{name}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{call.id}</span>
          <div className="ml-auto">
            <CopyButton value={args} aria-label="Copy tool arguments" variant="ghost" size="sm" />
          </div>
        </div>
        {args ? <JsonViewerText text={prettyValue(args)} /> : null}
      </Card.Body>
    </Card>
  );
}

/** A tool-result card, linked to its originating call by `tool_call_id`. */
export function ToolResultCard({ message }: { message: ChatMessage }) {
  const id = message.tool_call_id ?? "";
  const text = contentText(message.content);
  return (
    <Card size="sm" data-slot="io-tool-result">
      <Card.Body className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">tool result</Badge>
          <span className="font-mono text-[10px] text-muted-foreground">↳ {id}</span>
          <div className="ml-auto">
            <CopyButton value={text} aria-label="Copy tool result" variant="ghost" size="sm" />
          </div>
        </div>
        <JsonViewerText text={prettyValue(text)} />
      </Card.Body>
    </Card>
  );
}

/** Parse a pretty-printed string back to a value for the JsonViewer; falls back to a plain text node. */
function JsonViewerText({ text }: { text: string }) {
  try {
    return <JsonViewer value={JSON.parse(text)} collapsed={1} enableCopy />;
  } catch {
    return <pre className="overflow-auto rounded-md border p-2 font-mono text-xs">{text}</pre>;
  }
}

/** Render one chat message as its appropriate card kind (tool-result → tool-calls → plain message). */
export function MessageItem({ message, renderMarkdown }: MessageProps) {
  if (message.role === "tool" && message.tool_call_id) {
    return <ToolResultCard message={message} />;
  }
  const calls = message.tool_calls ?? [];
  if (calls.length > 0) {
    const hasBody = contentText(message.content) !== "" || isRedactedThinking(message);
    return (
      <div className="space-y-2">
        {hasBody ? <MessageCard message={message} renderMarkdown={renderMarkdown} /> : null}
        {calls.map((c) => (
          <ToolCallCard key={c.id} call={c} />
        ))}
      </div>
    );
  }
  return <MessageCard message={message} renderMarkdown={renderMarkdown} />;
}
