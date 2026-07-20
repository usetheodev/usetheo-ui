/**
 * Shared data contracts for the trace-native component family (M8).
 *
 * `TraceSpan` is the intersection of three real shapes (phoenix ISpanItem,
 * langfuse observation, theo-lens TraceSpanNode — blueprint Corner 2): the
 * smallest type every kit component consumes. Transport fields (tRPC/GraphQL)
 * are deliberately absent. Timestamps accept unix-ns (bigint or numeric
 * string) or an ISO-8601 string — `toNs()` normalizes at the boundary.
 *
 * Note: `bigint` values do not JSON-serialize — story/args tooling must use
 * fixtures directly (EC-2 of the plan).
 */

/** OpenInference / OTel GenAI span-kind vocabulary (subset the kit renders). */
export type SpanKind =
  | "llm"
  | "tool"
  | "retriever"
  | "embedding"
  | "agent"
  | "chain"
  | "reranker"
  | "evaluator"
  | "guardrail"
  | "unknown";

export type SpanStatus = "OK" | "ERROR" | "UNSET";

export interface TraceSpan {
  id: string;
  parentId: string | null;
  name: string;
  /** Raw kind hint; semantic kind is derived via `deriveSpanKind` when absent. */
  kind?: string;
  /** Unix ns (bigint | numeric string) or ISO-8601 string. */
  startTime?: bigint | string;
  /** Absent/null = in-flight span (renders unbounded). */
  endTime?: bigint | string | null;
  status?: SpanStatus;
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  ttftMs?: number;
  costUsd?: number;
  /** Raw input/output payloads (JSON string, chat array JSON, or plain text). */
  inputValue?: string;
  outputValue?: string;
  attributes?: Record<string, unknown>;
  events?: Array<{ name: string; time?: bigint | string; attributes?: Record<string, unknown> }>;
  children?: TraceSpan[];
}

/** One OpenAI-shaped tool call attached to an assistant message. */
export interface ToolCall {
  id: string;
  function?: { name?: string; arguments?: string };
}

/** ChatML message — the role vocabulary common to phoenix/langfuse/lens. */
export interface ChatMessage {
  role: string;
  content: unknown;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface FlatSpan {
  span: TraceSpan;
  depth: number;
}

/** Per-row micro-stats surfaced by the transcript feed. Missing inputs collapse to 0/null, never NaN. */
export interface TranscriptRowStats {
  inputTokens: number;
  outputTokens: number;
  /**
   * Per-span own cost. `undefined` when the span has no individually-computed cost — the feed
   * renders `—` then, never a fabricated `$0.0000` (M52 / theo-lens#71 Finding 3). A real computed
   * cost is a positive number.
   */
  costUsd: number | undefined;
  durationMs: number | null;
}

/** One row in the reader-mode transcript feed. */
export interface TranscriptRow {
  kind: "span" | "group-header";
  spanId: string;
  role?: string;
  preview?: string;
  stats?: TranscriptRowStats;
  groupId?: string;
}
