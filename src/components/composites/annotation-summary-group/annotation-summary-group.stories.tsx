import type { Story } from "@ladle/react";
import type {
  AnnotationCategoricalConfig,
  AnnotationContinuousConfig,
  AnnotationFreeformConfig,
} from "../annotation-input/types.js";
import { AnnotationSummaryGroup } from "./annotation-summary-group.js";

export default {
  title: "Composites / Forms / AnnotationSummaryGroup",
};

const quality: AnnotationCategoricalConfig = {
  type: "categorical",
  options: [{ label: "excellent" }, { label: "good" }, { label: "poor" }],
};
const rating: AnnotationContinuousConfig = { type: "continuous", min: 0, max: 1, step: 0.05 };
const note: AnnotationFreeformConfig = { type: "freeform", maxLength: 500 };

/**
 * Stats agregadas por config: média p/ continuous, contagem por opção p/
 * categorical, contagem de não-vazios p/ freeform. Grupos colapsáveis.
 */
export const Playground: Story = () => (
  <div className="max-w-sm space-y-3">
    <AnnotationSummaryGroup
      config={quality}
      values={["excellent", "good", "good", "poor"]}
      label="Quality"
      defaultOpen
    />
    <AnnotationSummaryGroup
      config={rating}
      values={[0.2, 0.8, 0.5, 1]}
      label="Rating"
      defaultOpen
    />
    <AnnotationSummaryGroup config={note} values={["off", "", "clear"]} label="Notes" />
    <AnnotationSummaryGroup config={rating} values={[]} label="Latency (empty)" />
  </div>
);
