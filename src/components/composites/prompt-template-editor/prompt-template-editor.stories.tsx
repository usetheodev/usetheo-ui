import type { Story } from "@ladle/react";
import { useState } from "react";
import { PromptTemplateEditor } from "./prompt-template-editor.js";

export default { title: "Composites / Chat / PromptTemplateEditor" };

/** Controlled editor with variable hints — used (green) vs available (outline). */
export const Interactive: Story = () => {
  const [value, setValue] = useState("Hello {{name}}, welcome to {{place}}!");
  return (
    <div className="max-w-lg">
      <PromptTemplateEditor
        value={value}
        onChange={setValue}
        variables={["name", "place", "tone"]}
      />
    </div>
  );
};

/** An f-string variable used in the text but not declared is flagged. */
export const UndeclaredVariable: Story = () => (
  <div className="max-w-lg">
    <PromptTemplateEditor
      value="Reply in {tone}. Address {ghost}."
      onChange={() => {}}
      variables={["tone"]}
    />
  </div>
);
