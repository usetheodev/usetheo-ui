# Review: analytics-timeseries (M11) — library phase

**Date:** 2026-07-15
**Reviewer:** 1 agente consolidado (qualidade + wiring + correção). Diff M11 é lib-only (2 composites + chart-core); a fase cross-repo de adoção no lens acontece pós-release (precedente M7/M8/M9).
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER, 0 HIGH. O único MEDIUM (M-1) foi corrigido in-cycle.

## Escopo

Fase de biblioteca do M11: `src/lib/chart/histogram.ts` (`computeHistogram` + `HistogramBin`) + `Histogram` (barras SVG) + `PercentileChart` (bandas p50/p95/p99), stories, testes, registry. A adoção nos dashboards do theo-lens é a fase pós-release.

## Achados e resolução

### MEDIUM

| ID | Achado | Resolução |
|---|---|---|
| M-1 | **Honestidade/correção:** `bandPath` (percentile-chart.tsx) NÃO filtrava valores não-finitos — um p50/p95/p99 ausente (`NaN`) emitia o token literal `NaN` no atributo `d` do SVG. Pela gramática SVG isso é erro → o browser trunca/descarta o path silenciosamente (a banda some em vez de mostrar gap honesto). O irmão `seriesPath` (reusado do M3) JÁ filtra não-finitos, então a linha p50 fazia a ponte honesta mas as bandas não — inconsistência interna. O plano T3.0 ("Deep Dives: bucket com percentil ausente → gap honesto") e o blueprint prometem gap honesto; não havia teste para bucket com NaN. | **CORRIGIDO** — `bandPath` agora quebra em sub-bandas contíguas por runs de índices onde upper E lower são finitos (paridade com `seriesPath`); cada run vira um subpath fechado. Tabela sr-only mostra `—` para percentil ausente (padrão TrendChart M3, linha 236). +2 regressões: (a) path sem `NaN` + bandas finitas ainda renderizam; (b) célula `—` na tabela. commit `59a29bed`. |

### LOW (aceitos com nota)

- L-1: PercentileChart com 1 bucket renderiza sliver invisível (x-domain colapsa). Honesto (sem NaN), mas invisível — o TrendChart desenha markers p/ séries esparsas (lição M76). Aceito: percentil-sobre-tempo com 1 bucket é entrada degenerada rara; a tabela sr-only ainda carrega o dado.

### INFO (verificado-correto)

- I-1: dados invertidos (p99 < p95) produzem polígono fechado honesto que reflete fielmente o input flipado — sem NaN/garbage. Correto.
- I-2: boilerplate de scaffold SVG (VIEW_W/PAD, baseline, labels de eixo, empty-state) repete entre histogram/percentile-chart/trend-chart — é duplicação PRESENTACIONAL, não de lógica de negócio (Rule 12); a lógica real é reusada (`linScale`/`niceMax`/`seriesPath`) ou genuinamente distinta (binning vs geometria de banda). Extrair `ChartFrame` agora seria YAGNI. Sem ação. **Não é a classe do M-1 do M9** (aquele era cálculo de janela duplicado).

## Gates (re-run pós-fix M-1)

- **Subset M11: 31/31** (chart 8 + histogram 11 + percentile-chart 12)
- **Full suite da lib: 1101/1101** (pré-fix; o fix M-1 só adicionou 2 testes verdes ao subset)
- **typecheck 0 · lint 0** (1 warning pré-existente `span-tree.tsx:90`, não-M11) · **format limpo**
- **registry:validate PASS (82 itens)** — 3 novos descriptors (chart lib + 2 componentes)
- **build ESM** ok (287 KB)
- **Zero dep nova confirmado** — `package.json` dependencies inalterado; reuso de `linScale`/`niceMax`/`seriesPath` do M3
- **Wiring triad:** (a) caller = stories + testes; (b) integração = *.test.tsx (+ teste de identidade do barrel); (c) observabilidade = `data-slot` rico (`histogram-bar`/`percentile-band`/`percentile-p50-line`/…) + `data-count`/`data-band`
- **A11y:** role="img" + tabela sr-only nos 2; axe verde (rodado, não só afirmado) incl. empty states
- **computeHistogram edge cases** verificados corretos (não só verdes): vazio, todos-iguais (span=0→1 bin), não-finitos filtrados, binCount≤0, max-no-último-bin (clamp `min(n-1, floor)`)
- **Union discriminada** `HistogramData` (bins XOR values+binCount) — sound (as 3 formas inválidas erram, as 2 válidas compilam)

## Handoff decision

**READY_TO_MERGE** para o release da biblioteca. A adoção no theo-lens (dashboards: histograma de duração + banda de percentil, migrando o overlay de 3 linhas) + north-star completam pós-merge, contra a versão publicada — sequência release→adoção→bump (M7/M8/M9).
