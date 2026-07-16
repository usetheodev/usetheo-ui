import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * PriceBreakdown — a `<table>` of unit prices scaled to per-unit, per-1K, and
 * per-1M columns. Controlled and pure — the consumer supplies a `prices` map of
 * usage-type label → price per unit; each scale is a plain multiplication
 * (`price`, `price × 1000`, `price × 1_000_000`).
 *
 * An empty `prices` map renders an honest empty state, not an empty table. A
 * visually-hidden caption gives screen readers the table's purpose.
 *
 *   <PriceBreakdown prices={{ input: 0.000003, output: 0.000015 }} unit="token" />
 */

export interface PriceBreakdownProps extends HTMLAttributes<HTMLTableElement> {
  /** Usage-type label → price per unit. */
  prices: Record<string, number>;
  /** The unit each price is quoted per. Default `"token"`. */
  unit?: string;
  className?: string;
}

/** Fixed-notation, trailing-zero-trimmed price string — never scientific notation. */
function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "0";
  // 12 fraction digits covers sub-cent per-token prices without scientific notation.
  const fixed = n.toFixed(12);
  return fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
}

const PriceBreakdown = forwardRef<HTMLTableElement, PriceBreakdownProps>((props, ref) => {
  const { prices, unit = "token", className, ...rest } = props;
  const entries = Object.entries(prices);

  if (entries.length === 0) {
    return (
      <div
        data-slot="price-breakdown-empty"
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed p-3 text-body-sm text-muted-foreground",
          className,
        )}
        {...(rest as HTMLAttributes<HTMLDivElement>)}
      >
        No prices to break down.
      </div>
    );
  }

  return (
    <table
      data-slot="price-breakdown"
      ref={ref}
      className={cn("w-full text-xs", className)}
      {...rest}
    >
      <caption className="sr-only">Price breakdown per {unit}, per 1K, and per 1M</caption>
      <thead>
        <tr className="text-left text-muted-foreground">
          <th scope="col" className="py-1 pr-3 font-medium">
            Usage
          </th>
          <th scope="col" className="py-1 pr-3 text-right font-medium">
            Per {unit}
          </th>
          <th scope="col" className="py-1 pr-3 text-right font-medium">
            Per 1K
          </th>
          <th scope="col" className="py-1 text-right font-medium">
            Per 1M
          </th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([label, price]) => {
          const id = label.replace(/\s+/g, "-").toLowerCase();
          return (
            <tr key={label} data-slot="price-breakdown-row" className="border-border border-t">
              <th scope="row" className="py-1 pr-3 text-left font-normal">
                {label}
              </th>
              <td
                data-testid={`price-${id}-unit`}
                className="py-1 pr-3 text-right font-mono tabular-nums"
              >
                {formatPrice(price)}
              </td>
              <td
                data-testid={`price-${id}-1k`}
                className="py-1 pr-3 text-right font-mono tabular-nums"
              >
                {formatPrice(price * 1000)}
              </td>
              <td data-testid={`price-${id}-1m`} className="py-1 text-right font-mono tabular-nums">
                {formatPrice(price * 1_000_000)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});
PriceBreakdown.displayName = "PriceBreakdown";

export { PriceBreakdown };
