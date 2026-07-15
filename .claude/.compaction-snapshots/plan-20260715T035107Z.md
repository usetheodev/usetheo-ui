---
slug: trendchart-promotion
milestone_id: M3
created_at: 2026-07-15
goal: Ship o composite TrendChart portando o metric-trend-chart do dashboard (SVG puro) com API generalizada, 13 testes portados e registry.
---

# Plan: TrendChart — promoção do dashboard (M3)

> **Version 1.1** (absorve EC-1; 16→17 testes) — Porta o `metric-trend-chart.tsx` do dashboard (191 LoC, produção com lições M51/M76/M90) para o composite `TrendChart` da lib, com os deltas mínimos do blueprint D1 (nome, tokens, data-slot, `valueFormatter`, forwardRef), os 13 testes de comportamento portados + DoD padrão (axe, stories incl. caso theo-rag p50/p95, registry). Zero dependências.

## Goal

Enable os consumidores do `@usetheo/ui` a plotar séries temporais multi-série acessíveis com `TrendChart`, measured by `pnpm vitest run src/components/composites/trend-chart/` verde (≥ 16 testes, axe zero violations) e `pnpm registry:validate` com a entry `trend-chart` (66 itens).

## Context

ROADMAP § M3 (deps M0 ✅). Blueprint (`trendchart-promotion`, 89): porte fiel com generalização mínima (ADR D1); fonte lida integralmente + 13 testes do dashboard como base do RED; vocabulário `valueFormatter` do tremor adotado; zero chart lib (ADR D2). Fonte de seed: `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/lens/metric-trend-chart.tsx` (mesma família; seed interno como o bootstrap da lib).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/composites/trend-chart/trend-chart.tsx` (NEW) | 0 | — | (a criar — porte) | — |
| `src/components/composites/trend-chart/trend-chart.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/composites/trend-chart/trend-chart.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/composites/trend-chart/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 170 | `68c1dc2e` | Barrel (59 componentes pós-M2) | Aditivo only |
| `registry/trend-chart.json` (NEW) / `registry/index.json` | 406 | `977d3bef` | Índice (65 itens) | Aditivo; ordem alfabética |
| `CHANGELOG.md` | 91 | `2c662976` | `[Unreleased]` vazio pós-0.18.0 | Released intocadas |

Fonte de seed (leitura, fora do repo): dashboard `metric-trend-chart.tsx` (191 LoC) + `metric-trend-chart.test.tsx` (13 testes) — lidos integralmente 2026-07-15.

### Current callers / dependents

- **Symbol:** `TrendChart` (NEW) — zero callers; pós-plano: barrel + stories + registry. Callers do original no dashboard (5 arquivos) migram no M7 (Tier 2 § adoção).
- **Symbol:** `cn` — consumido.

### Domain glossary

- **série esparsa (M76/O-2)** — < 5 pontos: cada ponto ganha marker (linha de 2-4 pontos lê como penhasco sem eles).
- **eixo M90** — a tabela a11y usa a UNIÃO ordenada dos x de todas as séries; célula por lookup (gap = "—") — nunca posicional.
- **valueFormatter** — `(v: number) => string` para eixo Y e células (vocabulário tremor).

### Architecture boundaries affected

