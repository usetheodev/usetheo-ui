import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { DiffSection, type DiffSectionCommon } from "../diff-view/diff-section.js";
import { type DatasetItemSnapshot, fieldPresent, fieldToText } from "./to-diff-text.js";

/**
 * DatasetItemDiff — diffs two dataset-item versions (M14 ADR D3). Stringifies
 * each field (input / expectedOutput / metadata) and composes a labeled
 * `DiffView` per field. Zero new dependency — reuses the DS diff primitive.
 *
 * A field absent in BOTH items is omitted honestly (no empty "No changes"
 * table); a field present on either side is rendered so an add/remove shows.
 *
 *   <DatasetItemDiff oldItem={v1} newItem={v2} />
 */

export type DatasetItemDiffProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> &
  DiffSectionCommon & {
    oldItem: DatasetItemSnapshot;
    newItem: DatasetItemSnapshot;
  };

/** The three diffable fields, in reading order, with their section titles. */
const FIELDS: ReadonlyArray<{ key: keyof DatasetItemSnapshot; title: string }> = [
  { key: "input", title: "Input" },
  { key: "expectedOutput", title: "Expected output" },
  { key: "metadata", title: "Metadata" },
];

function DatasetItemDiff(props: DatasetItemDiffProps) {
  const { oldItem, newItem, mode, oldLabel, newLabel, className, ...rest } = props;
  const shared = { mode, oldLabel, newLabel };

  return (
    <div data-slot="dataset-item-diff" className={cn("space-y-4", className)} {...rest}>
      {FIELDS.filter((f) => fieldPresent(oldItem[f.key], newItem[f.key])).map((f) => (
        <DiffSection
          key={f.key}
          title={f.title}
          oldText={fieldToText(oldItem[f.key])}
          newText={fieldToText(newItem[f.key])}
          {...shared}
        />
      ))}
    </div>
  );
}

export { DatasetItemDiff };
