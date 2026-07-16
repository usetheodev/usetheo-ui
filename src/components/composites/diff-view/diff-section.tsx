import { DiffView, type DiffViewMode } from "./diff-view.js";

/**
 * DiffSection — a labeled `DiffView` (a heading + the diff table). Shared by the
 * domain composites (PromptVersionDiff, DatasetItemDiff) so each labeled diff is
 * a single call instead of a repeated heading+DiffView block (DRY).
 */

/** The DiffView pass-through props the composites forward to every section. */
export interface DiffSectionCommon {
  /** Layout mode, forwarded to DiffView. */
  mode?: DiffViewMode;
  oldLabel?: string;
  newLabel?: string;
}

export type DiffSectionProps = DiffSectionCommon & {
  title: string;
  oldText: string;
  newText: string;
};

export function DiffSection({ title, oldText, newText, ...rest }: DiffSectionProps) {
  return (
    <section className="space-y-1">
      <h4 className="font-semibold text-label-caps text-muted-foreground uppercase">{title}</h4>
      <DiffView oldText={oldText} newText={newText} {...rest} />
    </section>
  );
}
