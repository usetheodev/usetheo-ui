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