Nenhuma (apresentação pura, stateless — sem hooks, sem "use client"). +1 export.

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/trendchart-promotion-blueprint.md` — anatomia integral, deltas D1, porte de testes (Corner 1), registry (Corner 3).
- **Reference projects:** `.claude/knowledge-base/references/tremor/src/components/LineChart/LineChart.tsx:147,371-381` (vocabulário valueFormatter — adotado; engine Recharts — rejeitado).
- **Fonte de seed (consumer/família):** dashboard `metric-trend-chart.tsx` + testes (paths absolutos; ADR D3 da família).
- **Patterns skills:** (nenhuma — verificado).

## Objective

- [ ] `TrendChart` portado com deltas D1 (nome, tokens, data-slots, `valueFormatter`, forwardRef); helpers puros `linScale/niceMax/seriesPath` exportados.
- [ ] 17 testes: 13 portados (+EC-1) (helpers, path-por-série, M90, empty, single-bucket dot, M76 sparse/dense, tabela a11y) + data-slots + forwardRef + axe.
- [ ] 3 stories (RagLatency p50/p95 com formatter ms; MultiSeries; Empty) + smoke.
- [ ] Barrel + `registry/trend-chart.json`; validate 66 itens; CHANGELOG.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| (nenhuma além de react/cn) | — | — | SVG puro (blueprint Corner 2; ADR D2 da lib) |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| (none) | — | — | Recharts/visx/tremor avaliados e rejeitados (ADR D2 — registry copy-pasteable) | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — Porte fiel com generalização mínima

**Decision:** portar componente+helpers+testes 1:1 com apenas os deltas do blueprint (nome `TrendChart`, `data-testid`→`data-slot`, tokens de texto da lib no figcaption/legend, `yFormat`→`valueFormatter`, forwardRef+displayName).

**Rationale:** blueprint D1 — código com lições de produção pinadas por teste (M51/M76/M90); mudar além disso é YAGNI e re-trabalho no M7 (adoção).

**Alternatives considered:** redesign composicional (rejeitado — verbosidade sem demanda); vocabulário tremor completo data/index/categories (rejeitado — pivotar séries quebra o modelo M90 de séries irregulares).

**Consequences:** migração do dashboard no M7 = import + rename de prop + data-slot (mecânica).

### D2 — Zero chart lib (reafirmação do ADR da lib)

**Decision:** SVG puro. **Rationale:** registry copy-pasteable; tremor evidencia o custo (Recharts). **Alternatives:** Recharts/visx (rejeitados). **Consequences:** novos tipos de gráfico = novos componentes.

### D3 — Wiring triad herdado (precedente dos planos M0-M2)

**Decision:** (a) caller = barrel+stories+registry inline; (b) integration = testes de composição co-localizados; (c) métrica = data-slot assertado no DOM.

**Rationale:** biblioteca de UI sem telemetria de ops; mesma adaptação aprovada em 3 reviews consecutivos (READY_TO_MERGE em M0, M1 e M2).

**Alternatives considered:** exigir tests/integration/ dedicado (rejeitado — não existe na lib; falso negativo de ferramenta registrado como followup #5 do kit); dispensar o pilar (rejeitado — viola cycle-implement).

**Consequences:** check_wiring pillar b segue FAIL de ferramenta, coberto por este ADR.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| `color` por série é CSS livre (não token) — consumidor pode furar a paleta | Low | JSDoc recomenda `var(--chart-*)`/tokens; sem enforcement (paridade com a fonte) | Claude |
| Divergência futura entre o original do dashboard e o porte até o M7 | Medium | M7 substitui o original (deleção); até lá, mudanças no original são raras (código estável desde M51) | Paulo |
| SVG `text-[10px]` arbitrário nos eixos | Low | Aceito (texto interno de SVG; tokens aplicados fora do SVG) — documentado | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
Phase 1 (T1.1 porte+testes → T1.2 stories) → Phase 2 (T2.1 barrel → T2.2 registry; T2.3 changelog ∥) → Final Validation
```

## Phase 1: Porte (TDD)

**Objective:** TrendChart portado com 16 comportamentos pinados.

### T1.1 — TrendChart port com TDD completo

#### Objective
`trend-chart.tsx` (+ index) com helpers exportados e os deltas D1.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** escreve `trend-chart.test.tsx` RED (16 testes — 13 portados da fonte + 3 da lib), porta o componente (GREEN), refactor tokens.
2. **Why now:** é o milestone inteiro em um componente; o RED portado garante paridade de comportamento com a produção (blueprint Corner 1). Cita D1/D3.

#### Evidence
Fonte+testes lidos integralmente (blueprint § Corner 1/4, paths absolutos do dashboard); vocabulário: `.claude/knowledge-base/references/tremor/src/components/LineChart/LineChart.tsx:381`.

#### Files to edit
```
src/components/composites/trend-chart/trend-chart.test.tsx — (NEW) RED primeiro
src/components/composites/trend-chart/trend-chart.tsx — (NEW) porte
src/components/composites/trend-chart/index.ts — (NEW)
```

#### Deep file dependency analysis
- `trend-chart.tsx` (NEW): importa só `cn`. Downstream: barrel/registry/stories.
- Teste: helpers de fixture (série builder) — lição do quality hook.

#### Deep Dives
- Deltas D1 aplicados no porte (lista do blueprint § Generalização); todo o resto byte-fiel (incl. comentários M76/M90 — são documentação de lição).
- Invariants: helpers puros exportados; `SPARSE_MARKER_MAX=5`; tabela sr-only com eixo-união.

#### Pseudo-code / Signatures
```pseudocode
interface TrendPoint { x: number; y: number }
interface TrendSeries { name: string; color: string; points: TrendPoint[] }
interface TrendChartProps { title: string; series: TrendSeries[]; height?: number;
  valueFormatter?: (v: number) => string }  // + HTMLAttributes<HTMLElement> no figure
export { TrendChart, linScale, niceMax, seriesPath }
```

