# Blueprint: Analytics time-series SOTA (M11)

> Contratos de `Histogram` + `PercentileChart` validados contra 2 fontes (langfuse `NumericScoreHistogram` + `LatencyChart` MIT, phoenix `TraceLatencyPercentilesTimeSeries` ⚠️ ELv2 study-only) + o contrato REAL do theo-lens (backend já retorna `LatencyBucket{p50,p95,p99}` + traces-list com `durationMs`). SVG puro — reusa `linScale`/`niceMax` do TrendChart (M3); zero dep nova de chart.

**Slug:** `analytics-timeseries` · **Date:** 2026-07-15

## Context

ROADMAP § M11 (V2, gap P0). Gap analysis: analytics é gap de profundidade — Langfuse tem widget library completa (histograma incluso). **Backend adotável confirmado no discover.**

## Objective

Fixar contratos de 2 componentes SVG-puros + os helpers puros que os alimentam.

## Coverage Corner 1 — Integration Tests

Componentes puros/controlados (dados via props). Testes: `computeHistogram` (binning honesto) + render de barras/bandas + axe. Fixtures: arrays de valores numéricos; buckets de percentil.

## Coverage Corner 2 — Dependencies

**Tipos:**
```ts
interface HistogramBin { lo: number; hi: number; count: number; }
interface PercentileBucket { p50: number; p95: number; p99: number; label?: string; }
```

**Zero dep nova** — reusa `linScale`/`niceMax`/`seriesPath` de `src/components/composites/trend-chart/trend-chart.tsx` (M3, já exportados). SVG nativo. `computeHistogram(values, binCount)` puro em `src/lib/chart/histogram.ts`.

## Coverage Corner 3 — Tools

**A11y:** ambos SVG com `role="img"` + `<title>`/`aria-label` + tabela sr-only de dados (padrão do TrendChart M3). axe por story.
**North-star:** +2 componentes + `computeHistogram` helper.

## Coverage Corner 4 — Techniques

- **Histogram (Q1):** distribui valores numéricos em N bins (`computeHistogram` puro — bins de largura igual sobre [min,max], count por bin; bin vazio = 0 honesto; lista vazia = []). Renderiza barras SVG (largura = bin, altura = count via `linScale`/`niceMax`). Langfuse `NumericScoreHistogram` faz binning + barras; nós idem, SVG puro. Adoção: distribuição de `durationMs` da traces-list.
- **PercentileChart (Q2):** p50/p95/p99 por bucket temporal como BANDAS sombreadas (área p50–p95 e p95–p99) + linha p50. Phoenix `TraceLatencyPercentilesTimeSeries` usa banda; o lens hoje usa 3 LINHAS planas no TrendChart — o upgrade é a banda (leitura de spread instantânea). Reusa `linScale`. Adoção: o `LatencyBucket[]` que o `/observability` já retorna.

## ADRs

### D1 — SVG puro reusando os helpers do TrendChart (M3)

**Decision:** `Histogram`/`PercentileChart` reusam `linScale`/`niceMax`/`seriesPath` exportados pelo `trend-chart.tsx`; zero lib de chart (ADR anti-chart-lib do M3 mantido).

**Rationale:** DRY + zero dep (rung 4 parsimony). Alternativas: recharts/visx (rejeitada — quebra o ADR do M3 + registry copy-pasteable); helpers próprios (rejeitada — duplicaria a escala do M3).

### D2 — PercentileChart é upgrade (banda), não duplica o TrendChart

**Decision:** `PercentileChart` renderiza BANDAS sombreadas p50–p95–p99 (não 3 linhas). O lens migra do overlay de 3 linhas atual para a banda.

**Rationale:** o valor SOTA é a leitura instantânea do spread (phoenix); 3 linhas planas via TrendChart já existem — a banda é o delta real, não YAGNI. Alternativa: manter 3 linhas (rejeitada — não fecha o gap phoenix).

### D3 — Histogram bina client-side; consumidor passa valores OU bins

**Decision:** `computeHistogram(values, binCount)` puro exportado; `Histogram` aceita `bins: HistogramBin[]` (pré-computados) OU `values: number[]` + `binCount`.

**Rationale:** fronteira DS (dados via props). O backend não expõe distribuição pré-binada; a traces-list dá `durationMs` cru → bina client-side. Alternativa: exigir endpoint de distribuição (rejeitada — backend-heavy, e o binning client-side sobre uma página de traces basta).

## Recommendations

`/to-plan analytics-timeseries`: Fase 1 `computeHistogram` puro (TDD); Fase 2 Histogram; Fase 3 PercentileChart; Fase 4 registry+release; Fase 5 adoção no lens (dashboards: histograma de duração + banda de percentil, migrando o overlay de 3 linhas).

## Blocked questions

(none)

## Related

- Gap analysis: `.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`
- TrendChart M3 reusado: `src/components/composites/trend-chart/trend-chart.tsx` (`linScale`/`niceMax`/`seriesPath`)
- Contrato lens: `LatencyBucket{p50Ms,p95Ms,p99Ms}` (`components/lens/lens-series.ts`)
