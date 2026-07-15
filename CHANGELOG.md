# Changelog

## [Unreleased]

### Added
- `computeHistogram(values, binCount)` helper puro em `src/lib/chart` — distribui valores numéricos em bins de largura igual (count por bin; não-finitos filtrados; range degenerado colapsa em 1 bin; borda superior inclusiva no último bin) (M11 T1.0)

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.24.0] - 2026-07-15

### Added
- `SessionTimeline` composite — replay temporal da sessão (uma linha por trace, ordenada por startTime, barra de duração relativa à janela via trace-core, status honesto, custo, virtualização) (M9 T3.0)
- `SessionSummary` composite — `<dl>` de métricas honestas de sessão (traceCount/janela/∑custo/∑tokens/erros-em-destructive/models); sums de zero honestos, nunca em-dash (M9 T2.0)
- `session` core: tipo `SessionTraceItem` + `aggregateSession` (métricas honestas de sessão — traceCount/janela/∑custo/∑tokens/erros/models; custo-ausente=0 nunca NaN) (M9 T1.0)
- Roadmap V2 declarado (fechamento do gap SOTA vs Arize/Phoenix/Langfuse): M9 Sessions ricas, M10 Prompt management, M11 Analytics time-series, M12 Annotation platform, M13 Monitors+automations — baseado em `.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`

## [0.23.0] - 2026-07-15

### Added
- `TraceCompare` composite — dois traces lado a lado (B vs A baseline): header de métricas por lane + tabela de diff estrutural com deltas honestos (span sem par = "only in A/B", sem delta fabricado); `alignSpanTrees`/`traceMetrics` puros (M8 T5.0)
- `SpanGraph` composite — grafo de agente em SVG puro (layout BFS layered determinístico, zero dep de chart/layout — ADR mantido), destaque do caminho root→selecionado, oversize honesto, nodes focáveis (M8 T4.0)
- `TraceTranscript` composite — feed reader-mode do trace (card por span com role/preview/stats), group-headers colapsáveis de subagente (descendentes reais da árvore, nesting-safe), virtualização; deriva o row model via `toTranscriptRows` (M8 T3.2)
- `IOCards` composite — payloads input/output de span: array ChatML vira cards por role com pareamento tool-call/result, colapso de histórico longo, redacted-thinking; markdown via slot `renderMarkdown` (default texto puro, XSS-safe); fallback JSON via `JsonViewer` (M8 T3.1)
- `AttributesTable` composite — atributos OTel agrupados por namespace (cards colapsáveis), masking PII fail-closed (`maskedKeys` predicate + `canReveal`; valor raw nunca no DOM pré-reveal), promoted badges, fallback JSON via `JsonViewer` (M8 T3.0)
- `SpanWaterfall` composite — eixo de tempo 1/2/5×10ⁿ + barras percentuais row-packed, hover-needle com timestamp absoluto, badge ∑ de custo em parents, in-flight/clock-skew como barra dashed unbounded (M8 T2.1)
- `SpanTree` composite — árvore de spans com ARIA APG completa (treeitem/level/posinset/setsize/selected/expanded/group), navegação por teclado (↑/↓/Home/End/Enter), dual-path recursivo/virtualizado, barra inline opcional (M8 T2.0)
- `trace-core`: tipo `TraceSpan` (interseção phoenix/langfuse/lens) + helpers puros de observabilidade — `toNs`, `durationMs`, `computeTraceBounds`, `computeBarLayout`, `niceAxisTicks`, `packRows`, `spanCostUsd`/`aggregateCost`, `flattenVisible`/`flattenAll`, `toTranscriptRows`, `asChat`/`prettyValue`, `deriveSpanKind`, `buildLayeredGraph` (M8 T1.0)
- Roadmap amended: added M8 Lens Observability Kit (`/roadmap-feature lens-observability-kit`)
- Preview local dos componentes: `pnpm dev` sobe o Ladle com o tema Violet Forge completo (tokens OKLCH + preset + Tailwind v4 via `@tailwindcss/vite`) — setup dev-only em `.ladle/`, nada é shipped no pacote (#dev-preview)
- Preview local: paridade real com o ecossistema — base layer canônica `global-v4.css` + `tokens-v4.css` (@theme), `bg-dotted-violet`/`container` no provider e Geist via `<link>` no head (o `@import` externo era ignorado pós-inline do Tailwind); a investigação expôs a regressão dos assets CSS públicos não publicados no pacote (#10)


### Changed
- Roadmap "out of scope" amended: recorte de observabilidade de agentes removido da exclusão AI-nativa (agora em escopo como M8; conversação/Chat/Citations seguem fora)

## [0.22.1] - 2026-07-15

### Fixed
- `ActionBar`/`PageShell` — o input de busca voltou a expor `aria-label` derivado do
  placeholder (reticências finais removidas), com override opcional via
  `search["aria-label"]`. Regressão de a11y da linhagem do pivot, pega pela suíte do
  dashboard no bump do M7; testes de regressão pinam a derivação e o override. (#8)

## [0.22.0] - 2026-07-15

### Added
- Modo `virtualized` no `DataTable` — 10K+ linhas num scroll único sobre
  `@tanstack/react-virtual` (única dependência nova do V1; MIT, 1 transitiva zero-dep,
  custo MEDIDO de +5233 bytes min ESM no dist): `<table>` semântica preservada (tr em
  fluxo com translate corrigido — padrão do exemplo oficial), sticky header no container
  próprio, alturas de linha fixas, sorting compatível. `virtualized` é mutuamente
  exclusivo com `pagination`/`expandable` NO TIPO (união discriminada) + dev-warning em
  runtime; limitações documentadas no JSDoc. 20 testes novos (janela exata de 10.000
  linhas provada com viewport injetado — padrão dos testes oficiais da dep), 2 stories
  (`Virtualized10K` determinística com matriz manual cross-browser), registry `data-table`
  atualizado com a dep explícita e os módulos copy-pasteable. (usetheo-ui#M6)


### Changed
- `DataTableProps<T>` passou de interface para união discriminada (type-only; runtime
  intacto). Consumidores que estendiam a interface via `extends` devem trocar para
  interseção de tipos; uso normal do componente não muda. (usetheo-ui#M6)

## [0.21.0] - 2026-07-15

### Added
- `FileDropzone` primitive — upload por drag-drop + file picker, dependency-free (HTML5
  DnD nativo; react-dropzone estudado como referência e dispensado com evidência): validação
  com rejeições tipadas (`file-invalid-type`/`file-too-large`/`file-too-small`/`too-many-files`
  + validator custom), accept map com MIME exato/wildcard/extensão, regra coletiva
  tudo-ou-nada de maxFiles, contagem de targets para drag aninhado (double-fire do Firefox
  coberto), picker acessível por teclado (Space/Enter), estados
  idle/drag-over/drag-reject/disabled e região de rejeições em texto. Helpers puros
  `matchesAccept`/`validateFiles` exportados. 41 testes de comportamento (axe: zero
  violations em idle/rejected/disabled), 4 Ladle stories (incl. ingest do theo-rag composto
  com `Progress`), registry item `file-dropzone`. Zero dependências novas. (usetheo-ui#M5)

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
