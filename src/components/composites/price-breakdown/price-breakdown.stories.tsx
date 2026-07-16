import type { Story } from "@ladle/react";
import { PriceBreakdown } from "./price-breakdown.js";

export default { title: "Composites / Observability / PriceBreakdown" };

/** Per-token model pricing scaled to per-1K / per-1M. */
export const ModelPricing: Story = () => (
  <div className="max-w-2xl">
    <PriceBreakdown
      prices={{ input: 0.000003, output: 0.000015, "cache read": 0.0000003 }}
      unit="token"
    />
  </div>
);

/** Empty state — no prices to break down. */
export const Empty: Story = () => (
  <div className="max-w-2xl">
    <PriceBreakdown prices={{}} />
  </div>
);
