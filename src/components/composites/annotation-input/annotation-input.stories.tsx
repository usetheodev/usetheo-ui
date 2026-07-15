import type { Story } from "@ladle/react";
import { useState } from "react";
import { AnnotationInput } from "./annotation-input.js";
import type {
  AnnotationCategoricalConfig,
  AnnotationContinuousConfig,
  AnnotationFreeformConfig,
} from "./types.js";

export default {
  title: "Composites / Forms / AnnotationInput",
};

const qualityConfig: AnnotationCategoricalConfig = {
  type: "categorical",
  options: [
    { label: "excellent", score: 1 },
    { label: "good", score: 0.66 },
    { label: "poor", score: 0.33 },
    { label: "unusable", score: 0 },
  ],
};
const ratingConfig: AnnotationContinuousConfig = { type: "continuous", min: 0, max: 1, step: 0.05 };
const noteConfig: AnnotationFreeformConfig = { type: "freeform", maxLength: 500 };

/**
 * Os 3 tipos (categorical / continuous / freeform) controlados, como o
 * labeling-queue do lens vai compor sobre uma lista de score-configs.
 */
export const Playground: Story = () => {
  const [quality, setQuality] = useState<string | null>("good");
  const [rating, setRating] = useState<number | null>(0.5);
  const [note, setNote] = useState<string | null>(null);
  return (
    <div className="max-w-sm space-y-5">
      <AnnotationInput
        name="Quality"
        description="Como você avalia esta resposta?"
        config={qualityConfig}
        value={quality}
        onValueChange={setQuality}
        required
      />
      <AnnotationInput
        name="Rating"
        description="0 = ruim, 1 = perfeito"
        config={ratingConfig}
        value={rating}
        onValueChange={setRating}
      />
      <AnnotationInput name="Note" config={noteConfig} value={note} onValueChange={setNote} />
      <pre className="rounded bg-muted p-2 text-body-sm">
        {JSON.stringify({ quality, rating, note }, null, 2)}
      </pre>
    </div>
  );
};
