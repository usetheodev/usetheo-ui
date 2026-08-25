import { Sidebar } from "./sidebar.js";

/**
 * Type-level contract for `Sidebar.Item`'s `as` discriminant — usetheodev/usetheo-ui#27.
 *
 * The runtime has always branched on `as`, rendering a real `<a>` with anchor attributes. The type
 * described a `<button>` in both arms, so every anchor attribute failed to compile on an element
 * that renders it fine: a sidebar link to another site — which almost always wants
 * `target="_blank" rel="noreferrer"` — could not be written with this component at all.
 *
 * Like `children-rejected.test-d.tsx`, this file renders nothing. The compiler is the assertion:
 * each `@ts-expect-error` fails the kit's `tsc --noEmit` if the error it suppresses stops
 * happening, and each good form fails if it stops compiling.
 */

// ── the anchor arm accepts anchor attributes ────────────────────────────────────────────────────
export const _anchorAccepts = (
  <>
    <Sidebar.Item as="a" href="https://example.com" target="_blank" rel="noreferrer">
      External
    </Sidebar.Item>
    <Sidebar.Item as="a" href="/report.pdf" download hrefLang="pt">
      Download
    </Sidebar.Item>
    <Sidebar.Item as="a" href="/inbox" active count={3}>
      Inbox
    </Sidebar.Item>
  </>
);

// ── the button arm is unchanged, and still owns `type` ──────────────────────────────────────────
export const _buttonAccepts = (
  <>
    <Sidebar.Item onClick={() => undefined}>Overview</Sidebar.Item>
    <Sidebar.Item as="button" disabled count="9+">
      Deployments
    </Sidebar.Item>
  </>
);

// ── the mistakes the union catches ──────────────────────────────────────────────────────────────
export const _rejects = (
  <>
    {/* @ts-expect-error — `as="a"` without href: an anchor with no href is not keyboard focusable */}
    <Sidebar.Item as="a">Unreachable</Sidebar.Item>
    {/* @ts-expect-error — href without `as="a"` renders a button that silently ignores it */}
    <Sidebar.Item href="/inbox">Ignored</Sidebar.Item>
  </>
);

/**
 * Two mistakes the union does NOT catch. Measured case by case, not assumed:
 *
 *   <Sidebar.Item type="submit">      `type` is owned by the component and dropped
 *   <Sidebar.Item target="_blank">    a target on the button arm does nothing
 *
 * Both compile. In a JSX union a prop is accepted when it exists on ANY arm, and both exist on the
 * anchor arm — `target` by design, `type` because `AnchorHTMLAttributes` carries it as the link's
 * MIME type. The discriminant rules the arm out only after the attribute has already been
 * satisfied against it.
 *
 * Written down instead of suppressed, because claiming the union is stronger than it is would be
 * worse than saying where it stops. Closing these two needs two named entry points
 * (`Sidebar.Item` / `Sidebar.LinkItem`) instead of one with a discriminant — a design decision for
 * the owner of this component, not a side effect of a typing fix. Tracked separately.
 */
