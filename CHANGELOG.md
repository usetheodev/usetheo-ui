# Changelog

## [Unreleased]

### Added
- `FileDropzone` primitive — upload por drag-drop + file picker, dependency-free (HTML5
  DnD nativo; react-dropzone estudado como referência e dispensado com evidência): validação
  com rejeições tipadas (`file-invalid-type`/`file-too-large`/`file-too-small`/`too-many-files`
  + validator custom), accept map com MIME exato/wildcard/extensão, regra coletiva
  tudo-ou-nada de maxFiles, contagem de targets para drag aninhado (double-fire do Firefox
  coberto), picker acessível por teclado (Space/Enter), estados
  idle/drag-over/drag-reject/disabled e região de rejeições em texto. Helpers puros
  `matchesAccept`/`validateFiles` exportados. 34 testes de comportamento (axe: zero
  violations em idle/rejected/disabled), 4 Ladle stories (incl. ingest do theo-rag composto
  com `Progress`), registry item `file-dropzone`. Zero dependências novas. (usetheo-ui#M5)

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.20.0] - 2026-07-15

### Added
- `Stepper` composite — pipeline de progresso multi-etapas promovido do build-timeline do
  dashboard theo-cloud: estado explícito por etapa (`pending/active/done/failed` — falha pode
  ocorrer em etapa arbitrária), orientações vertical (default) e horizontal, slot de timestamp
  por etapa, slot de retry renderizado apenas em etapas com falha, truncamento de labels longos
  com tooltip, e acessibilidade nativa (`ol` + `aria-current="step"` + estado de falha em texto,
  não só cor). Helper puro `deriveSteps(defs, activeIndex)` exportado para o caso wizard-simples.
  29 testes de comportamento (axe: zero violations nas duas orientações), 4 Ladle stories
  (build pipeline com retry, ingest do theo-rag com timestamps, composição com StatusDot/Badge,
  horizontal), registry item `stepper`. Zero dependências novas. (usetheo-ui#M4)

## [0.19.0] - 2026-07-15

### Added
- `TrendChart` composite — multi-series time-trend chart in pure SVG (zero chart-lib
  dependencies), promoted from the theo-cloud dashboard with its production lessons pinned
  by tests: sparse-series point markers, single-bucket dots, explicit empty state, a
  screen-reader data table keyed by the shared period axis (ragged series read correctly),
  `valueFormatter` for axis/table values, and non-finite points skipped safely. Pure
  helpers `linScale`/`niceMax`/`seriesPath` exported. 18 behavior tests (axe: zero
  violations), 3 Ladle stories (including the theo-rag p50/p95 latency case), registry
  item `trend-chart`. (usetheo-ui#M3)

## [0.18.0] - 2026-07-15

### Added
- `DescriptionList` primitive — semantic key/value pairs on native `dl/dt/dd`
  (`DescriptionList.Item/Term/Detail`): vertical and horizontal (grid) layouts, `dense`
  mode, valid multi-detail terms. 11 behavior tests (axe: zero violations on both
  layouts), 3 Ladle stories, registry item `description-list`. (usetheo-ui#M2)
- `JsonViewer` primitive — read-only collapsible JSON tree with zero dependencies:
  `collapsed` boolean/depth contract with lazy (unrendered) subtrees, per-type rendering
  (BigInt `n` suffix, Date ISO, `undefined`/functions), long-string truncation with
  click-to-reveal, and circular-safe rendering AND copy (the studied SOTA reference does
  not handle circular references). Per-node copy via `CopyButton`. 21 behavior tests
  (axe: zero violations), 3 Ladle stories including the DetailPanel composition with
  DescriptionList, registry item `json-viewer`. (usetheo-ui#M2)

## [0.17.0] - 2026-07-15

### Added
- `Slider` primitive — range input over Radix Slider (new dep `@radix-ui/react-slider`):
  single or multi-thumb, decimal steps (0-1 thresholds), clickable labelled `marks`,
  controlled values clamped to `[min, max]`, accessible thumb labels, vertical orientation.
  15 behavior tests (axe: zero violations), 5 Ladle stories, registry item `slider`. (usetheo-ui#M1)
- `Combobox` primitive — single-select typeahead over the installed `cmdk` engine with an
  inline listbox (zero new deps): sync filtering with `Empty` on no-match, async mode via
  `shouldFilter={false}`, `loading` state with `aria-busy`, full keyboard nav
  (ArrowDown/Enter/Escape), outside-click close, APG combobox ARIA contract enforced even
  where cmdk hardcodes attributes. 20 behavior tests (axe: zero violations), 5 Ladle stories
  (including the "query playground" composition with two sliders), registry item `combobox`. (usetheo-ui#M1)

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
