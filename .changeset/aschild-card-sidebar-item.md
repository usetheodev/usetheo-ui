---
"@usetheo/ui": minor
---

`Card` and `Sidebar.Item` accept `asChild`.

Two issues, one question, answered the same way on purpose — answering them differently would have
been worse than either answer alone (usetheodev/usetheo-ui#31, #32).

**`Sidebar.Item asChild`** lets a router `Link` be the element the row renders, so the router sees
the link and can prefetch it. `as="a" href={to}` plus an `onClick` calling `navigate()` works and is
what consumers write today, but the router never sees that link — and on a sidebar, where hover
precedes click almost every time, prefetch is exactly what that costs. Wrapping in a `<Link>`
instead nests an `<a>` inside an `<a>`. The icon, the count and `aria-current` still come from the
component: `Slottable` marks which child becomes the host element, and the rest render inside it.

**`Card asChild`** lets the whole card be a control — choice grid, plan picker, agent selector. The
two ways to build one without it were both bad: a `<button>` wrapped around a `<Card>` is invalid
(a button takes phrasing content and the card renders a `<div>`, so the browser reparents it), and
copying the card's classes onto a `<button>` forks the design system at a place that stops tracking
it. This does not lift the phrasing-content restriction — choose `<button>` and everything inside is
still limited — but it gives the choice, and `<a>` becomes the better answer for anything navigable.

Both are additive: `as` still serves the router-less cases, and omitting `asChild` renders exactly
what it rendered before.
