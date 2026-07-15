import { Check, CircleDashed, Loader2, X } from "lucide-react";
import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Stepper — multi-step pipeline progress, promoted from the theo-cloud
 * dashboard build-timeline (production). Read-only by design: steps are NOT
 * clickable (pipeline visualization, not a wizard). 100% controlled — live
 * updates (SSE/polling) belong to the consumer.
 *
 * Contract: step `id`s MUST be unique (React keys); at most ONE step should
 * be `active` (`aria-current="step"` is emitted per active step as-is).
 * A `label` is required — it names the pipeline for screen readers.
 *
 *   <Stepper label="Build pipeline" steps={[
 *     { id: "queued", label: "Queued", status: "done" },
 *     { id: "build", label: "Building", status: "active" },
 *   ]} />
 *
 * For the simple "wizard position" case, derive the array from an index:
 *   <Stepper label="Onboarding" steps={deriveSteps(defs, activeIndex)} />
 */

export type StepStatus = "pending" | "active" | "done" | "failed";

export interface StepperStepData {
  /** Unique key for the step (consumer contract: no duplicates). */
  id: string;
  label: string;
  /** For failed steps, pass the failure cause here — it is read by screen readers inside the same item (F-dom-3). */
  description?: string;
  status: StepStatus;
  /** Optional slot — prefer `<Timestamp value={...} />` from this library. */
  timestamp?: ReactNode;
  /** Optional slot rendered ONLY when status === "failed" (the action belongs to the consumer). */
  retry?: ReactNode;
}

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  /** Accessible name for the pipeline (aria-label of the list). */
  label: string;
  steps: StepperStepData[];
  /** @default "vertical" — both production cases (build/ingest) are vertical. */
  orientation?: "vertical" | "horizontal";
}

/**
 * Pure helper for the simple index-driven case: steps before `activeIndex`
 * are done, the step at it is active, later ones are pending. Out-of-range
 * indexes are safe: past the end → all done; negative → all pending.
 */
export function deriveSteps(
  defs: Array<Pick<StepperStepData, "id" | "label" | "description">>,
  activeIndex: number,
): StepperStepData[] {
  return defs.map((def, i) => ({
    ...def,
    status: i < activeIndex ? "done" : i === activeIndex ? "active" : "pending",
  }));
}

const ICON: Record<StepStatus, typeof Check> = {
  done: Check,
  active: Loader2,
  failed: X,
  pending: CircleDashed,
};

const ICON_TONE: Record<StepStatus, string> = {
  done: "text-success",
  active: "animate-spin text-primary",
  failed: "text-destructive",
  pending: "text-muted-foreground",
};

const LABEL_TONE: Record<StepStatus, string> = {
  done: "font-medium text-foreground",
  active: "font-semibold text-primary",
  failed: "font-semibold text-destructive",
  pending: "font-medium text-muted-foreground",
};

// F-dom-1: every non-active state is spoken, not just colored; the active
// step is announced by aria-current="step" instead of a text suffix.
const SR_STATE_TEXT: Record<StepStatus, string | null> = {
  done: " — completed",
  active: null,
  failed: " — failed",
  pending: " — not started",
};

const Stepper = forwardRef<HTMLOListElement, StepperProps>(
  ({ label, steps, orientation = "vertical", className, ...props }, ref) => (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      ref={ref}
      aria-label={label}
      className={cn(
        orientation === "horizontal" ? "flex flex-wrap gap-x-6 gap-y-3" : "space-y-3",
        className,
      )}
      {...props}
    >
      {steps.map((s) => {
        // EC-1: unknown status at runtime (untyped consumer) degrades to the
        // pending visual. Object.hasOwn — the `in` operator would accept
        // prototype-chain keys like "toString" (F-arch-1). The sanitized
        // status drives EVERYTHING (data-state included), so CSS hooks and
        // visuals never diverge (F-arch-2).
        const status: StepStatus = Object.hasOwn(ICON, s.status) ? s.status : "pending";
        const Icon = ICON[status];
        return (
          <li
            key={s.id}
            data-slot="stepper-step"
            data-state={status}
            aria-current={status === "active" ? "step" : undefined}
            className="flex items-start gap-3"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border"
              data-slot="stepper-icon"
            >
              <Icon className={cn("size-3", ICON_TONE[status])} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                data-slot="stepper-label"
                title={s.label}
                className={cn("truncate text-body-sm", LABEL_TONE[status])}
              >
                {s.label}
                {SR_STATE_TEXT[status] && <span className="sr-only">{SR_STATE_TEXT[status]}</span>}
              </p>
              {s.description && <p className="text-label text-muted-foreground">{s.description}</p>}
              {s.timestamp && (
                <p data-slot="stepper-timestamp" className="text-label text-muted-foreground">
                  {s.timestamp}
                </p>
              )}
              {status === "failed" && s.retry && (
                <div data-slot="stepper-retry" className="mt-1">
                  {s.retry}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  ),
);
Stepper.displayName = "Stepper";

export { Stepper };
