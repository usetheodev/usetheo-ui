import type { Story } from "@ladle/react";
import { useState } from "react";
import { EvaluatorForm } from "./evaluator-form.js";
import type { EvaluatorConfig } from "./types.js";

export default {
  title: "Composites / Forms / EvaluatorForm",
};

/**
 * The controlled builder: the `<select>` swaps the evaluator's type (emitting a fresh config
 * with defaults) and the fields below edit the current type's config.
 * The form only EDITS — running the evaluator is the platform's job.
 */
export const Playground: Story = () => {
  const [config, setConfig] = useState<EvaluatorConfig>({ type: "exact_match", target: "42" });
  return (
    <div className="max-w-sm space-y-4">
      <EvaluatorForm value={config} onChange={setConfig} />
      <pre className="rounded bg-muted p-2 text-body-sm">{JSON.stringify(config, null, 2)}</pre>
    </div>
  );
};

export const Disabled: Story = () => (
  <div className="max-w-sm">
    <EvaluatorForm
      value={{ type: "regex", pattern: "^ok$", flags: "i" }}
      onChange={() => {}}
      disabled
    />
  </div>
);
