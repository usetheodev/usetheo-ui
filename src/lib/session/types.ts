/**
 * Data contracts for the session-level components (M9). A session groups traces that share a
 * `session.id`; `SessionTraceItem` is the trace-level shape both `SessionSummary` and
 * `SessionTimeline` consume — the intersection of the theo-lens traces-list row and the peer
 * session views (phoenix numTraces+latency+cost, langfuse timestamp+name+latency). Timestamps
 * accept unix-ns (bigint | numeric string) or ISO — normalized by the trace-core `toNs`.
 */

export interface SessionTraceItem {
  id: string;
  name?: string;
  /** Unix ns (bigint | numeric string) or ISO-8601 string. */
  startTime?: bigint | string;
  /** Absent/null = in-flight (renders unbounded on the timeline). */
  endTime?: bigint | string | null;
  status?: "OK" | "ERROR";
  model?: string;
  costUsd?: number;
  totalTokens?: number;
}

/** Aggregate metrics over a session's traces. All numeric fields are 0 (never NaN) when absent. */
export interface SessionMetrics {
  traceCount: number;
  /** Session wall-clock window in ms: max(end) − min(start) across all traces. */
  windowMs: number;
  totalCostUsd: number;
  totalTokens: number;
  errorCount: number;
  /** Distinct models seen, sorted. */
  models: string[];
}
