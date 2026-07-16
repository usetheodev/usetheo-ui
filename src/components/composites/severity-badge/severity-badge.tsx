import { type HTMLAttributes, forwardRef } from "react";

import { cn } from "../../../lib/cn.js";
import { Badge, type BadgeProps } from "../../primitives/badge/index.js";

/**
 * SeverityBadge — labeled, multi-level severity indicator (composite).
 *
 * Composes the `Badge` primitive: maps a `Severity` level (langfuse's
 * MonitorSeverity vocabulary, lowercased) to a Badge `variant`, rendering a
 * human-readable label.
 *
 * NOT a duplicate of `StatusIndicator`: StatusIndicator is a small colored
 * *status dot* (online/offline/degraded/info) conveying component liveness.
 * SeverityBadge is a *labeled Badge* conveying a multi-level severity grade
 * (ok/warning/alert/no_data/unknown/paused) — different semantics, different
 * surface (bordered pill with text, not a dot). See plan ADR D2.
 *
 * @example
 *   <SeverityBadge severity="alert" />                    // "Alert", destructive
 *   <SeverityBadge severity="ok" label="Healthy" />       // custom label
 *   <SeverityBadge severity="warning" variantMap={{ warning: "accent" }} />
 */

/** Severity level. langfuse MonitorSeverity vocabulary, lowercased. */
export type Severity = "ok" | "warning" | "alert" | "no_data" | "unknown" | "paused";

/** A Badge visual variant (derived from the Badge primitive). */
export type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export interface SeverityBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Severity level to convey. */
  severity: Severity;
  /** Overrides the default human-readable label derived from the severity. */
  label?: string;
  /** Per-severity overrides of the default severity → Badge variant map. */
  variantMap?: Partial<Record<Severity, BadgeVariant>>;
}

/** Default severity → Badge variant map. Alert/warning/ok are semantic; the
 * remaining "no signal" states map to the neutral `outline` variant. */
const DEFAULT_VARIANT_MAP: Record<Severity, BadgeVariant> = {
  alert: "destructive",
  warning: "warning",
  ok: "success",
  no_data: "outline",
  unknown: "outline",
  paused: "outline",
};

/** Default human-readable labels. Keeps "OK" upper-cased and "No data"
 * space-separated instead of naive capitalization of the enum token. */
const DEFAULT_LABEL: Record<Severity, string> = {
  ok: "OK",
  warning: "Warning",
  alert: "Alert",
  no_data: "No data",
  unknown: "Unknown",
  paused: "Paused",
};

/** Neutral fallback for values outside the Severity union — fail honestly, never crash. */
const NEUTRAL_VARIANT: BadgeVariant = "outline";

function deriveLabel(severity: Severity): string {
  return DEFAULT_LABEL[severity] ?? severity;
}

export const SeverityBadge = forwardRef<HTMLSpanElement, SeverityBadgeProps>(
  ({ severity, label, variantMap, className, ...rest }, ref) => {
    const variant = variantMap?.[severity] ?? DEFAULT_VARIANT_MAP[severity] ?? NEUTRAL_VARIANT;
    const text = label ?? deriveLabel(severity);
    return (
      <Badge
        data-slot="severity-badge"
        data-severity={severity}
        ref={ref}
        variant={variant}
        className={cn(className)}
        {...rest}
      >
        {text}
      </Badge>
    );
  },
);
SeverityBadge.displayName = "SeverityBadge";
