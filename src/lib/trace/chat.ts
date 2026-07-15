/**
 * ChatML detection + payload pretty-print. Pure and total. Output is ALWAYS
 * plain text/data — nothing here interprets HTML (the transcript/IO renderers
 * inherit the no-dangerouslySetInnerHTML invariant from these totals).
 */

import type { ChatMessage } from "./types.js";

/** Parse a value as a chat-message array (`[{role, content}, …]`) or null when it is not one. */
export function asChat(value: string): ChatMessage[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((m) => m !== null && typeof m === "object" && "role" in m && "content" in m)
    ) {
      return parsed as ChatMessage[];
    }
  } catch {
    /* not JSON → not chat */
  }
  return null;
}

/** Pretty-print a stringified value as JSON when parseable, else leave it raw. Always plain text. */
export function prettyValue(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

const REDACTED = "<REDACTED>";

/** True when a message's content is redacted OR is/contains redacted thinking/reasoning. Pure, total. */
export function isRedactedThinking(m: ChatMessage): boolean {
  if (m.content === REDACTED) return true;
  if (Array.isArray(m.content)) {
    return m.content.some((b) => {
      if (b === null || typeof b !== "object") return false;
      const block = b as Record<string, unknown>;
      const type = typeof block.type === "string" ? block.type : "";
      if (type === "redacted_thinking") return true;
      if (type === "thinking") {
        return block.thinking === REDACTED || block.thinking === undefined || block.thinking === "";
      }
      return false;
    });
  }
  return false;
}

/** Extract a plain-text body from a message's content (string, or joined text/thinking blocks). Total. */
export function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content === null || content === undefined) return "";
  if (Array.isArray(content)) {
    return content
      .map((b) => {
        if (typeof b === "string") return b;
        if (b !== null && typeof b === "object") {
          const block = b as Record<string, unknown>;
          if (typeof block.text === "string") return block.text;
          if (typeof block.thinking === "string") return block.thinking;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return JSON.stringify(content, null, 2);
}
