import { createElement, forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * DescriptionList — semantic key/value pairs on native `dl/dt/dd`.
 *
 * Layouts: `vertical` (default — stacked groups) and `horizontal` (two-column
 * grid: terms in a fixed max-content column, details beside them; the Item
 * wrapper uses `display: contents` so dt/dd participate in the root grid).
 * `dense` tightens the gaps for crowded detail panels.
 *
 *   <DescriptionList layout="horizontal">
 *     <DescriptionList.Item>
 *       <DescriptionList.Term>Status</DescriptionList.Term>
 *       <DescriptionList.Detail><Badge>live</Badge></DescriptionList.Detail>
 *     </DescriptionList.Item>
 *   </DescriptionList>
 *
 * One Term per Item; multiple Details per Term are valid HTML and supported.
 * Composing dd without a preceding dt is the consumer's responsibility
 * (invalid HTML — same contract as Breadcrumb.Page placement).
 */

interface DescriptionListProps extends HTMLAttributes<HTMLDListElement> {
  /** vertical (default): stacked groups. horizontal: term column + detail column. */
  layout?: "vertical" | "horizontal";
  /** Compact spacing for dense detail panels. */
  dense?: boolean;
}

/** Presentational sub factory (same idiom as Breadcrumb's `sub()` — M0). */
function sub<E extends HTMLElement>(
  tag: string,
  slot: string,
  displayName: string,
  baseClass: string,
) {
  const Component = forwardRef<E, HTMLAttributes<E>>(({ className, children, ...props }, ref) =>
    createElement(
      tag,
      { "data-slot": slot, ref, className: cn(baseClass, className), ...props },
      children,
    ),
  );
  Component.displayName = displayName;
  return Component;
}

const Root = forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ className, layout = "vertical", dense, ...props }, ref) => (
    <dl
      data-slot="description-list"
      data-layout={layout}
      data-dense={dense ? "true" : undefined}
      ref={ref}
      className={cn(
        "text-body-sm",
        layout === "vertical" && (dense ? "grid gap-2" : "grid gap-4"),
        layout === "horizontal" &&
          "grid grid-cols-[max-content_1fr] items-baseline [&>div]:contents",
        layout === "horizontal" && (dense ? "gap-x-4 gap-y-1.5" : "gap-x-6 gap-y-3"),
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = "DescriptionList";

const Item = sub<HTMLDivElement>(
  "div",
  "description-list-item",
  "DescriptionList.Item",
  "grid gap-1",
);

const Term = sub<HTMLElement>(
  "dt",
  "description-list-term",
  "DescriptionList.Term",
  "font-medium text-muted-foreground",
);

const Detail = sub<HTMLElement>(
  "dd",
  "description-list-detail",
  "DescriptionList.Detail",
  "m-0 text-foreground",
);

const DescriptionList = Object.assign(Root, { Item, Term, Detail });

export { DescriptionList };
export type { DescriptionListProps };
