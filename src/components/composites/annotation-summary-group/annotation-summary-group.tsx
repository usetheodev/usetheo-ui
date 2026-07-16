import { forwardRef } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Card } from "../../primitives/card/index.js";
import type { AnnotationConfig } from "../annotation-input/types.js";

/**
 * AnnotationSummaryGroup — a collapsible group showing AGGREGATE stats over a
 * list of annotation values for one `AnnotationConfig` (M18). Reuses the M12
 * `AnnotationConfig` contract (DRY, ADR D2) and dispatches on `config.type`:
 *   - continuous  → mean of the finite numeric values + count.
 *   - categorical → count per option label + total count.
 *   - freeform    → count of non-empty values.
 *
 * Controlled and pure — the consumer owns `values` (fixture or backend store);
 * this component only summarizes. Uses a native `<details>`/`<summary>` for
 * zero-JS collapsibility; composes `Card`/`Badge`. Zero new dependency.
 *
 *   <AnnotationSummaryGroup config={cfg} values={vals} label="Quality" />
 */

export interface AnnotationSummaryGroupProps {
  /** The annotation config the values were collected against (reused from M12). */
  config: AnnotationConfig;
  /** The collected annotation values to aggregate. */
  values: (string | number)[];
  /** Group heading; falls back to the config type when omitted. */
  label?: string;
  /** Whether the group starts expanded. */
  defaultOpen?: boolean;
  className?: string;
}

/** Mean of the finite numeric values; null when none are finite. */
function finiteMean(values: (string | number)[]): number | null {
  const nums = values.map(Number).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Trim a float to at most 3 decimals without trailing-zero noise. */
function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

/** Count of values equal to each option label, in config order. */
function countByOption(
  options: { label: string }[],
  values: (string | number)[],
): { label: string; count: number }[] {
  return options.map((opt) => ({
    label: opt.label,
    count: values.filter((v) => v === opt.label).length,
  }));
}

const AnnotationSummaryGroup = forwardRef<HTMLDetailsElement, AnnotationSummaryGroupProps>(
  ({ config, values, label, defaultOpen, className }, ref) => {
    const heading = label ?? config.type;

    if (values.length === 0) {
      return (
        <Card
          data-slot="annotation-summary-group-empty"
          className={cn("p-4 text-body-sm text-muted-foreground", className)}
        >
          {heading}: no annotations yet
        </Card>
      );
    }

    let body: React.ReactNode = null;
    if (config.type === "continuous") {
      const mean = finiteMean(values);
      body = (
        <p className="text-body-sm text-muted-foreground">
          Mean {mean === null ? "—" : fmt(mean)} · {values.length} annotation
          {values.length === 1 ? "" : "s"}
        </p>
      );
    } else if (config.type === "categorical") {
      const rows = countByOption(config.options, values);
      body = (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="text-body-sm text-foreground">{row.label}</span>
              <Badge size="sm">{row.count}</Badge>
            </li>
          ))}
        </ul>
      );
    } else {
      const nonEmpty = values.filter((v) => String(v).trim() !== "").length;
      body = (
        <p className="text-body-sm text-muted-foreground">
          {nonEmpty} annotation{nonEmpty === 1 ? "" : "s"}
        </p>
      );
    }

    return (
      <details
        ref={ref}
        data-slot="annotation-summary-group"
        data-type={config.type}
        open={defaultOpen}
        className={cn(
          "rounded-xl border border-border bg-card text-card-foreground shadow-md",
          className,
        )}
      >
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-xl p-4 font-medium text-body-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <span>{heading}</span>
          <Badge size="sm" variant="outline">
            {values.length}
          </Badge>
        </summary>
        <div className="p-4 pt-0">{body}</div>
      </details>
    );
  },
);
AnnotationSummaryGroup.displayName = "AnnotationSummaryGroup";

export { AnnotationSummaryGroup };
