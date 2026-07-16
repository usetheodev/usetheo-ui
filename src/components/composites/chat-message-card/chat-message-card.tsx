import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import type { ToolCall } from "../../../lib/trace/types.js";
import { Badge, type BadgeProps } from "../../primitives/badge/index.js";
import { CodeBlock } from "../code-block/index.js";

/**
 * ChatMessageCard — a SINGLE chat message rendered as a card (an atom):
 * a role badge, the text content, and any structured tool-calls / tool-results.
 *
 * Distinct from `TraceTranscript` (a feed of many messages): this is one
 * message, controlled entirely by props. Structured tool-calls / results are
 * rendered via the existing `CodeBlock` composite rather than hand-rolled
 * (M19 ADR D2 — DRY, reuse the M8 structured render).
 *
 * Reuses the trace-core `ToolCall` type ({ id; function?: { name?; arguments? } }),
 * so an assistant span's tool_calls drop in without a shim.
 *
 *   <ChatMessageCard role="assistant" content="On it" toolCalls={span.tool_calls} />
 */

/** Role → Badge variant. Unknown roles fall back to a neutral outline honestly. */
const roleVariant: Record<string, BadgeProps["variant"]> = {
  user: "primary",
  assistant: "success",
  tool: "accent",
  system: "outline",
};

function jsonText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export interface ChatMessageCardProps extends HTMLAttributes<HTMLDivElement> {
  /** ChatML role — user / assistant / tool / system (or any string). */
  role: string;
  /** Text body of the message. */
  content?: string;
  /** Structured tool calls attached to the message (assistant turns). */
  toolCalls?: ToolCall[];
  /** Structured tool results (tool turns). Serialized to JSON for display. */
  toolResults?: unknown[];
}

const ChatMessageCard = forwardRef<HTMLDivElement, ChatMessageCardProps>(
  ({ className, role, content, toolCalls, toolResults, ...props }, ref) => {
    const hasContent = content !== undefined && content !== "";
    const hasCalls = Array.isArray(toolCalls) && toolCalls.length > 0;
    const hasResults = Array.isArray(toolResults) && toolResults.length > 0;
    const isEmpty = !hasContent && !hasCalls && !hasResults;

    return (
      <div
        data-slot="chat-message-card"
        data-role={role}
        ref={ref}
        className={cn(
          "flex flex-col gap-2 rounded-lg border border-border/40 bg-card p-3",
          className,
        )}
        {...props}
      >
        <Badge variant={roleVariant[role] ?? "outline"} size="sm" className="self-start">
          {role}
        </Badge>

        {hasContent ? (
          <p
            data-slot="chat-message-card-content"
            className="whitespace-pre-wrap text-body-sm text-foreground"
          >
            {content}
          </p>
        ) : null}

        {hasCalls
          ? toolCalls?.map((call) => (
              <CodeBlock
                key={call.id}
                caption={call.function?.name ?? "tool call"}
                code={call.function?.arguments ?? ""}
              />
            ))
          : null}

        {hasResults
          ? toolResults?.map((result, i) => (
              <CodeBlock
                // biome-ignore lint/suspicious/noArrayIndexKey: results are positional; caller owns ordering.
                key={i}
                caption="result"
                code={jsonText(result)}
              />
            ))
          : null}

        {isEmpty ? (
          <p
            data-slot="chat-message-card-empty"
            className="text-body-sm text-muted-foreground italic"
          >
            No content.
          </p>
        ) : null}
      </div>
    );
  },
);
ChatMessageCard.displayName = "ChatMessageCard";

export { ChatMessageCard };
