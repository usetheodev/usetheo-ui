import type { Story } from "@ladle/react";
import { useState } from "react";
import { MessageBranchSelector } from "./message-branch-selector.js";

export default { title: "Composites / Chat / MessageBranchSelector" };

/** Controlled navigator across 5 regenerated branches. */
export const Interactive: Story = () => {
  const count = 5;
  const [index, setIndex] = useState(1);
  return (
    <div className="space-y-2">
      <MessageBranchSelector
        index={index}
        count={count}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(count - 1, i + 1))}
      />
      <p className="text-body-sm text-muted-foreground">Showing branch {index + 1}.</p>
    </div>
  );
};

/** Boundaries: first branch (prev disabled) and last branch (next disabled). */
export const Boundaries: Story = () => (
  <div className="flex flex-col gap-3">
    <MessageBranchSelector index={0} count={3} onPrev={() => {}} onNext={() => {}} />
    <MessageBranchSelector index={2} count={3} onPrev={() => {}} onNext={() => {}} />
  </div>
);
