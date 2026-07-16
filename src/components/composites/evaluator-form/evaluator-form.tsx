import { forwardRef, useId } from "react";
import { cn } from "../../../lib/cn.js";
import { Input } from "../../primitives/input/input.js";
import { Label } from "../../primitives/label/label.js";
import { type EvaluatorConfig, type EvaluatorType, defaultEvaluatorConfig } from "./types.js";

/**
 * EvaluatorForm — a controlled, config-driven builder for a built-in evaluator
 * (M18). Dispatches on `value.type` (Phoenix's code-evaluator model): a
 * `<select>` switches the evaluator type; the fields below it edit the config
 * for the current type — exact_match/contains → a target string; regex →
 * pattern + optional flags; levenshtein/json_distance → a numeric threshold.
 * Switching type emits a FRESH config of that type with sensible defaults.
 *
 * Fully controlled (`value` + `onChange`); the consumer owns the config and its
 * persistence. The form only EDITS — execution/sandboxing of the evaluator is a
 * platform concern (ADR D3). Composes DS primitives; zero new dependency.
 *
 *   <EvaluatorForm value={cfg} onChange={setCfg} />
 */

export interface EvaluatorFormProps {
  /** The evaluator config being edited (discriminated by `type`). */
  value: EvaluatorConfig;
  /** Emitted with the new config on any edit — always fully typed. */
  onChange: (value: EvaluatorConfig) => void;
  disabled?: boolean;
  className?: string;
}

/** The type options rendered in the switch, in a stable, human-ordered list. */
const EVALUATOR_TYPES: { value: EvaluatorType; label: string }[] = [
  { value: "exact_match", label: "Exact match" },
  { value: "contains", label: "Contains" },
  { value: "regex", label: "Regex" },
  { value: "levenshtein", label: "Levenshtein" },
  { value: "json_distance", label: "JSON distance" },
];

const EvaluatorForm = forwardRef<HTMLDivElement, EvaluatorFormProps>(
  ({ value, onChange, disabled, className }, ref) => {
    const baseId = useId();
    const typeId = `${baseId}-type`;
    const fieldId = `${baseId}-field`;

    // Number fields emit the parsed value, never NaN (empty → 0), mirroring the
    // controlled-number discipline in AnnotationInput.
    const onThreshold = (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      const threshold = Number.isFinite(n) ? n : 0;
      // TS#30581: the writer cannot correlate the number field to the nested
      // `value.type` discriminant — Extract after the checked guard is sound.
      const cfg = value as Extract<EvaluatorConfig, { type: "levenshtein" | "json_distance" }>;
      onChange({ ...cfg, threshold });
    };

    let fields: React.ReactNode = null;
    if (value.type === "exact_match" || value.type === "contains") {
      const cfg = value as Extract<EvaluatorConfig, { type: "exact_match" | "contains" }>;
      fields = (
        <div className="space-y-1.5">
          <Label htmlFor={fieldId}>Target</Label>
          <Input
            id={fieldId}
            value={cfg.target}
            disabled={disabled}
            onChange={(e) => onChange({ ...cfg, target: e.target.value })}
          />
        </div>
      );
    } else if (value.type === "regex") {
      const cfg = value as Extract<EvaluatorConfig, { type: "regex" }>;
      const flagsId = `${baseId}-flags`;
      fields = (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={fieldId}>Pattern</Label>
            <Input
              id={fieldId}
              value={cfg.pattern}
              disabled={disabled}
              onChange={(e) => onChange({ ...cfg, pattern: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={flagsId}>Flags</Label>
            <Input
              id={flagsId}
              value={cfg.flags ?? ""}
              disabled={disabled}
              onChange={(e) => onChange({ ...cfg, flags: e.target.value })}
            />
          </div>
        </div>
      );
    } else {
      const cfg = value as Extract<EvaluatorConfig, { type: "levenshtein" | "json_distance" }>;
      fields = (
        <div className="space-y-1.5">
          <Label htmlFor={fieldId}>Threshold</Label>
          <Input
            id={fieldId}
            type="number"
            value={cfg.threshold}
            disabled={disabled}
            onChange={onThreshold}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        data-slot="evaluator-form"
        data-eval-type={value.type}
        className={cn("space-y-3", className)}
      >
        <div className="space-y-1.5">
          <Label htmlFor={typeId}>Evaluator type</Label>
          <select
            id={typeId}
            data-slot="evaluator-form-type"
            value={value.type}
            disabled={disabled}
            onChange={(e) => onChange(defaultEvaluatorConfig(e.target.value as EvaluatorType))}
            className={cn(
              "flex h-[var(--theo-control-h,2rem)] w-full rounded-lg border border-input bg-card px-[var(--theo-control-px,0.75rem)] py-1.5 text-body-sm text-foreground",
              "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {EVALUATOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {fields}
      </div>
    );
  },
);
EvaluatorForm.displayName = "EvaluatorForm";

export { EvaluatorForm };
