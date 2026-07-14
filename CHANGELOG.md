# Changelog

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.16.0] - 2026-07-14

### Added
- `Breadcrumb` primitive — composable hierarchical navigation trail
  (`Breadcrumb.List/Item/Link/Page/Separator/Ellipsis`): semantic `nav>ol>li` anatomy,
  `aria-current="page"` on the current page, presentation-role separators, collapsed
  levels via `Ellipsis`, SPA router links via `asChild`, and `javascript:`-style hrefs
  neutralized by the safe-href guard. Ships with 15 behavior tests (axe: zero violations),
  4 Ladle stories and a shadcn-compatible registry item (`registry/r/breadcrumb.json`).
  First component of the data-UI expansion roadmap (M0). (usetheo-ui#M0)


### Changed
- `TopNav.Breadcrumbs` is soft-deprecated in docs: prefer the standalone `Breadcrumb`
  primitive for new code. No API or runtime change — the sub stays backward-compatible
  and will be reimplemented on top of the primitive in a future minor. (usetheo-ui#M0)

## [0.15.0] - 2026-07-09

### Changed
- **BREAKING (type-only): the six fixed-slot primitives now REJECT `children` at the type level.**
  `Alert`, `EmptyState`, `MetricCard`, `StatTile`, `PlanBadge`, and `UpdateBanner` render only their
  named slots (title/description/value/label/…); they never rendered `children`, so passing them
  **silently dropped the body** (usetheodev/theo-cloud#175). Their props now `Omit<…, "children">`, so
  `<Alert>text</Alert>` is a **compile error** instead of a runtime data loss — the body must go through
  the named slot (e.g. `description`). This only breaks builds that were *already* passing children
  (silently broken at runtime); the compile error points at the exact site. A `children-rejected.test-d.tsx`
  type-level test (enforced by `tsc --noEmit`) pins the rejection for all six. Migration: move the
  dropped `children` into the primitive's slot prop (`description`/`value`/etc.).

### Fixed
- `scripts/validate-registry.ts` — guard a possibly-`undefined` regex capture group so the repo
  typecheck is green (pre-existing, unrelated to the primitives).

## [0.14.0] - 2026-07-03

### Added
- GitHub Actions workflow (`deploy-registry.yml`) that publishes `registry/r/*.json` to GitHub
  Pages on every push to `main`, so the shadcn copy-paste path
  (`npx shadcn@latest add https://usetheodev.github.io/usetheo-ui/r/<name>.json`) resolves — the
  same URL `@theokit/ui`'s registry cross-references via `registryDependencies`.
- Initial `@usetheo/ui` package: 54 non-AI components (39 primitives + 15 composites)
  + the Violet Forge foundation (`cn`, `tailwind-preset`, themes, a11y/security libs),
  seeded from theo-ui @ `2b46eca` during the AI-exclusive pivot (milestone M-B). ESM-only,
  Apache-2.0. Not yet published — release ships at the end of the pivot roadmap.