#### Tasks
1. RED (16); 2. GREEN (porte com deltas); 3. REFACTOR tokens.

#### TDD
```
RED: test_linscale_maps_domain_to_range() — porte: linScale(0..10 → 0..100)(5) === 50
RED: test_linscale_zero_width_domain_no_nan() — porte: domínio zero → r0, sem NaN (negative)
RED: test_nicemax_rounds_to_clean_bound() — porte: niceMax ≥ max, potência limpa
RED: test_seriespath_one_coord_per_point() — porte: path M/L com N coords; vazio → ""
RED: test_one_path_per_series() — porte: N séries → N [data-slot=trend-chart-line]
RED: test_a11y_table_uses_shared_period_axis_m90() — porte: séries irregulares lidas por união de x; gap = "—"
RED: test_empty_state_when_no_data() — porte: [data-slot=trend-chart-empty] presente; sem svg
RED: test_single_bucket_series_draws_dot() — porte: 1 ponto → [data-slot=trend-chart-dot]
RED: test_sparse_series_marks_each_point_m76() — porte: 4 pontos → 4 dots
RED: test_dense_series_line_only_m76() — porte: 5+ pontos → 0 dots
RED: test_a11y_table_mirrors_series_values() — porte: células com valueFormatter aplicado
RED: test_value_formatter_applied_to_axis_label() — yMax formatado no eixo (ms case)
RED: test_title_rendered_in_figcaption() — figcaption com o title
RED: test_all_parts_have_data_slot() — trend-chart/-line/-dot/-empty/-table/-legend
RED: test_root_forwards_ref() — ref chega ao <figure>
RED: test_nonfinite_point_does_not_break_path() — EC-1 negative: y NaN no meio da série → path sem "NaN"; célula "—" na tabela
RED: test_axe_no_violations() — axe(chart multi-série + empty) zero violations
GREEN: portar trend-chart.tsx com deltas D1
REFACTOR: tokens (figcaption text-label-caps; legend text-body-sm)
VERIFY: pnpm vitest run src/components/composites/trend-chart/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/composites/trend-chart/` reporta 17 passed / 0 failed
- [ ] `pnpm lint` exit 0; `wc -l` ≤ 500 em `trend-chart.tsx`
- [ ] `grep -c "data-testid" src/components/composites/trend-chart/trend-chart.tsx` == 0 (delta data-slot completo)

#### DoD (Definition of Done)
- [ ] `pnpm vitest run src/components/composites/trend-chart/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T1.2 — Stories

#### Objective
3 stories (RagLatency p50/p95 ms, MultiSeries, Empty) + smoke.

#### Why this step (action + reasoning)
1. **What:** stories CSF + smoke.
2. **Why now:** pilar (a) D3; a story RagLatency é a evidência do caso consumidor do DoD b3. Cita blueprint do M3 (§ Consumer — `.claude/knowledge-base/discoveries/blueprints/trendchart-promotion-blueprint.md`).

#### Evidence
blueprint do M3 (§ Consumer requirements — `.claude/knowledge-base/discoveries/blueprints/trendchart-promotion-blueprint.md`) (rag analytics p50/p95; caso dashboard multi-série).

#### Files to edit
```
src/components/composites/trend-chart/trend-chart.stories.tsx — (NEW)
src/components/composites/trend-chart/trend-chart.test.tsx — +1 smoke
```

#### Deep file dependency analysis
- Stories importam só o componente (dados fixos determinísticos).

#### Deep Dives
(nenhum)

#### Tasks
1. 3 stories; 2. smoke.

#### TDD
```
RED: test_rag_latency_story_renders() — story RagLatency renderiza 2 paths (p50, p95) e formatter "ms" na tabela
VERIFY: pnpm vitest run src/components/composites/trend-chart/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 3 stories

#### DoD
- [ ] `pnpm vitest run src/components/composites/trend-chart/` reporta 17 passed / 0 failed

## Phase 2: Export, registry e docs

**Objective:** superfície pública + registry + CHANGELOG.

### T2.1 — Barrel

#### Objective
Exports (`TrendChart`, tipos, helpers) + smoke de identidade.

#### Why this step (action + reasoning)
1. **What:** RED smoke via barrel → export aditivo.
2. **Why now:** padrão M0-M2; pré-req do registry.

#### Evidence
`src/index.ts` (170 LoC, Baseline); blocos M2 como modelo.

