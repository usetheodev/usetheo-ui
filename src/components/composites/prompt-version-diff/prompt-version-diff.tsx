import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { DiffSection, type DiffSectionCommon } from "../diff-view/diff-section.js";
import { type PromptSnapshot, configToText, templateToText } from "./to-diff-text.js";

/**
 * PromptVersionDiff — diffs two prompt versions (M14 ADR D3). Normalizes each
 * snapshot's template (string passthrough; chat array → `role: content` text)
 * and config (pretty JSON) to plain text, then composes `DiffView` for content
 * and, when present, config. Zero new dependency — reuses the DS diff primitive.
 *
 * The config diff is omitted honestly when both versions have no config, rather
 * than rendering an empty "No changes" table nobody asked for.
 *
 *   <PromptVersionDiff oldPrompt={v1} newPrompt={v2} />
 */

export type PromptVersionDiffProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  DiffSectionCommon & {
    oldPrompt: PromptSnapshot;
    newPrompt: PromptSnapshot;
  };

function PromptVersionDiff(props: PromptVersionDiffProps) {
  const { oldPrompt, newPrompt, mode, oldLabel, newLabel, className, ...rest } = props;
  const shared = { mode, oldLabel, newLabel };

  const oldConfig = configToText(oldPrompt.config);
  const newConfig = configToText(newPrompt.config);
  const hasConfig = oldConfig !== "" || newConfig !== "";

  return (
    <div data-slot="prompt-version-diff" className={cn("space-y-4", className)} {...rest}>
      <DiffSection
        title="Content"
        oldText={templateToText(oldPrompt.template)}
        newText={templateToText(newPrompt.template)}
        {...shared}
      />
      {hasConfig && (
        <DiffSection title="Config" oldText={oldConfig} newText={newConfig} {...shared} />
      )}
    </div>
  );
}

export { PromptVersionDiff };
