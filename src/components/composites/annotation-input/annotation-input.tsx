import { useId } from "react";
import { cn } from "../../../lib/cn.js";
import { Input } from "../../primitives/input/input.js";
import { Label } from "../../primitives/label/label.js";
import { RadioGroup } from "../../primitives/radio-group/radio-group.js";
import { Textarea } from "../../primitives/textarea/textarea.js";
import type {
  AnnotationCategoricalConfig,
  AnnotationContinuousConfig,
  AnnotationFreeformConfig,
} from "./types.js";

/**
 * AnnotationInput — a controlled, config-driven human annotation input (M12).
 * Dispatches on `config.type` (Phoenix's three-type model): categorical →
 * RadioGroup over named options; continuous → number input bounded by the
 * config; freeform → textarea. Fully controlled (`value` + `onValueChange`);
 * the consumer owns the config (fixture or backend store) and the submission.
 * Composes the DS form primitives — zero new dependency (M12 ADR D2).
 *
 *   <AnnotationInput name="Quality" config={qualityConfig}
 *                    value={v} onValueChange={setV} />
 */

interface AnnotationInputCommon {
  /** The score name — rendered as the field label / radiogroup accessible name. */
  name: string;
  /** Overrides the generated control id (for external label association). */
  id?: string;
  /** Optional helper text, wired via aria-describedby. */
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export type AnnotationInputProps =
  | (AnnotationInputCommon & {
      config: AnnotationCategoricalConfig;
      value: string | null;
      onValueChange: (value: string | null) => void;
    })
  | (AnnotationInputCommon & {
      config: AnnotationContinuousConfig;
      value: number | null;
      onValueChange: (value: number | null) => void;
    })
  | (AnnotationInputCommon & {
      config: AnnotationFreeformConfig;
      value: string | null;
      onValueChange: (value: string | null) => void;
    });

function AnnotationInput(props: AnnotationInputProps) {
  const { name, description, required, disabled, className } = props;
  const generatedId = useId();
  const controlId = props.id ?? generatedId;
  const descId = description ? `${controlId}-desc` : undefined;
  const isCategorical = props.config.type === "categorical";
  // Categorical is a radiogroup, not a single control — the visible label names
  // the group via aria-labelledby (no htmlFor, no duplicated aria-label).
  const labelId = isCategorical ? `${controlId}-label` : undefined;

  const label = (
    <Label id={labelId} htmlFor={isCategorical ? undefined : controlId} required={required}>
      {name}
    </Label>
  );

  // Shared a11y/state attrs spread onto whichever control this config renders.
  const a11y = {
    "aria-required": required || undefined,
    "aria-describedby": descId,
    disabled,
  } as const;

  let control: React.ReactNode = null;
  if (props.config.type === "categorical") {
    // TS cannot correlate `value`/`onValueChange` to the nested `config.type`
    // discriminant (TS#30581 correlated-union limit); Extract after the checked
    // guard is the idiomatic, sound narrowing.
    const { config, value, onValueChange } = props as Extract<
      AnnotationInputProps,
      { config: AnnotationCategoricalConfig }
    >;
    control = (
      <RadioGroup
        value={value ?? ""}
        onValueChange={(v) => onValueChange(v === "" ? null : v)}
        aria-labelledby={labelId}
        className="gap-1.5"
        {...a11y}
      >
        {config.options.map((opt) => {
          const optId = `${controlId}-${opt.label}`;
          return (
            <div key={opt.label} className="flex items-center gap-2">
              <RadioGroup.Item value={opt.label} id={optId} disabled={disabled} />
              <Label htmlFor={optId} className="font-normal">
                {opt.label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  } else if (props.config.type === "continuous") {
    const { config, value, onValueChange } = props as Extract<
      AnnotationInputProps,
      { config: AnnotationContinuousConfig }
    >;
    const onNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === "") return onValueChange(null);
      const n = Number(raw);
      onValueChange(Number.isFinite(n) ? n : null);
    };
    control = (
      <Input
        {...a11y}
        id={controlId}
        type="number"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value ?? ""}
        onChange={onNumber}
      />
    );
  } else if (props.config.type === "freeform") {
    const { config, value, onValueChange } = props as Extract<
      AnnotationInputProps,
      { config: AnnotationFreeformConfig }
    >;
    const onText = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onValueChange(e.target.value === "" ? null : e.target.value);
    control = (
      <Textarea
        {...a11y}
        id={controlId}
        maxLength={config.maxLength}
        value={value ?? ""}
        onChange={onText}
      />
    );
  }

  return (
    <div
      data-slot="annotation-input"
      data-type={props.config.type}
      className={cn("space-y-1.5", className)}
    >
      {label}
      {description ? (
        <p id={descId} className="text-body-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {control}
    </div>
  );
}

export { AnnotationInput };
