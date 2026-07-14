import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { createElement, forwardRef } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { safeHref } from "../../../lib/safe-href.js";

/**
 * Breadcrumb — hierarchical navigation trail primitive.
 *
 * Composition (one `Page` per list, always the last item):
 *   <Breadcrumb>
 *     <Breadcrumb.List>
 *       <Breadcrumb.Item>
 *         <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
 *       </Breadcrumb.Item>
 *       <Breadcrumb.Separator />
 *       <Breadcrumb.Item>
 *         <Breadcrumb.Page>Current page</Breadcrumb.Page>
 *       </Breadcrumb.Item>
 *     </Breadcrumb.List>
 *   </Breadcrumb>
 *
 * Router links: `<Breadcrumb.Link asChild><Link to="/x">…</Link></Breadcrumb.Link>`.
 * Collapsed levels: `<Breadcrumb.Ellipsis />` (compose with <DropdownMenu> to navigate them).
 */

/**
 * Internal factory for the presentational sub-components: a semantic element
 * with a `data-slot`, fixed attributes, token classes, and an optional default
 * children fallback. Root and Link stay hand-written — they carry behavior
 * (aria-label contract; asChild + safeHref guard).
 */
function sub<E extends HTMLElement>(
  tag: string,
  slot: string,
  displayName: string,
  baseClass: string,
  attrs?: Record<string, string>,
  defaultChildren?: ReactNode,
) {
  const Component = forwardRef<E, HTMLAttributes<E>>(({ className, children, ...props }, ref) =>
    createElement(
      tag,
      {
        "data-slot": slot,
        ref,
        ...attrs,
        className: cn(baseClass, className),
        ...props,
      },
      children ?? defaultChildren,
    ),
  );
  Component.displayName = displayName;
  return Component;
}

const Root = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>((props, ref) => (
  <nav data-slot="breadcrumb" ref={ref} aria-label="breadcrumb" {...props} />
));
Root.displayName = "Breadcrumb";

const List = sub<HTMLOListElement>(
  "ol",
  "breadcrumb-list",
  "Breadcrumb.List",
  "flex flex-wrap items-center gap-1.5 break-words text-body-sm text-muted-foreground sm:gap-2.5",
);

const Item = sub<HTMLLIElement>(
  "li",
  "breadcrumb-item",
  "Breadcrumb.Item",
  "inline-flex items-center gap-1.5",
);

interface BreadcrumbLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Render the consumer's element (e.g. a router <Link>) instead of a native anchor. */
  asChild?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ asChild, className, href, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";
    return (
      <Comp
        data-slot="breadcrumb-link"
        ref={ref}
        className={cn("transition-colors hover:text-foreground", className)}
        {...(asChild ? {} : { href: safeHref(href) })}
        {...props}
      />
    );
  },
);
Link.displayName = "Breadcrumb.Link";

const Page = sub<HTMLSpanElement>(
  "span",
  "breadcrumb-page",
  "Breadcrumb.Page",
  "font-normal text-foreground",
  { role: "link", "aria-disabled": "true", "aria-current": "page" },
);

const Separator = sub<HTMLLIElement>(
  "li",
  "breadcrumb-separator",
  "Breadcrumb.Separator",
  "[&>svg]:size-3.5",
  { role: "presentation", "aria-hidden": "true" },
  <ChevronRight />,
);

const Ellipsis = sub<HTMLSpanElement>(
  "span",
  "breadcrumb-ellipsis",
  "Breadcrumb.Ellipsis",
  "flex size-9 items-center justify-center",
  { role: "presentation", "aria-hidden": "true" },
  <>
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More</span>
  </>,
);

const Breadcrumb = Object.assign(Root, {
  List,
  Item,
  Link,
  Page,
  Separator,
  Ellipsis,
});

export { Breadcrumb };
export type { BreadcrumbLinkProps };
