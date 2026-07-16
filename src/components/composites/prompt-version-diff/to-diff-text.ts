/**
 * Pure normalizers that turn a prompt snapshot's domain shape into the plain
 * text `DiffView` diffs (M14 ADR D3 — composites normalize, DiffView diffs).
 * No React, no I/O; total and deterministic.
 */

/** A single chat message in an array-shaped (ChatML-style) template. */
export interface ChatMessage {
  role: string;
  content: string;
}

/** A prompt version: either a raw string template or a chat-message array. */
export interface PromptSnapshot {
  template: string | ChatMessage[];
  config?: Record<string, unknown>;
}

/**
 * Normalize a template to readable text. A string passes through unchanged; a
 * chat array becomes one `role: content` line per message (blank line between
 * messages so multi-line contents stay legible in the diff).
 */
export function templateToText(template: string | ChatMessage[]): string {
  if (typeof template === "string") return template;
  return template.map((m) => `${m.role}: ${m.content}`).join("\n\n");
}

/**
 * Pretty-print a config object to JSON. Absent/empty → "" (the caller omits the
 * config diff entirely when both sides are empty).
 */
export function configToText(config?: Record<string, unknown>): string {
  if (!config || Object.keys(config).length === 0) return "";
  return JSON.stringify(config, null, 2);
}
