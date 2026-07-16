/**
 * Evaluator config types — the discriminated-union contract for EvaluatorForm
 * (M18). Follows Phoenix's built-in code-evaluator model: each evaluator has a
 * `type` discriminant plus the fields that type needs. The config is a plain
 * descriptor the consumer owns (fixture or backend store) — EvaluatorForm only
 * EDITS it; execution/sandboxing of the evaluator is a platform concern (ADR
 * D3). Same union + Extract narrowing pattern as AnnotationInput (M12), which
 * side-steps the TS#30581 correlated-union limitation.
 */

/** A string-target evaluator: the produced output is matched against `target`. */
export interface ExactMatchEvaluatorConfig {
  type: "exact_match";
  target: string;
}

export interface ContainsEvaluatorConfig {
  type: "contains";
  target: string;
}

/** A regex evaluator: `pattern` is the source, `flags` the optional RegExp flags. */
export interface RegexEvaluatorConfig {
  type: "regex";
  pattern: string;
  flags?: string;
}

/** A Levenshtein-distance evaluator: passes when distance ≤ `threshold`. */
export interface LevenshteinEvaluatorConfig {
  type: "levenshtein";
  threshold: number;
}

/** A JSON-structural-distance evaluator: passes when distance ≤ `threshold`. */
export interface JsonDistanceEvaluatorConfig {
  type: "json_distance";
  threshold: number;
}

export type EvaluatorType = EvaluatorConfig["type"];

export type EvaluatorConfig =
  | ExactMatchEvaluatorConfig
  | ContainsEvaluatorConfig
  | RegexEvaluatorConfig
  | LevenshteinEvaluatorConfig
  | JsonDistanceEvaluatorConfig;

export function isTargetEvaluator(
  c: EvaluatorConfig,
): c is ExactMatchEvaluatorConfig | ContainsEvaluatorConfig {
  return c.type === "exact_match" || c.type === "contains";
}

export function isRegexEvaluator(c: EvaluatorConfig): c is RegexEvaluatorConfig {
  return c.type === "regex";
}

export function isThresholdEvaluator(
  c: EvaluatorConfig,
): c is LevenshteinEvaluatorConfig | JsonDistanceEvaluatorConfig {
  return c.type === "levenshtein" || c.type === "json_distance";
}

/** A fresh config of `type` with sensible defaults — emitted on a type switch. */
export function defaultEvaluatorConfig(type: EvaluatorType): EvaluatorConfig {
  switch (type) {
    case "exact_match":
      return { type, target: "" };
    case "contains":
      return { type, target: "" };
    case "regex":
      return { type, pattern: "", flags: "" };
    case "levenshtein":
      return { type, threshold: 0 };
    case "json_distance":
      return { type, threshold: 0 };
  }
}
