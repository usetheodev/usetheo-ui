# Changelog

## [Unreleased]

## [0.31.0] - 2026-07-21

### Fixed
- **`Dialog` no longer renders as a lateral drawer.** `Dialog` and `Sheet` were both `DialogPrimitive.Root` — the *same object* — with their compound members assigned directly onto it, so `Sheet.Content` (a right-side drawer) clobbered `Dialog.Content` (centered) depending on module-evaluation order. Any `<Dialog.Content>` could open laterally instead of centered. Each now wraps Radix `Root` in its own passthrough component (shadcn pattern), so `Dialog.Content` (centered) and `Sheet.Content` (lateral) are distinct and coexist. Regression test imports both from the barrel and asserts Dialog renders centered (`left-1/2 top-1/2`) while Sheet renders lateral (`right-0 slide-in-from-right`), and that `Dialog.Content !== Sheet.Content`. No public API change — call sites are unaffected.

### Added
- `TrendChart` `yMax?: number` prop — pin the top of the y-axis (e.g. `1` for a 0–1 score) instead of auto-fitting to the data max. Ignored when ≤ 0.

### Fixed
- `TrendChart` no longer stretches markers into ovals on wide containers: the SVG viewBox now tracks the element's real pixel width (via `ResizeObserver`) instead of a fixed 600-wide viewBox with `preserveAspectRatio="none"`. jsdom/SSR keeps the 600 fallback.
- `niceMax` no longer returns binary-float artifacts (`Math.ceil(0.68 / 0.1) * 0.1` was `0.7000000000000001`, which rendered raw on the y-axis) — the bound is normalized via `toPrecision(12)`.

## [0.29.0] - 2026-07-20

