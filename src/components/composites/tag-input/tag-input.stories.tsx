import type { Story } from "@ladle/react";
import { useState } from "react";
import { TagInput } from "./tag-input.js";

export default {
  title: "Composites / Collaboration / TagInput",
};

const SUGGESTIONS = ["bug", "feature", "docs", "chore", "regression", "p0"];

/**
 * Controlado (value + onChange), com chips removíveis, dedup, sugestões via
 * datalist e um estado disabled — como um editor de tags de trace/dataset vai
 * compor sobre uma lista de strings livre.
 */
export const Playground: Story = () => {
  const [tags, setTags] = useState<string[]>(["bug", "regression"]);
  const [locked, setLocked] = useState<string[]>(["read-only"]);
  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-body-sm text-muted-foreground">
          Enter para adicionar; × para remover. Duplicadas são ignoradas.
        </p>
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={SUGGESTIONS}
          placeholder="Add a tag…"
        />
        <pre className="rounded bg-muted p-2 text-body-sm">{JSON.stringify(tags)}</pre>
      </div>
      <div className="space-y-2">
        <p className="text-body-sm text-muted-foreground">Disabled:</p>
        <TagInput value={locked} onChange={setLocked} placeholder="Add a tag…" disabled />
      </div>
    </div>
  );
};
