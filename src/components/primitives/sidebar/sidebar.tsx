import { Slot, Slottable } from "@radix-ui/react-slot";
import { forwardRef } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ElementType,
  HTMLAttributes,
  ReactNode,
  Ref,
} from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Sidebar — vertical navigation shell.
 *
 * Composition:
 *   <Sidebar>
 *     <Sidebar.Header>…brand…</Sidebar.Header>
 *     <Sidebar.Section title="Workspace">
 *       <Sidebar.Item icon={Home} active>Overview</Sidebar.Item>
 *       <Sidebar.Item icon={Rocket} count={3}>Deployments</Sidebar.Item>
 *     </Sidebar.Section>
 *     <Sidebar.Footer>…user…</Sidebar.Footer>
 *   </Sidebar>
 *
 * Width is 260px by default (matches the wiremocks). Pass `className` to override.
 * Sidebar root is `<aside>` with a hairline right border.
 */

const Root = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <aside
      data-slot="sidebar"
      ref={ref}
      className={cn(
        "flex h-full w-64 flex-col border-border/40 border-r bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Root.displayName = "Sidebar";

const Header = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      data-slot="sidebar-header"
      ref={ref}
      className={cn("flex h-16 items-center gap-3 border-border/40 border-b px-5", className)}
      {...props}
    />
  ),
);
Header.displayName = "Sidebar.Header";

interface SectionProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
}

const Section = forwardRef<HTMLDivElement, SectionProps>(
  ({ className, title, children, ...props }, ref) => (
    <div
      data-slot="sidebar-section"
      ref={ref}
      className={cn("flex flex-col gap-1 px-3 py-4", className)}
      {...props}
    >
      {title ? (
        <p className="px-2 pb-1 font-sans text-label-caps text-muted-foreground uppercase">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  ),
);
Section.displayName = "Sidebar.Section";

interface ItemBaseProps {
  icon?: ElementType;
  active?: boolean;
  count?: number | string;
}

/**
 * The `<button>` arm. `type` is owned by the component, so it is not offered.
 *
 * `href?: never` is what makes the union discriminate on a mistake rather than on the `as` alone:
 * `<Sidebar.Item href="/x">` without `as="a"` renders a button that ignores the href, and used to
 * type-check.
 */
type ItemButtonProps = ItemBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    as?: "button";
    href?: never;
    // Declared on every arm, like `href`: a discriminated union only narrows on a field all of
    // its members carry, and `{...props}` below has to see it removed in every branch.
    asChild?: never;
  };

/**
 * The `<a>` arm — anchor attributes, and `href` REQUIRED.
 *
 * The requirement is not pedantry: an anchor without `href` is not keyboard focusable and not
 * announced as a link, so `as="a"` with the href forgotten produced a nav row that a keyboard user
 * could not reach. It type-checked before, because both fields were optional on one shape.
 */
type ItemAnchorProps = ItemBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: "a";
    href: string;
    asChild?: never;
  };

/**
 * The `asChild` arm — the component renders whatever element the child is (issue #31).
 *
 * The case it exists for is a router link. `as="a" href={to}` plus an `onClick` that calls
 * `navigate()` works, and it is what consumers write today, but the router never sees the link, so
 * it cannot prefetch it. On a sidebar — where hover precedes click almost every time — that is
 * exactly where prefetch paid. Wrapping the item in a `<Link>` instead nests an `<a>` inside an
 * `<a>`, which is invalid.
 *
 *     <Sidebar.Item asChild icon={Home} active>
 *       <Link to="/feedback" prefetch="intent">Feedback</Link>
 *     </Sidebar.Item>
 *
 * `as` and `href` are `never` here because the child owns the element and its href. Offering both
 * would let `<Sidebar.Item asChild as="a" href="/x">` type-check while the `as` silently did
 * nothing — the same class of defect the `href?: never` on the button arm exists to prevent.
 *
 * The icon, the count and `aria-current` still come from the component: `Slottable` marks which
 * child becomes the host element, and the rest render inside it.
 */
type ItemAsChildProps = ItemBaseProps &
  HTMLAttributes<HTMLElement> & {
    asChild: true;
    as?: never;
    href?: never;
  };

/**
 * Props of `Sidebar.Item`.
 *
 * A discriminated union rather than one shape with `as?: "button" | "a"`, because the runtime has
 * always branched on `as` — it casts to `AnchorHTMLAttributes` in the anchor path — while the type
 * described a button in both. The consequence was that no anchor attribute could be passed:
 * `target`, `rel`, `download`, `hrefLang` all failed to compile on an element that renders them
 * fine. A sidebar link to another site, which almost always wants `target="_blank" rel="noreferrer"`,
 * could not be written with this component at all (usetheodev/usetheo-ui#27).
 */
type ItemProps = ItemButtonProps | ItemAnchorProps | ItemAsChildProps;

/**
 * Sidebar.Item — single nav row. Renders as <button> by default; pass `as="a"` + `href`
 * to render an anchor for routing.
 */
const Item = forwardRef<HTMLElement, ItemProps>(
  (
    { className, icon: Icon, active, count, as = "button", href, asChild, children, ...props },
    ref,
  ) => {
    const classes = cn(
      "group flex w-full items-center gap-3 rounded-lg px-2 py-2",
      "font-medium font-sans text-body-sm",
      "transition-colors duration-base ease-out-soft",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      className,
    );

    const content = (
      <>
        {Icon ? (
          <Icon
            className={cn(
              "size-4 shrink-0",
              active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        ) : null}
        <span className="flex-1 truncate text-left">{children}</span>
        {count !== undefined ? (
          <span
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 font-mono text-label",
              active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15",
            )}
          >
            {count}
          </span>
        ) : null}
      </>
    );

    if (asChild === true) {
      // `Slottable` marks WHICH child becomes the host element. Without it the child would replace
      // the whole subtree and the icon and count would vanish — the component would style a link
      // and drop everything else it promises.
      return (
        <Slot
          data-slot="sidebar-item"
          ref={ref}
          className={classes}
          aria-current={active ? "page" : undefined}
          {...props}
        >
          {Icon ? (
            <Icon
              className={cn(
                "size-4 shrink-0",
                active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          ) : null}
          <Slottable>{children}</Slottable>
          {count !== undefined ? (
            <span
              className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 font-mono text-label",
                active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15",
              )}
            >
              {count}
            </span>
          ) : null}
        </Slot>
      );
    }

    if (as === "a") {
      return (
        <a
          data-slot="sidebar-item"
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          aria-current={active ? "page" : undefined}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        data-slot="sidebar-item"
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        aria-pressed={active ? "true" : undefined}
        // Symmetric to the anchor branch above. The union carries the `<a>` arm too, whose `type`
        // is the MIME type — a plain `string`, which a `<button>` does not accept. Narrowing here
        // is what lets the two arms share one implementation.
        {...(props as Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">)}
      >
        {content}
      </button>
    );
  },
);
Item.displayName = "Sidebar.Item";

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      data-slot="sidebar-footer"
      ref={ref}
      className={cn("mt-auto border-border/40 border-t px-5 py-4", className)}
      {...props}
    />
  ),
);
Footer.displayName = "Sidebar.Footer";

const Sidebar = /*#__PURE__*/ Object.assign(Root, {
  Header,
  Section,
  Item,
  Footer,
});

export { Sidebar };
