/**
 * Annotation config types — the named-score-type contract for AnnotationInput
 * (M12). Follows Phoenix's three-type model (categorical / continuous /
 * freeform); Langfuse's BOOLEAN is categorical-of-two and CORRECTION is
 * system-only, so neither adds to a controlled human input. The config is a
 * plain descriptor the consumer owns (fixture or backend store) — the DS
 * component is config-driven and stateless.
 */

/** One named categorical choice; `score` optionally maps the label to a numeric value on submit. */
export interface CategoricalOption {
  label: string;
  score?: number | null;
}

export interface AnnotationCategoricalConfig {
  type: "categorical";
  options: CategoricalOption[];
}

export interface AnnotationContinuousConfig {
  type: "continuous";
  min: number;
  max: number;
  step?: number;
}

export interface AnnotationFreeformConfig {
  type: "freeform";
  maxLength?: number;
}

export type AnnotationConfig =
  | AnnotationCategoricalConfig
  | AnnotationContinuousConfig
  | AnnotationFreeformConfig;

export function isCategoricalConfig(c: AnnotationConfig): c is AnnotationCategoricalConfig {
  return c.type === "categorical";
}

export function isContinuousConfig(c: AnnotationConfig): c is AnnotationContinuousConfig {
  return c.type === "continuous";
}

export function isFreeformConfig(c: AnnotationConfig): c is AnnotationFreeformConfig {
  return c.type === "freeform";
}