#### Files to edit
```
src/index.ts — aditivo
src/components/composites/trend-chart/trend-chart.test.tsx — +1 smoke barrel
```

#### Deep file dependency analysis
- Barrel aditivo only (invariant).

#### Deep Dives
(nenhum)

#### Tasks
1. RED; 2. GREEN.

#### TDD
```
RED: test_barrel_exports_trend_chart() — identidade via "../../../index.js"
VERIFY: pnpm test:run && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `git diff src/index.ts` só adições

#### DoD
- [ ] `pnpm test:run` exit 0

### T2.2 — Registry

#### Objective
`registry/trend-chart.json` + entry; validate 66 itens.

#### Why this step (action + reasoning)
1. **What:** entry no index (RED validate) → descriptor (draft do blueprint Corner 3) → build+validate; **build é o ÚLTIMO passo antes do commit final** (lição F-wire-1 M1/M2, agora disciplina).
2. **Why now:** DoD padrão.

#### Evidence
blueprint do M3 (§ Corner 3 — `.claude/knowledge-base/discoveries/blueprints/trendchart-promotion-blueprint.md`); modelos M0-M2.

#### Files to edit
```
registry/trend-chart.json — (NEW)
registry/index.json — +1 entry
```

#### Deep file dependency analysis
- Aditivo; consumido por build/validate.

#### Deep Dives
(nenhum)

#### Tasks
1. Entry (RED); 2. descriptor; 3. build+validate.

#### TDD
```
RED: test_registry_validate_fails_without_descriptor() — entry sem descriptor → `pnpm registry:validate` exit != 0
GREEN: `pnpm registry:build && pnpm registry:validate` exit 0 (66 itens)
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm registry:validate` exit 0 reportando 66 itens

#### DoD
- [ ] `git diff --stat registry/` só adições + regenerações do build

### T2.3 — CHANGELOG

#### Objective
Entry `[Unreleased] § Added`.

#### Why this step (action + reasoning)
1. **What:** entry consumer-facing (Rule 6). 2. **Why now:** ∥ T2.2.

#### Evidence
CHANGELOG (91 LoC, Unreleased vazio — Baseline).

#### Files to edit
```
CHANGELOG.md — § Added
```

#### Deep file dependency analysis
- Aditivo em Unreleased.

#### Deep Dives
(nenhum)

#### Tasks
1. Entry.

#### TDD
```
RED: test_changelog_mentions_trend_chart() — `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém TrendChart (gate documental)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém TrendChart sob § Added

#### DoD
- [ ] `pnpm test:run` exit 0

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | TrendChart multi-série com legend, tooltip nativo (`<title>`), formatters, tabela a11y, zero chart lib (M3 DoD b1) | T1.1 | Porte fiel + valueFormatter |
| 2 | API generalizada sem nomes de domínio lens (M3 DoD b2) | T1.1 | Deltas D1 (rename, data-slot, tokens) — AC pina zero data-testid |
| 3 | Story caso rag p50/p95 + caso dashboard (M3 DoD b3) | T1.2 | RagLatency + MultiSeries + Empty |
| 4 | DoD padrão (testes+axe, story, registry) | T1.1-T2.2 | 18 testes, 3 stories, registry 66 |
| 5 | Zero dep (ADR D2) | T1.1, T2.2 | AC do T1.1 (só cn importado) + descriptor do T2.2 sem dependencies npm; package.json intocado |
| 6 | CHANGELOG (Rule 6) | T2.3 | Entry § Added |

**Coverage: 6/6 gaps covered (100%)**

## Global Definition of Done

- [ ] `pnpm test:run` exit 0 (+18 novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] File-size ≤ 500 LoC por arquivo-fonte
- [ ] `CHANGELOG.md` atualizado (Rule 6)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0 (66 itens) — build como último passo
- [ ] Runtime-metric proof — data-slots assertados (D3)
- [ ] `pnpm build` com TrendChart no dist (`grep -c "TrendChart" dist/index.js` ≥ 1)
- [ ] Plan archived pós-merge

## Failure scenarios (when I/O external)

(none — no external I/O touched)

## Final Phase: Integration Validation (MANDATORY)

### Execution

```
pnpm test:run
pnpm typecheck
pnpm lint
pnpm registry:build && pnpm registry:validate
pnpm build
```

### Acceptance Criteria

- [ ] `pnpm test:run` exit 0 (regressão 59 + novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:validate` exit 0 (66 itens)
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado

### If Validation Fails

1. Plano vs pré-existente; 2. Fix; 3. Re-run; 4. Documentar.
