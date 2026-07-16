import type { Story } from "@ladle/react";
import { TokenCostBreakdown } from "./token-cost-breakdown.js";

export default { title: "Composites / Observability / TokenCostBreakdown" };

/** Full breakdown — input/output/cache tokens, total, and cost. */
export const Full: Story = () => (
  <div className="max-w-3xl">
    <TokenCostBreakdown
      inputTokens={1200}
      outputTokens={340}
      cacheTokens={80}
      totalTokens={1620}
      costUsd={0.0234}
    />
  </div>
);

/** Honest zeros — a real 0 renders 0 / $0.0000, never an em-dash. */
export const HonestZeros: Story = () => (
  <div className="max-w-3xl">
    <TokenCostBreakdown inputTokens={0} outputTokens={0} totalTokens={0} costUsd={0} />
  </div>
);

/** Partial — cache and cost absent render as em-dash (honest), not fabricated zeros. */
export const Partial: Story = () => (
  <div className="max-w-3xl">
    <TokenCostBreakdown inputTokens={512} outputTokens={128} totalTokens={640} />
  </div>
);

/** Empty state — every field absent. */
export const Empty: Story = () => (
  <div className="max-w-3xl">
    <TokenCostBreakdown />
  </div>
);
