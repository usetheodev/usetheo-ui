---
slug: analytics-timeseries
milestone_id: M11
created_at: 2026-07-15
goal: Publicar Histogram + PercentileChart (SVG puro, reusando os helpers de escala do TrendChart) + o helper computeHistogram no @usetheo/ui, e adotá-los nos dashboards do theo-lens (distribuição de duração + banda de percentil), com zero dependência nova de chart.
---

# Plan: Analytics time-series SOTA (M11)

> **Version 1.0** — Executa o blueprint do M11 (`.claude/knowledge-base/discoveries/blueprints/analytics-timeseries-blueprint.md` — SHIPPABLE): SVG puro reusando `linScale`/`niceMax`/`seriesPath` do TrendChart (M3, ADR D1 do blueprint), backend adotável confirmado no discover (`/observability` já dá `LatencyBucket{p50,p95,p99}`; traces-list dá `durationMs`). Zero dep nova de chart.

## Goal

Fechar o gap de analytics SOTA: promover `Histogram` (distribuição — gap net-new) + `PercentileChart` (banda — upgrade do overlay de 3 linhas) ao DS e adotá-los nos dashboards do lens.

## Context

ROADMAP § M11 (V2, gap P0). Blueprint SHIPPABLE. O lens já sobrepõe p50/p95/p99 em 3 linhas (M3); o backend já retorna os buckets de percentil e a traces-list dá durações crus (binável).

## Baseline Context (deep review of current state)

### Files that will be touched

**Lib @ `a5f35e25` (v0.24.0, develop).** Novos: `src/lib/chart/histogram.ts` (+teste), `src/components/composites/{histogram,percentile-chart}/*`, `registry/*` (gerados). Editados: `src/index.ts`, `CHANGELOG.md`. Reusa (M3): `src/components/composites/trend-chart/trend-chart.tsx` (`linScale`, `niceMax`, `seriesPath` — já exportados).

| Arquivo reusado | Papel no M11 |
|---|---|
| `src/components/composites/trend-chart/trend-chart.tsx` | `linScale`/`niceMax`/`seriesPath` (escala/eixo SVG) |
| `src/lib/cn.ts`, `Badge` | composição |

**Lens (consumidor) @ theo-cloud develop, `dashboard/src/`:**

| Arquivo | Papel |
|---|---|
| `components/lens/lens-series.ts` (`LatencyBucket{p50Ms,p95Ms,p99Ms}`) | fonte do `PercentileBucket` (mapper local) |
| `pages/lens/dashboards.tsx` + `dashboards/widgets.ts` | adota: banda de percentil + histograma de duração |
| `pages/lens/traces/columns.tsx` (`durationMs`) | fonte dos valores do histograma |

### Current callers / dependents

Hoje ZERO callers na lib (componentes novos). Pós-adoção: `dashboard/src/pages/lens/dashboards.tsx`. Dependents internos: nenhum entre os 2 componentes; ambos reusam os helpers do trend-chart (M3).

### Domain glossary

**Glossário:** histograma = distribuição de valores em bins de largura igual (count por bin); percentil (p50/p95/p99) = valor abaixo do qual caem 50/95/99% das observações; banda = área sombreada entre percentis (leitura de spread).

### Architecture boundaries affected

**Fronteira (herdada M8/M9):** a lib recebe DADOS via props e expõe callbacks; fetch/agregação-de-fonte ficam no consumidor. `computeHistogram` é puro.

## Prior Art & Related Work

- Blueprint do M11 (`.claude/knowledge-base/discoveries/blueprints/analytics-timeseries-blueprint.md`): contratos + ADRs D1/D2/D3.
- Gap analysis (`.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`): analytics é gap P0.
- TrendChart M3 (`src/components/composites/trend-chart/trend-chart.tsx`): helpers de escala reusados (DRY).
- Playbook de adoção M7/M8/M9.

## Objective

- [ ] `Histogram` + `PercentileChart` + `computeHistogram` exportados, cada componente com stories (+axe), testes e registry válido
- [ ] Suíte da lib 100% verde; typecheck/lint/format limpos; `registry:validate` PASS
- [ ] Lens: dashboards com histograma de duração + banda de percentil; suíte do dashboard verde
- [ ] Delta north-star registrado
- [ ] Zero dependência nova de chart (`package.json` da lib inalterado em `dependencies`)

## Dependencies

Nenhuma dependência NOVA (Rule 9 por reuso — rung 4 da parsimony; ADR anti-chart-lib do M3 mantido). Deps tocadas (já instaladas):

| Dependência | Versão | Uso | Rule 9 |
|---|---|---|---|
| `react`/`react-dom` | peer `^18 \|\| ^19` | runtime | — |
| (dev) `vitest`, `@testing-library/react`, `axe-core` | lockfile | testes + a11y | — |