### Added
- `spanOwnCostUsd(span): number | undefined` — the per-span DISPLAY cost helper. Unlike `spanCostUsd`
  (which collapses absent/≤0 to `0` so `∑` badges stay honest), this returns `undefined` when a span
  has **no individually-computed cost**, so per-span surfaces render `—` (em-dash) instead of a
  fabricated `$0.0000`. (theo-lens#71 Finding 3 / M52)

### Fixed
- `TraceTranscript` per-row cost showed `$0.0000` for a span with no individually-computed cost — it
  reused the aggregate helper (`spanCostUsd`, coalesces to 0) for a per-span display. It now uses
  `spanOwnCostUsd` and renders `—`, matching the `TokenCostBreakdown` contract (absent → em-dash).
  `TranscriptRowStats.costUsd` is now `number | undefined`. Cost is a core observability metric, so a
  misleading `$0.0000` per span is a correctness bug. Suite 1310/1310. (theo-lens#71 Finding 3 / M52)

## [0.28.2] - 2026-07-16

### Changed
- Menus mais largos, alinhados com a dimensão dos dropdowns do `@theokit/ui`: o `DropdownMenu`
  (Content + SubContent) e o `Select` (Content) passam de `min-w-32` / `min-w-[8rem]` (128px) para
  **`min-w-[12rem]` (192px)** — a mesma largura-base dos menus do `@theokit/ui` (approval/model/intent).
  Combinado com o `@theokit/ui@1.2.1` (que leva `--popover` ao tom escuro do card `#121212`), os menus
  das duas libs passam a ter a mesma cor e largura quando coexistem numa tela (ex.: Builder do studio).
  Ajuste equivalente no `--popover` do `.ladle/tokens.css` (dev/playground). Visual-only, zero mudança de
  API; suíte 1300/1300. (#ui-scope-parity)

## [0.28.1] - 2026-07-16

### Fixed
- Tipografia e menus voltam a bater 1:1 com o `@theokit/ui` (o DS de referência), eliminando o
  degradê visual quando as duas libs coexistem numa tela (ex.: Builder do studio): o token
  `body-sm` volta a **13px / line-height 1.46** — a 0.28.0 o havia posto em 14px, mas o
  `@theokit/ui` e o próprio `tokens-v4.css` deste pacote já estavam em 13px, então os itens de
  menu (`DropdownMenu.Item` usa `text-body-sm`) e o texto de apoio destoavam 1px entre os dois
  escopos. O popover do `DropdownMenu` (Content + SubContent) passa a usar `bg-popover` + `border`
  (era `bg-card` + `border-border/40`), igualando o `Select` e os dropdowns do `@theokit/ui` — no
  dark os menus deixam de abrir num tom mais escuro. Visual-only, zero mudança de API; suíte
  1300/1300 (#ui-scope-parity)

## [0.28.0] - 2026-07-16

### Changed
- **Identidade compacta (density shift)** — o default de controle do DS passa a 32px, alinhando com a linguagem do theokit-studio (Builder): `--theo-control-h` 2.25rem→**2rem (32px)** e `--theo-control-px` 0.875rem→**0.75rem (12px)** (fallback dos primitivos `Button`/`Input`/`Select`/`Textarea`, tier `md`); inputs (`Input`/`Select`/`Textarea`) `rounded-md`→**`rounded-lg`** (igualando os botões); token de tipografia `body-sm` **13px→14px** (line-height 1.46→1.43), afetando todo o texto de apoio do DS. Consumidores podem restaurar 36px via `--theo-control-h: 2.25rem` no `:root`. Testes de densidade atualizados; suíte 1300/1300; zero mudança de API (visual-only).

## [0.27.0] - 2026-07-15

### Added
- `ChatMessageCard` composite — card de UMA mensagem de chat (átomo): `Badge` de role (`user`/`assistant`/`tool`/`system`, role desconhecido cai em `outline` neutro honestamente) + `content` como texto + `toolCalls`/`toolResults` renderizados via `CodeBlock` existente (não hand-rolled — ADR D2, DRY); reusa o tipo trace-core `ToolCall` (`{ id; function?: { name?; arguments? } }`) — os `tool_calls` de um span de assistant entram direto; sem content e sem tools → empty state honesto (`data-slot="chat-message-card-empty"`); distinto do `TraceTranscript` (feed) — este é UMA mensagem controlada; `data-slot`/`data-role`; `forwardRef` + `cn`; zero dep nova; axe limpo (M19 T1.0)
- `MessageBranchSelector` composite — navegador controlado entre branches alternativos de mensagem (ex.: respostas regeneradas): "‹ 2 / 5 ›" com `Button`s prev/next (labels acessíveis "Previous branch"/"Next branch"); totalmente controlado (ADR D3) — o consumidor detém `index` e reage a `onPrev`/`onNext`; regenerate/streaming é plataforma; prev desabilitado no primeiro branch, next no último; `count <= 1` não renderiza nada (nada a navegar); compõe `Button` — zero dep nova; `data-slot`; `forwardRef` + `cn`; axe limpo (M19 T2.0)
- `PromptTemplateEditor` composite — editor de template controlado: `Textarea` + hint simples listando variáveis disponíveis e quais estão usadas vs ausentes; overlay leve sobre o textarea (ADR D1 — sem CodeMirror/lib de editor); detecção via helper puro `extractVars` (público) que reconhece mustache (`{{name}}`) E f-string (`{name}`), deduped em ordem; "usada" = variável aparece no value, "ausente" = usada mas não declarada em `variables`; textarea rotulado (`aria-labelledby`); compõe `Textarea`/`Badge` — zero dep nova; `data-slot`; `forwardRef` + `cn`; axe limpo (M19 T3.0)
- `EvaluatorForm` composite — builder controlado e config-driven de um evaluator built-in (`EvaluatorConfig` = union discriminada por `type`: `exact_match`/`contains` → campo `target`; `regex` → `pattern` + `flags?`; `levenshtein`/`json_distance` → `threshold` numérico); um `<select>` nativo troca o tipo (emitindo um config fresco do novo tipo com defaults via `defaultEvaluatorConfig`); campos por tipo com narrowing `Extract<EvaluatorConfig, {type}>` após guard (padrão M12, evita TS#30581); threshold nunca emite `NaN` (vazio → 0); o form só EDITA o config — execução/sandbox do evaluator é plataforma; type guards públicos `isTargetEvaluator`/`isRegexEvaluator`/`isThresholdEvaluator`; compõe `Input`/`Label` — zero dep nova; `forwardRef` + `cn` + `data-slot`/`data-eval-type`; axe limpo (M18 T1.0)
- `AnnotationSummaryGroup` composite — grupo colapsável (`<details>`/`<summary>` nativo, zero-JS) com stats AGREGADAS sobre `values: (string|number)[]` para um `AnnotationConfig` (reusado do M12 — DRY, sem redefinir): continuous → média dos valores finitos (ignora `NaN`/`Infinity`) + count; categorical → contagem por `options[].label` + total; freeform → count de não-vazios; `values` vazio → empty state honesto (`data-slot="annotation-summary-group-empty"`); `label`/`defaultOpen` opcionais; compõe `Card`/`Badge` — zero dep nova; `forwardRef` + `cn` + `data-slot`; axe limpo (M18 T2.0)
- `TagInput` composite — editor de tags multi-valor controlado (`value: string[]` + `onChange`); um chip removível por tag (`Badge` + botão `×` com label acessível `"Remove {tag}"`) + um `Input` para adicionar via Enter; dedup embutido (tag existente ou vazia/whitespace é no-op; novas tags são trimadas); `disabled` bloqueia add e remove; `suggestions` opcionais via `<datalist>` nativo (autocomplete zero-dep); compõe `Input`+`Badge` (não `Combobox` — typeahead single-select não cabe em multi-valor free-text); `forwardRef` + `cn` + `data-slot`; zero dep nova; axe limpo (M17 T1.0)
- `CommentThread` composite — thread de comentários controlado + composer; `<ol>` ordenada (`Avatar` + autor + `Timestamp` + body) seguida de um composer (`Textarea` + `Button`); lista controlada via `comments: Comment[]`, só o draft do composer é estado local; body não-vazio (trimado) chama `onSubmit(body)` e limpa o composer, vazio/whitespace não submete; sem comentários → empty state honesto (`data-slot="comment-thread-empty"`) com o composer ainda presente; tipo público `Comment = { id; author; body; createdAt: string|number; avatarUrl? }`; compõe `Avatar`/`Textarea`/`Button`/`Timestamp` — zero dep nova; `forwardRef` + `cn` + `data-slot`; axe limpo (M17 T2.0)
- `SeverityBadge` composite — indicador de severidade rotulado multi-nível (`ok`/`warning`/`alert`/`no_data`/`unknown`/`paused` — vocabulário `MonitorSeverity` do langfuse, minúsculo) que mapeia `severity` → `variant` do `Badge` (`alert→destructive`, `warning→warning`, `ok→success`, demais→`outline` neutro); `label` default legível derivada da severidade (ex.: `"ok"→"OK"`, `"no_data"→"No data"`); overrides por prop `label`/`variantMap`; valor fora do enum cai no `outline` neutro honestamente (nunca quebra); compõe o `Badge` — zero dep nova, sem primitivo novo; distinto do `StatusIndicator` (dot de liveness vs badge de severidade rotulado); `forwardRef` + `cn`; axe limpo (M16 T1.0)
- `TokenCostBreakdown` composite — breakdown `<dl>` de uso de tokens (input / output / cache / total) + custo USD de um request/span/trace; controlado e puro; zeros honestos (padrão M9 `SessionSummary`): `0` real renderiza `0` / `$0.0000`, ausente renderiza em-dash (`—`), todos ausentes → empty state honesto; `forwardRef` + `cn`; zero dep nova; axe limpo (M15 T1.0)
- `PriceBreakdown` composite — `<table>` de preço por-unidade / por-1K / por-1M (escala = `price`, `price×1000`, `price×1e6`) sobre um map `prices` (label→preço/unidade); `unit` default `"token"`; `prices` vazio → empty state honesto; `<caption>` sr-only; `forwardRef` + `cn`; zero dep nova; axe limpo (M15 T2.0)
- `DatasetItemDiff` composite — diff de duas versões de um dataset-item (input / expectedOutput / metadata stringificados; string passa direto, senão JSON pretty); campo ausente em AMBOS os itens é omitido honestamente (sem tabela vazia); reusa `DiffView`; zero dep nova; helper puro `fieldToText`/`fieldPresent` testado + axe (M14 T3.0)
- `PromptVersionDiff` composite — diff de duas versões de prompt (template string OU chat-array normalizado para `role: content`; config em JSON pretty); DiffView de config omitido honestamente quando ambos os configs ausentes; reusa `DiffView`; zero dep nova; helper puro `templateToText`/`configToText` testado + axe (M14 T3.0)
- `DiffView` primitivo — diff de texto por linha renderizado como `<table>` semântica sobre o `diffLines` puro (sem lib de diff); `mode="split"` (2 colunas, default) ou `"unified"` (inline); cada linha alterada carrega marker textual `+`/`-` + `data-diff` (a11y, não só cor); empty state honesto "No changes"; `<caption>` sr-only; `forwardRef`; reusa `cn` + o core `diff`; axe limpo (M14 T2.0)
- `diffLines(oldText, newText)` helper puro em `src/lib/diff` — diff por linha via LCS (zero dep; rows eq/del/add com numeração honesta) (M14 T1.0)
- Roadmap V3 — 6 milestones de componentes SOTA restantes (só DS-now, fundamentado em gap analysis langfuse+phoenix): M14 Diff viewing, M15 Cost & token visibility, M16 SeverityBadge, M17 Collaboration, M18 Eval authoring, M19 Chat & message (`/roadmap-feature v3-sota-components`)

### Fixed
- `PromptTemplateEditor` — `variables` com nomes duplicados não geram mais chips repetidos (dedup via Set; review V3 L-1)

## [0.26.0] - 2026-07-15

### Added
- `AnnotationInput` composite — input de anotação humana controlado e config-driven (categorical→RadioGroup / continuous→number input com bounds / freeform→Textarea), modelo de 3 tipos do Phoenix; compõe os primitivos do DS (RadioGroup/Input/Textarea/Label) — zero dep nova; a11y (radiogroup via aria-labelledby, aria-required/describedby) + axe (M12 T2.0)
- Tipos de annotation config (`AnnotationConfig` union discriminada: `AnnotationCategoricalConfig`/`AnnotationContinuousConfig`/`AnnotationFreeformConfig` + `CategoricalOption`) e type guards `isCategoricalConfig`/`isContinuousConfig`/`isFreeformConfig` (M12 T1.0)

## [0.25.0] - 2026-07-15

### Added
- `PercentileChart` composite — p50/p95/p99 por bucket temporal como BANDAS sombreadas (área p50–p95 + p95–p99 mais clara + linha p50) em SVG puro; leitura instantânea de spread (upgrade do overlay de 3 linhas, padrão phoenix); reusa `linScale`/`niceMax`/`seriesPath` do TrendChart — zero dep nova (M11 T3.0)
- `Histogram` composite — distribuição de valores numéricos em barras SVG puras (aceita `bins` pré-computados OU `values`+`binCount` binado client-side via `computeHistogram`; altura via `niceMax`; empty state honesto; tabela sr-only para paridade a11y; reusa `linScale`/`niceMax` do TrendChart — zero dep nova) (M11 T2.0)
- `computeHistogram(values, binCount)` helper puro em `src/lib/chart` — distribui valores numéricos em bins de largura igual (count por bin; não-finitos filtrados; range degenerado colapsa em 1 bin; borda superior inclusiva no último bin) (M11 T1.0)

### Fixed
- `PercentileChart` — percentil ausente (não-finito) agora vira gap honesto (bandas quebram em sub-bandas contíguas de pontos finitos) em vez de emitir `NaN` no path SVG; tabela sr-only mostra `—` (M11 review M-1)

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
