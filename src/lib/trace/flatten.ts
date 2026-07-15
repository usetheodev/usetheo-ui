/**
 * Tree flattening + the reader-mode transcript row model. Pure and total.
 * `flattenVisible` order is the contract every renderer (tree, waterfall,
 * transcript) shares, so selection/keyboard indices agree across views.
 */

import { spanCostUsd } from "./cost.js";
import { durationMs } from "./duration.js";
import type { FlatSpan, TraceSpan, TranscriptRow } from "./types.js";

/**
 * Above this many visible rows, renderers switch from the recursive path to
 * the react-virtual flat-list (blueprint Corner 2 Q9; langfuse uses 350, the
 * lens origin uses 200 — virtualization only when it earns its complexity).
 */
export const VIRTUALIZE_THRESHOLD = 200;

/** Depth-first flatten of ALL spans (ignores collapse) — resolve-by-id / envelope input. */
export function flattenAll(root: TraceSpan): TraceSpan[] {
  const out: TraceSpan[] = [root];
  for (const c of root.children ?? []) out.push(...flattenAll(c));
  return out;
}

/** Depth-first flatten of VISIBLE spans (a node in `collapsed` contributes no descendants). */
export function flattenVisible(root: TraceSpan, collapsed: Set<string>): FlatSpan[] {
  const out: FlatSpan[] = [];
  const walk = (span: TraceSpan, depth: number) => {
    out.push({ span, depth });
    if (!collapsed.has(span.id)) for (const c of span.children ?? []) walk(c, depth + 1);
  };
  walk(root, 0);
  return out;
}

// A span whose output preview is longer than this is sliced (the full body lives in the detail pane).
const TRANSCRIPT_PREVIEW_CHARS = 140;
// A node fanning out into ≥2 children is treated as a subagent subtree and gets a collapsible
// group-header row before its children (there is no reliable agent-kind signal in raw OTLP data).
const SUBAGENT_MIN_CHILDREN = 2;

/** A short, single-line preview of a span's output (empty string when absent — never a crash). */
function transcriptPreview(span: TraceSpan): string {
  const oneLine = (span.outputValue ?? "").replace(/\s+/g, " ").trim();
  return oneLine.length > TRANSCRIPT_PREVIEW_CHARS
    ? `${oneLine.slice(0, TRANSCRIPT_PREVIEW_CHARS)}…`
    : oneLine;
}

/**
 * Flatten a span tree into the ordered reader-mode transcript feed. Pre-order
 * walk so `span`-row order matches `flattenVisible`. A fan-out node emits a
 * `group-header` row BEFORE its child rows so the view can collapse the group.
 */
export function toTranscriptRows(root: TraceSpan): TranscriptRow[] {
  const rows: TranscriptRow[] = [];
  const walk = (span: TraceSpan) => {
    const children = span.children ?? [];
    rows.push({
      kind: "span",
      spanId: span.id,
      role: span.kind ?? span.name ?? "span",
      preview: transcriptPreview(span),
      stats: {
        inputTokens: span.inputTokens ?? 0,
        outputTokens: span.outputTokens ?? 0,
        costUsd: spanCostUsd(span),
        durationMs: durationMs(span),
      },
    });
    if (children.length >= SUBAGENT_MIN_CHILDREN) {
      rows.push({ kind: "group-header", spanId: span.id, groupId: span.id });
    }
    for (const c of children) walk(c);
  };
  walk(root);
  return rows;
}