Nenhum manifesto alterado → `/deps-audit` plan-bound confirma ausência de dep nova.

## ADRs

### D1 — SVG puro reusando os helpers do TrendChart (M3)

**Decision:** ambos reusam `linScale`/`niceMax`/`seriesPath` de `trend-chart.tsx`; zero lib de chart.

**Rationale:** DRY + ADR anti-chart-lib do M3 mantido. Alternativas: recharts/visx (rejeitada — quebra ADR + registry); helpers próprios (rejeitada — duplica escala do M3).

### D2 — `computeHistogram` em `src/lib/chart/` (novo módulo puro)

**Decision:** helper puro `computeHistogram(values, binCount)` em `src/lib/chart/histogram.ts`; tipo `HistogramBin`.

**Rationale:** binning é lógica pura testável isolada, distinta de escala (que fica no trend-chart). Alternativa: pôr no trend-chart (rejeitada — SRP; histograma não é série temporal).

### D3 — Componentes aceitam dados brutos OU pré-computados

**Decision:** `Histogram` aceita `bins` OU `values`+`binCount`; `PercentileChart` aceita `PercentileBucket[]`. Controlados, sem fetch.

**Rationale:** fronteira DS. Alternativa: só bins pré-computados (rejeitada — o consumidor teria de binar; melhor o DS oferecer os dois).

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| PercentileChart pode parecer duplicar o TrendChart (3 linhas já existem) | Medium | ADR D2 do blueprint: a banda sombreada é o delta SOTA (phoenix), não 3 linhas; o lens MIGRA o overlay p/ a banda | Claude |
| Histogram com muitos bins fica pesado em SVG | Low | `binCount` default modesto (ex. 20); bins são barras simples (não path complexo) | Claude |
| Valores não-finitos (NaN/Infinity) nos dados | Low | `computeHistogram` filtra não-finitos (herda o padrão `Number.isFinite` do trace-core) | Claude |
| Adoção cross-repo esbarra em WIP do dashboard | Low | commits por path explícito (precedente M7/M8/M9) | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
F1: T1.0 computeHistogram (puro)
F2: T2.0 Histogram        (F1, reusa linScale/niceMax do M3)
F3: T3.0 PercentileChart  (reusa linScale/seriesPath do M3)
F4: T4.0 registry+release-prep  (F2, F3)
F5: T5.0 adoção lens (dashboards) + north-star  (F4 released)
```

## Phase 1: Fundação (lib)

### T1.0 — `computeHistogram` puro

#### Objective
`src/lib/chart/histogram.ts`: `computeHistogram(values: number[], binCount: number) → HistogramBin[]` — bins de largura igual sobre [min,max], count por bin; puro, total.

#### Why this step (action + reasoning — ReAct discipline)
O Histogram consome os bins; travar o binning honesto primeiro (edge: vazio, todos iguais, não-finitos) elimina retrabalho.

#### Evidence
Blueprint (`.claude/knowledge-base/discoveries/blueprints/analytics-timeseries-blueprint.md` — Corner 4 Q1). Langfuse `NumericScoreHistogram` (binning).

#### Files to edit
- `src/lib/chart/histogram.ts`, `src/lib/chart/index.ts` (novos), `src/lib/chart/histogram.test.ts` (novo)
- `src/index.ts` (exports)

#### Deep file dependency analysis
Sem imports de `src/components/**` (camada pura — grep no AC). Sem dep externa.

#### Deep Dives
Lista vazia → []; todos os valores iguais → 1 bin com count=todos (largura zero tratada); não-finitos filtrados; binCount ≤ 0 → [].

#### Tasks
1. RED: testes de binning (distribuição, vazio, valores iguais, não-finitos, count total = nº de finitos).
2. GREEN: helper + tipo.
3. REFACTOR + barrel.

#### TDD
- `test_computeHistogram_distribui_em_bins_iguais` — `expect(computeHistogram([0,1,2,3,4,5,6,7,8,9], 5).map(b=>b.count)).toEqual([2,2,2,2,2])`
- `test_computeHistogram_count_total_e_numero_de_finitos` — `expect(sum(bins.map(b=>b.count))).toBe(10)`
- `test_computeHistogram_lista_vazia_retorna_vazio` — `expect(computeHistogram([], 5)).toEqual([])`
- `test_computeHistogram_filtra_nao_finitos` — `expect(sum(computeHistogram([1,NaN,Infinity,2],4).map(b=>b.count))).toBe(2)`
- `test_computeHistogram_valores_iguais_um_bin` — `expect(computeHistogram([5,5,5],4).reduce((a,b)=>a+b.count,0)).toBe(3)`
- Negativo: `test_computeHistogram_binCount_invalido_retorna_vazio` — `expect(computeHistogram([1,2,3],0)).toEqual([])`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/lib/chart` → 0 failed
- `grep -rn "from \"../../components\|from '@/components" src/lib/chart/` → 0 hits (camada pura)
- `pnpm typecheck` → exit 0

#### DoD
Exportado no barrel; testes verdes; CHANGELOG `[Unreleased] § Added`.

## Phase 2: Histogram

### T2.0 — `Histogram` composite

#### Objective
`src/components/composites/histogram/`: barras SVG (largura=bin, altura=count via `linScale`/`niceMax`); aceita `bins` OU `values`+`binCount`; a11y (`role="img"` + tabela sr-only). Formatter de eixo opcional.

#### Why this step (action + reasoning)
Consome a fundação F1 e reusa a escala do M3; é o gap net-new (distribuição).

#### Evidence
Blueprint (Corner 4 Q1; ADR D1/D3). Langfuse `NumericScoreHistogram` (padrão, não código).

#### Files to edit
- `src/components/composites/histogram/{histogram.tsx,index.ts,histogram.test.tsx,histogram.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/chart/histogram.ts` + `linScale`/`niceMax` do trend-chart + cn; não importa percentile-chart.

#### Deep Dives
Bin vazio = barra de altura 0 (honesto); distribuição vazia → empty state; a tabela sr-only lista lo–hi:count por bin.

#### Tasks
1. RED: testes (uma barra por bin, altura proporcional ao count, values+binCount = mesma coisa que bins, empty, a11y).
2. GREEN. 3. REFACTOR. 4. WIRING: story + axe.

#### TDD
- `test_renderiza_uma_barra_por_bin` — `expect(container.querySelectorAll('[data-slot="histogram-bar"]')).toHaveLength(5)`
- `test_altura_proporcional_ao_count` — a barra do bin mais alto tem maior height (`rect` height)
- `test_values_e_binCount_equivale_a_bins` — mesma contagem de barras via `values`+`binCount` e via `bins`
- `test_role_img_com_label` — `expect(screen.getByRole("img", {name: /distribution/i})).toBeInTheDocument()`
- Negativo: `test_distribuicao_vazia_mostra_empty` — `expect(screen.getByText(/no data/i)).toBeInTheDocument()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/histogram` → 0 failed (inclui `expect(await axe(container)).toHaveNoViolations()`)
- `pnpm typecheck` → exit 0

#### DoD
Barrel + CHANGELOG.

## Phase 3: PercentileChart

### T3.0 — `PercentileChart` composite

#### Objective
`src/components/composites/percentile-chart/`: bandas sombreadas p50–p95–p99 por bucket temporal (área entre percentis) + linha p50; reusa `linScale`/`seriesPath`; a11y (`role="img"` + tabela sr-only). Formatter de eixo.

#### Why this step (action + reasoning)
É o upgrade SOTA (banda vs 3 linhas); reusa a escala do M3.

#### Evidence
Blueprint (Corner 4 Q2; ADR D1/D2). Phoenix `TraceLatencyPercentilesTimeSeries` (banda, padrão).

#### Files to edit
- `src/components/composites/percentile-chart/{percentile-chart.tsx,index.ts,percentile-chart.test.tsx,percentile-chart.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `linScale`/`niceMax`/`seriesPath` do trend-chart + cn; não importa histogram.

#### Deep Dives
Banda = `<path>` de área (p50→p95 preenchido, p95→p99 mais claro); bucket com percentil ausente → gap honesto; lista vazia → empty state.

#### Tasks
1. RED: testes (bandas renderizadas, linha p50, empty, a11y, mais claro no p99).
2. GREEN. 3. REFACTOR. 4. WIRING: story + axe.

#### TDD
- `test_renderiza_bandas_p50_p95_p99` — `expect(container.querySelectorAll('[data-slot="percentile-band"]')).toHaveLength(2)` (p50–p95, p95–p99)
- `test_renderiza_linha_p50` — `expect(container.querySelector('[data-slot="percentile-p50-line"]')).toBeInTheDocument()`
- `test_role_img_com_label` — `expect(screen.getByRole("img", {name: /percentile/i})).toBeInTheDocument()`
- Negativo: `test_buckets_vazios_mostra_empty` — `expect(screen.getByText(/no data/i)).toBeInTheDocument()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/percentile-chart` → 0 failed (inclui axe assert)
- `python3 .claude/skills/implement/scripts/mini_review.py analytics-timeseries --phase 3` → PHASE_REVIEW_PASS OR gates diretos verdes

#### DoD
Barrel + CHANGELOG.

## Phase 4: Registry + release da lib

### T4.0 — Registry + full gates

#### Objective
Itens de registry: `chart-core` (registry:lib, `computeHistogram`) + `histogram` + `percentile-chart`; `registry:build`+`validate` verdes; full suite/typecheck/lint/format.

#### Why this step (action + reasoning)
DoD padrão exige registry válido por componente.

#### Evidence
Precedente M8/M9 (registry descriptor-driven).

#### Files to edit
- `registry/{chart-core,histogram,percentile-chart}.json` (novos) → `pnpm registry:build`

#### Deep file dependency analysis
`histogram` depende de `chart-core`, `trend-chart`, `cn`, `tailwind-preset`; `percentile-chart` de `trend-chart`, `cn`, `tailwind-preset`.

#### Tasks
1. RED: `registry:validate` como oráculo. 2. GREEN: descriptors + build. 3. Full gates.

#### TDD
- Oráculo: `pnpm registry:build && pnpm registry:validate` → exit 0
- `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check` → todos exit 0

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm registry:validate` → exit 0
- Full suite verde

#### DoD
Pronto para `/code-quality` + `/review` + `/release`.

## Phase 5: Adoção no lens + north-star

### T5.0 — Dashboards com histograma + banda + north-star

#### Objective
No theo-cloud develop: bump da lib; nos dashboards do lens, adicionar um widget de histograma de duração (bina `durationMs` da traces-list via `computeHistogram`) e migrar o overlay de latência de 3 linhas para `PercentileChart` (banda) sobre o `LatencyBucket[]` do `/observability`; suíte do dashboard verde; north-star registrado.

#### Why this step (action + reasoning)
O DoD do M11 é os charts adotados com dados reais (prova material), não só publicados.

#### Evidence
DoD do ROADMAP § M11; contrato `/observability` + `LatencyBucket` (`components/lens/lens-series.ts`); traces-list `durationMs`.

#### Files to edit
(cross-repo) `dashboard/`: `package.json`, `pages/lens/dashboards.tsx` + `dashboards/widgets.ts` (histograma + banda), mapper `LatencyBucket → PercentileBucket`, testes co-locados.

#### Deep file dependency analysis
`PercentileBucket` mapeado de `LatencyBucket{p50Ms,p95Ms,p99Ms}`; histograma binado de `durationMs`.

#### Deep Dives
Séries vazias → empty honesto (o lens já faz isso p/ percentil sobre série vazia — "—", não 0); a migração 3-linhas→banda preserva os data-testids que a suíte do dashboard cobre.

#### Tasks
1. Bump + install + typecheck. 2. widget histograma + migração banda. 3. Testes de integração. 4. Full suite verde.

#### TDD
- Oráculo: `cd dashboard && pnpm vitest run src/pages/lens/dashboards` → 0 failed
- `test_dashboard_renderiza_histograma_de_duracao` — widget histograma presente com barras
- `test_latencia_usa_banda_de_percentil` — `[data-slot="percentile-band"]` presente (migração da 3-linhas)

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `cd dashboard && pnpm vitest run` → 0 failed (suíte completa)
- Audit north-star em `.claude/knowledge-base/audits/` com números literais

#### DoD
Commits pushed; WIP alheio intocado; north-star registrado.

## Coverage Matrix

| Claim do Goal / DoD | Tasks |
|---|---|
| computeHistogram puro | T1.0 |
| Histogram publicado (stories+axe+testes) | T2.0 |
| PercentileChart publicado (banda) | T3.0 |
| Registry válido por componente | T4.0 |
| Lens: dashboards com histograma + banda adotados | T5.0 |
| North-star delta registrado | T5.0 |
| Zero dependência nova de chart | T1.0, T4.0 (ACs com grep/package.json) |

**Coverage: 100% — todo claim mapeado em task explícita (T1.0, T2.0, T3.0, T4.0, T5.0).**

## Global Definition of Done

- [ ] `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm registry:validate` → todos exit 0
- [ ] `git diff v0.24.0..HEAD -- package.json | grep '"dependencies"' -A5` sem linha nova de dep
- [ ] Suíte do dashboard 100% verde pós-adoção; north-star no audit
- [ ] CHANGELOG `[Unreleased]` com as entradas
- [ ] `/code-quality` ∈ {PASS, PASS_WITH_CAVEATS} e `/review` READY_TO_MERGE antes do `/release`

## Failure scenarios (when I/O external)

(none — no external I/O touched: componentes recebem dados via props; o fetch das séries fica no consumidor, que já trata erro/empty via os padrões da dashboards page)

## Critical paths (para mutation testing, se rodar)

`src/lib/chart/histogram.ts` — o binning (distribuição, edges de vazio/iguais/não-finitos) é onde mutantes sobrevivem silenciosamente.

## Final Phase: Integration Validation (MANDATORY)

1. Ladle: as 2 stories novas renderizam com o tema (visual + axe addon).
2. `pnpm build` + `pnpm registry:build` limpos.
3. Dashboard: fluxo dashboards com histograma + banda manualmente no dev server contra fixtures.
4. Wiring triad por componente: caller real (lens dashboards), teste de integração (suíte do lens), métrica de runtime (data-slot presente).
