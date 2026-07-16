import type { Story } from "@ladle/react";
import { useState } from "react";
import { EvaluatorForm } from "./evaluator-form.js";
import type { EvaluatorConfig } from "./types.js";

export default {
  title: "Composites / Forms / EvaluatorForm",
};

/**
 * O builder controlado: o `<select>` troca o tipo do evaluator (emitindo um
 * config fresco com defaults) e os campos abaixo editam o config do tipo atual.
 * O form só EDITA — execução do evaluator é plataforma.
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
