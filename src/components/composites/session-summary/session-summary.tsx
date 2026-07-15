import { useMemo } from "react";
import { cn } from "../../../lib/cn.js";
import { aggregateSession } from "../../../lib/session/aggregate.js";
import type { SessionMetrics, SessionTraceItem } from "../../../lib/session/types.js";
import { formatDurationMs } from "../../../lib/trace/duration.js";
import { Badge } from "../../primitives/badge/index.js";

export interface SessionSummaryProps {
  /** The session's traces — aggregated internally. Supply `metrics` instead to pass a pre-aggregate. */
  items?: SessionTraceItem[];
  /** Pre-computed metrics (overrides `items`). */
  metrics?: SessionMetrics;
  /** USD cost formatter. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  className?: string;
  "aria-label"?: string;
}

const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

/**
 * SessionSummary — a `<dl>` of honest aggregate metrics over a session's traces: trace count, the
 * session wall-clock window, ∑ cost, ∑ tokens, error count (highlighted destructive when > 0), and
 * the distinct models. Sums of zero are honest (`$0.0000`, `0`), never an em-dash. Pass `items` (it
 * aggregates via `aggregateSession`) or a pre-computed `metrics`.
 */
export function SessionSummary({
  items,
  metrics,
  formatCostUsd = defaultCost,
  className,
  "aria-label": ariaLabel = "Session summary",
}: SessionSummaryProps) {
  const m = useMemo(() => metrics ?? aggregateSession(items ?? []), [metrics, items]);
  return (
    <dl
      data-slot="session-summary"
      aria-label={ariaLabel}
      className={cn(
        "grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      <Stat label="Traces" value={String(m.traceCount)} />
      <Stat
        label="Duration"
        value={m.windowMs > 0 ? formatDurationMs(m.windowMs) : "—"}
        testId="session-duration"
      />
      <Stat label="Cost" value={formatCostUsd(m.totalCostUsd)} testId="session-cost" />
      <Stat label="Tokens" value={String(m.totalTokens)} testId="session-tokens" />
      <div>
        <dt className="text-muted-foreground">Errors</dt>
        <dd
          data-slot="session-error"
          data-error={m.errorCount > 0 ? "true" : undefined}
          className={cn(
            "font-medium font-mono tabular-nums",
            m.errorCount > 0 && "text-destructive",
          )}
        >
          {m.errorCount}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-muted-foreground">Models</dt>
        <dd data-testid="session-models" className="flex flex-wrap gap-1">
          {m.models.length > 0 ? (
            m.models.map((model) => (
              <Badge key={model} variant="outline" className="font-mono">
                {model}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd data-testid={testId} className="font-medium font-mono tabular-nums">
        {value}
      </dd>
    </div>
  );
}
