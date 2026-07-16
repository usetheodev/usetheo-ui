import { Fragment, forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { type DiffRow, diffLines } from "../../../lib/diff/diff-lines.js";

/**
 * DiffView — a controlled, line-level text diff rendered as a semantic table
 * (M14 ADR D2). Runs the pure `diffLines` LCS over `oldText`/`newText`; zero
 * new dependency (registry stays copy-pasteable — M14 ADR D1).
 *
 * `mode="split"` (default) shows two columns — old on the left, new on the
 * right, aligning `del` rows on the left and `add` rows on the right; `eq` on
 * both. `mode="unified"` shows a single inline column with `+`/`-` prefixes.
 *
 * A11y is not color-alone: every changed row carries a TEXTUAL marker
 * (`+`/`-`/` `) plus `data-diff`, and the whole thing is a `<table>` with an
 * sr-only `<caption>` so screen readers announce a data table. Identical input
 * reads as an honest "No changes" state, never an empty table.
 *
 *   <DiffView oldText={v1} newText={v2} oldLabel="v1" newLabel="v2" />
 */

export type DiffViewMode = "split" | "unified";

export type DiffViewProps = Omit<HTMLAttributes<HTMLTableElement>, "children"> & {
  oldText: string;
  newText: string;
  /** Layout: two-column split (default) or inline unified. */
  mode?: DiffViewMode;
  /** Column header for the old text (split) / caption context. */
  oldLabel?: string;
  /** Column header for the new text (split) / caption context. */
  newLabel?: string;
};

/** Textual (not color-only) marker per row kind — a11y requirement. */
const MARKER: Record<DiffRow["kind"], string> = { add: "+", del: "-", eq: " " };

/** Tailwind classes per row kind, using the DS success/destructive tokens. */
const ROW_CLASS: Record<DiffRow["kind"], string> = {
  add: "bg-success/10 text-success",
  del: "bg-destructive/10 text-destructive",
  eq: "text-muted-foreground",
};

const NO_COL = "select-none pr-2 text-right align-top text-muted-foreground/60 tabular-nums";
const MARKER_COL = "select-none pr-1 text-center align-top";
const TEXT_COL = "align-top whitespace-pre-wrap break-words";
const HEAD_ROW = "text-left text-label-caps text-muted-foreground uppercase";

/** A line-number `<th scope=col>` (always "#") for a numbered column. */
const NumHead = () => (
  <th className="pr-2" scope="col">
    #
  </th>
);

/** A labeled content column header — carries the diff-view-side slot. */
const SideHead = ({ children }: { children: ReactNode }) => (
  <th data-slot="diff-view-side" scope="col">
    {children}
  </th>
);

/** One numbered content cell prefixed by its marker; null text = blank side. */
function DiffCell({ no, marker, text }: { no?: number; marker: string; text: string | null }) {
  const empty = text === null;
  return (
    <>
      <td className={NO_COL}>{no ?? ""}</td>
      <td className={cn(TEXT_COL, empty && "bg-muted/30")}>
        {!empty && (
          <>
            <span className={MARKER_COL} aria-hidden="true">
              {marker}
            </span>
            {text}
          </>
        )}
      </td>
    </>
  );
}

interface BodyProps {
  diff: DiffRow[];
  oldLabel?: string;
  newLabel?: string;
}

/**
 * A column spec: its header label + how to derive the (number, marker, text)
 * for a given row. `text === null` means the row has no content on this side
 * (a `del` on the right, an `add` on the left in split mode).
 */
interface DiffColumn {
  header: string;
  cell: (row: DiffRow) => { no?: number; marker: string; text: string | null };
}

/** The ordered content columns for a layout mode. Split = 2 sides, unified = 1. */
function columnsFor(mode: DiffViewMode, oldLabel?: string, newLabel?: string): DiffColumn[] {
  if (mode === "unified") {
    const header =
      oldLabel && newLabel ? `${oldLabel} → ${newLabel}` : (oldLabel ?? newLabel ?? "Changes");
    return [
      {
        header,
        // Unified keeps both line numbers; the number cells are rendered
        // separately, so here we only carry the new-side number for the row.
        cell: (row) => ({
          no: row.rightNo ?? row.leftNo,
          marker: MARKER[row.kind],
          text: row.text,
        }),
      },
    ];
  }
  // split — eq → both sides; del → left only; add → right only.
  return [
    {
      header: oldLabel ?? "Old",
      cell: (row) => ({
        no: row.leftNo,
        marker: row.kind === "del" ? "-" : " ",
        text: row.kind === "add" ? null : row.text,
      }),
    },
    {
      header: newLabel ?? "New",
      cell: (row) => ({
        no: row.rightNo,
        marker: row.kind === "add" ? "+" : " ",
        text: row.kind === "del" ? null : row.text,
      }),
    },
  ];
}

function DiffBody({ diff, mode, oldLabel, newLabel }: BodyProps & { mode: DiffViewMode }) {
  const columns = columnsFor(mode, oldLabel, newLabel);
  return (
    <>
      <thead>
        <tr className={HEAD_ROW}>
          {columns.map((col) => (
            <Fragment key={col.header}>
              <NumHead />
              <SideHead>{col.header}</SideHead>
            </Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {diff.map((row, i) => (
          <tr
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and stable within a render
            key={i}
            data-diff={row.kind}
            className={ROW_CLASS[row.kind]}
          >
            {columns.map((col) => (
              <DiffCell key={col.header} {...col.cell(row)} />
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );
}

const DiffView = forwardRef<HTMLTableElement, DiffViewProps>((props, ref) => {
  const { oldText, newText, mode = "split", oldLabel, newLabel, className, ...rest } = props;
  const diff = diffLines(oldText, newText);
  const hasChanges = diff.some((r) => r.kind !== "eq");
  const caption = `Diff${oldLabel ? ` of ${oldLabel}` : ""}${newLabel ? ` vs ${newLabel}` : ""}`;

  let body: ReactNode;
  if (!hasChanges) {
    body = (
      <tbody>
        <tr>
          <td data-slot="diff-view-empty" className="p-3 text-muted-foreground italic">
            No changes.
          </td>
        </tr>
      </tbody>
    );
  } else {
    body = <DiffBody diff={diff} mode={mode} oldLabel={oldLabel} newLabel={newLabel} />;
  }

  return (
    <table
      data-slot="diff-view"
      data-mode={mode}
      ref={ref}
      className={cn("w-full border-collapse font-mono text-xs", className)}
      {...rest}
    >
      <caption className="sr-only">{hasChanges ? caption : `${caption} — no changes`}</caption>
      {body}
    </table>
  );
});
DiffView.displayName = "DiffView";

export { DiffView };
