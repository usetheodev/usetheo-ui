import type { Story } from "@ladle/react";
import type { PromptVersionDiffProps } from "./prompt-version-diff.js";
import { PromptVersionDiff } from "./prompt-version-diff.js";

export default {
  title: "Composites / Data Display / PromptVersionDiff",
};

const story = (props: PromptVersionDiffProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-3xl rounded-md border p-3">
      <PromptVersionDiff oldLabel="v1" newLabel="v2" {...props} />
    </div>
  );
  return Rendered;
};

/** String template + config — the common prompt-versioning case (content + config diff). */
export const StringTemplate = story({
  oldPrompt: {
    template: "You are a helpful assistant.\nAnswer concisely.",
    config: { model: "gpt-4o", temperature: 0.5 },
  },
  newPrompt: {
    template: "You are a helpful, friendly assistant.\nAnswer concisely and cite sources.",
    config: { model: "gpt-4o", temperature: 0.8 },
  },
});

/** Chat-array template normalized to `role: content` text; no config → single diff. */
export const ChatTemplate = story({
  oldPrompt: {
    template: [
      { role: "system", content: "Be concise." },
      { role: "user", content: "Summarize the doc." },
    ],
  },
  newPrompt: {
    template: [
      { role: "system", content: "Be concise and neutral." },
      { role: "user", content: "Summarize the document briefly." },
    ],
  },
});
