/**
 * Per-span and subtree USD cost. Pure and total — missing/non-numeric costs
 * collapse to 0 (never NaN) so `∑` badges stay honest.
 */

import type { TraceSpan } from "./types.js";

// Attribute keys (checked in order) a per-span cost may arrive under when not a promoted field.
const COST_ATTRIBUTE_KEYS = ["gen_ai.usage.cost", "gen_ai.usage.cost_usd", "cost_usd", "cost"];

/**
 * A single span's own USD cost: the promoted `costUsd` field, else the first
 * parseable cost attribute. Total: missing/non-numeric → 0 (never NaN);
 * negative costs floor to 0.
 */
export function spanCostUsd(span: TraceSpan): number {
  if (typeof span.costUsd === "number" && Number.isFinite(span.costUsd)) {
    return span.costUsd > 0 ? span.costUsd : 0;
  }
  const attrs = span.attributes ?? {};
  for (const key of COST_ATTRIBUTE_KEYS) {
    if (!(key in attrs)) continue;
    const raw = attrs[key];
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
    if (Number.isFinite(n)) return n > 0 ? n : 0;
  }
  return 0;
}

/**
 * A single span's own USD cost for PER-SPAN DISPLAY: the promoted `costUsd` field, else the first
 * parseable cost attribute — but returns `undefined` when the span has no individually-computed
 * cost (absent / non-numeric / ≤ 0). Distinct from `spanCostUsd` (which collapses to 0 for honest
 * `∑` badges): a per-span cost is "exists or doesn't", not a sum, so the absent case renders `—`
 * (em-dash) downstream instead of a fabricated `$0.0000` (M52 / theo-lens#71 Finding 3).
 */
export function spanOwnCostUsd(span: TraceSpan): number | undefined {
  if (typeof span.costUsd === "number" && Number.isFinite(span.costUsd)) {
    return span.costUsd > 0 ? span.costUsd : undefined;
  }
  const attrs = span.attributes ?? {};
  for (const key of COST_ATTRIBUTE_KEYS) {
    if (!(key in attrs)) continue;
    const raw = attrs[key];
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : Number.NaN;
    if (Number.isFinite(n)) return n > 0 ? n : undefined;
  }
  return undefined;
}

/**
 * Sum a span's own cost + all descendants' (`∑`). Total: missing cost counts as 0, never NaN.
 * Cycle-safe: a repeated/self-referential child is counted at most once (no stack overflow).
 */
export function aggregateCost(span: TraceSpan): number {
  const seen = new Set<string>();
  const walk = (s: TraceSpan): number => {
    if (seen.has(s.id)) return 0;
    seen.add(s.id);
    let total = spanCostUsd(s);
    for (const c of s.children ?? []) total += walk(c);
    return total;
  };
  return walk(span);
}
