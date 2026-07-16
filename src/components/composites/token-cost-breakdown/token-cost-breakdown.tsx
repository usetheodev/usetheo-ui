import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * TokenCostBreakdown — a `<dl>` breakdown of a request's/span's/trace's token
 * usage and USD cost: input, output, cache tokens, total, and cost. Controlled
 * and pure — the consumer supplies the numbers; nothing is fetched.
 *
 * Honest zeros (M9 SessionSummary convention): a real `0` renders `0` /
 * `$0.0000`; an ABSENT (undefined) field renders `—` (em-dash) — it is never
 * fabricated as a zero. When EVERY field is absent, an honest empty state
 * renders instead of a table of em-dashes.
 *
 *   <TokenCostBreakdown inputTokens={1200} outputTokens={340}
 *                       cacheTokens={80} totalTokens={1620} costUsd={0.0234} />
 */

export interface TokenCostBreakdownProps extends HTMLAttributes<HTMLDListElement> {
  inputTokens?: number;
  outputTokens?: number;
  cacheTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  /** USD cost formatter. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  className?: string;
}

const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

const EM_DASH = "—";

const tokens = (n: number | undefined) => (n === undefined ? EM_DASH : String(n));

const TokenCostBreakdown = forwardRef<HTMLDListElement, TokenCostBreakdownProps>((props, ref) => {
  const {
    inputTokens,
    outputTokens,
    cacheTokens,
    totalTokens,
    costUsd,
    formatCostUsd = defaultCost,
    className,
    ...rest
  } = props;

  const allAbsent =
    inputTokens === undefined &&
    outputTokens === undefined &&
    cacheTokens === undefined &&
    totalTokens === undefined &&
    costUsd === undefined;

  if (allAbsent) {
    return (
      <div
        data-slot="token-cost-breakdown-empty"
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed p-3 text-body-sm text-muted-foreground",
          className,
        )}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        No token usage to report.
      </div>
    );
  }

  return (
    <dl
      data-slot="token-cost-breakdown"
      ref={ref}
      className={cn(
        "grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/20 p-3 text-xs sm:grid-cols-3 lg:grid-cols-5",
        className,
      )}
      {...rest}
    >
      <Metric label="Input" value={tokens(inputTokens)} testId="tcb-input" />
      <Metric label="Output" value={tokens(outputTokens)} testId="tcb-output" />
      <Metric label="Cache" value={tokens(cacheTokens)} testId="tcb-cache" />
      <Metric label="Total" value={tokens(totalTokens)} testId="tcb-total" />
      <Metric
        label="Cost"
        value={costUsd === undefined ? EM_DASH : formatCostUsd(costUsd)}
        testId="tcb-cost"
      />
    </dl>
  );
});
TokenCostBreakdown.displayName = "TokenCostBreakdown";

function Metric({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd data-testid={testId} className="font-medium font-mono tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export { TokenCostBreakdown };
