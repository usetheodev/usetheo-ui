import type { Story } from "@ladle/react";
import type { DatasetItemDiffProps } from "./dataset-item-diff.js";
import { DatasetItemDiff } from "./dataset-item-diff.js";

export default {
  title: "Composites / Data Display / DatasetItemDiff",
};

const story = (props: DatasetItemDiffProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-3xl rounded-md border p-3">
      <DatasetItemDiff oldLabel="before" newLabel="after" {...props} />
    </div>
  );
  return Rendered;
};

/** Full item — input / expected output / metadata all present (three sections). */
export const AllFields = story({
  oldItem: {
    input: { question: "Capital of France?" },
    expectedOutput: "Paris",
    metadata: { source: "seed", difficulty: "easy" },
  },
  newItem: {
    input: { question: "What is the capital of France?" },
    expectedOutput: "Paris, France",
    metadata: { source: "reviewed", difficulty: "easy" },
  },
});

/** Only input + output present → the metadata section is omitted honestly. */
export const NoMetadata = story({
  oldItem: { input: "2 + 2", expectedOutput: "4" },
  newItem: { input: "2 + 3", expectedOutput: "5" },
});
