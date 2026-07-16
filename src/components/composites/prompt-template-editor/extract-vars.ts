/**
 * extractVars — pure extraction of variable names from a prompt template.
 *
 * Recognizes both mustache (`{{name}}`) and f-string (`{name}`) placeholders.
 * The mustache alternative is listed first so `{{name}}` matches as one variable
 * rather than a `{name}` wrapped in stray braces. Names are trimmed, empty
 * placeholders are ignored, and the result is deduped while preserving first-seen
 * order. No editor library involved (M19 ADR D1).
 */
const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}|\{\s*([^{}]*?)\s*\}/g;

export function extractVars(template: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of template.matchAll(PLACEHOLDER)) {
    const name = (match[1] ?? match[2] ?? "").trim();
    if (name === "" || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}
