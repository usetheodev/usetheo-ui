import type { Story } from "@ladle/react";
import type { DiffViewProps } from "./diff-view.js";
import { DiffView } from "./diff-view.js";

export default {
  title: "Composites / Data Display / DiffView",
};

const V1 = `You are a helpful assistant.
Answer concisely.
Cite sources when possible.`;

const V2 = `You are a helpful, friendly assistant.
Answer concisely and clearly.
Cite sources when possible.
Never invent facts.`;

const diffStory = (props: DiffViewProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-3xl rounded-md border p-3">
      <DiffView {...props} />
    </div>
  );
  return Rendered;
};

/** Split-view (default) — prompt v1 vs v2, side by side. */
export const Split = diffStory({ oldText: V1, newText: V2, oldLabel: "v1", newLabel: "v2" });

/** Unified inline view — the phoenix-style single-column layout. */
export const Unified = diffStory({
  oldText: V1,
  newText: V2,
  mode: "unified",
  oldLabel: "v1",
  newLabel: "v2",
});

/** Identical input → honest "No changes" state, not an empty table. */
export const NoChanges = diffStory({ oldText: V1, newText: V1, oldLabel: "v1", newLabel: "v1" });
