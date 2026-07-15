# Blueprint: TrendChart — promoção do dashboard (M3)

> **Version 1.0** — Sintetiza a leitura integral da fonte a promover (`metric-trend-chart.tsx` do dashboard, 191 LoC, produção desde M51 com lições M60/M76/M90 embutidas), seus 13 testes de comportamento, o vocabulário de API do tremor (contraponto) e os callers reais — fixando a generalização do `TrendChart` para a lib. Discovery executada inline (fonte é da própria família — leitura direta substitui o halt-loop de referência externa; paths de `references/` citados onde aplicável).

**Slug:** `trendchart-promotion`
**Source plan:** (discovery compacta — este blueprint é o artefato; plano de investigação absorvido: 5 questões respondidas abaixo)
**Owner:** Paulo + Claude
**Generated:** 2026-07-15 via leitura direta + `/discover-execute` inline
**Confidence verdict:** (pending `/discover-confidence`)

## Context

ROADMAP § M3 (deps M0 ✅). Fonte: `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/lens/metric-trend-chart.tsx` (191 LoC; lido integralmente 2026-07-15) — paths do dashboard são consumer/fonte de seed, não `references/` (mesmo ADR D3 dos M0-M2). ADR da lib mantido: zero chart lib (tremor usa Recharts — só o vocabulário interessa).

## Objective

Fixar a API generalizada, o porte dos testes e o registry do `TrendChart` sem incógnitas para o `/to-plan`.

---

## Coverage Corner 1 — Integration Tests

Os 13 testes do dashboard (`metric-trend-chart.test.tsx`, lidos 2026-07-15) portam quase 1:1 — são o RED do porte:

| Comportamento (dashboard) | Porte |
|---|---|
| `linScale` mapeia domínio→range; guarda domínio zero-width (sem NaN) | idêntico (helpers puros exportados) |
| `niceMax` arredonda para bound limpo ≥ max | idêntico |
| `seriesPath` gera polyline com 1 coord por ponto | idêntico |
| 1 `<path>` por série | idêntico |
| **M90**: tabela a11y lê séries irregulares por eixo de período compartilhado (união ordenada de x), não por posição | idêntico — lição de produção crítica |
| Empty-state explícito quando sem dados (não linha zero) | idêntico |
| Dot visível para série de 1 bucket (polyline colapsada seria invisível) | idêntico |
| **M76/O-2**: markers em série esparsa (<5 pontos); densa (≥5) só linha | idêntico |
| Tabela a11y espelha séries (paridade screen-reader) | idêntico |
| + novos da lib: data-slots, axe zero violations, story smoke, tokens (título via prop) | adições padrão do DoD |

## Coverage Corner 2 — Dependencies

**ZERO** — SVG puro (fonte não importa nada além de React; comentário da própria fonte: "No external chart lib — keeps the registry copy-pasteable"). Tremor rejeitado como dep (Recharts) — catálogo M3: "só a interface". Sem `"use client"` necessário? A fonte não tem estado (stateless) — sem hooks → sem diretiva (diferente do JsonViewer).

## Coverage Corner 3 — Tools

Registry draft (modelos M0-M2):

```json
{"name":"trend-chart","type":"registry:ui","title":"TrendChart",
 "registryDependencies":["cn","tailwind-preset"],
 "files":[{"path":"components/composites/trend-chart/trend-chart.tsx","type":"registry:ui","target":"components/ui/trend-chart.tsx"}]}
```

(composite per ROADMAP DoD; sem deps npm — introspecção do validate exigirá só cn.)

## Coverage Corner 4 — Techniques

### Anatomia da fonte (lida integralmente)

- **Tipos:** `TrendPoint {x,y}` (x = bucket index ou epoch-ms, escala linear), `TrendSeries {name, color, points}` (`metric-trend-chart.tsx:11-22`).
- **Helpers puros exportados para teste:** `linScale` (:27-33, guarda zero-width), `niceMax` (:35-41), `seriesPath` (:43-53) — manter exportados (contrato de teste).
- **Render:** `figure > figcaption(title) + svg(viewBox 600×h, role=img, aria-label)` com baseline+gridline+labels de eixo Y (0 e yMax formatado), `<path>` por série com `<title>`, markers em esparsas (`SPARSE_MARKER_MAX=5`, :60,:137-152), legend `ul` com swatches, **tabela sr-only** com eixo = união ordenada dos x (M90, :96-100) e células por lookup (gap = "—").
- **Empty:** figure com aria-label "— no data" + placeholder tracejado (:77-92).

### Generalização (deltas para a lib)

1. Nome `TrendChart`; arquivo `components/composites/trend-chart/`.
2. Classes de texto: `text-xs`/`text-[10px]` → tokens da lib (`text-label-caps` no figcaption; manter `text-[10px]` dos eixos SVG? SVG `<text>` usa `fill-muted-foreground text-[10px]` — arbitrário pequeno aceito em SVG interno; avaliar `text-code-sm`).
3. `data-testid` → **data-slot** (convenção da lib): trend-chart/-line/-dot/-empty/-table/-legend (testids mantidos? NÃO — data-slot substitui; testes portados usam data-slot).
4. Props: manter `{title, series, height, yFormat}`; renomear `yFormat`→`valueFormatter`? Tremor usa `valueFormatter` (`LineChart.tsx:381`) — adotar `valueFormatter` com o mesmo shape `(v:number)=>string` (vocabulário SOTA), sem alias.
5. `color`: continua CSS color por série (consumidor usa `var(--chart-1)` ou hex) — JSDoc recomenda tokens; sem paleta embutida (YAGNI).
6. forwardRef no root figure + displayName (convenção).

### Consumer requirements (paths absolutos)

- Dashboard: 5 callers (`lens.tsx:14,195`, evaluators, dashboards/widgets — substituição vem no M7 § adoção Tier 2).
- theo-rag analytics (blueprint roadmap-init): séries p50/p95 por janela temporal com `valueFormatter` de ms — story dedicada.

## Cross-cutting Comparison

| Dimension | fonte dashboard | tremor | Nosso alvo |
|---|---|---|---|
| Engine | SVG puro | Recharts (rejeitado) | SVG puro (porte) |
| API | title/series/height/yFormat | data/index/categories/colors/valueFormatter (`LineChart.tsx:147,371-381`) | title/series/height/**valueFormatter** |
| A11y | role=img + tabela sr-only M90 | delega ao Recharts | porte integral (superior ao tremor) |
| Sparse data | markers <5 (M76) | n/a | porte |

## ADRs

### D1 — Porte fiel com generalização mínima

**Decision:** portar o componente + helpers + 13 testes 1:1, aplicando só os deltas da lista acima (nome, tokens, data-slot, valueFormatter, forwardRef).

**Rationale:** código com 3 gerações de lições de produção (M51/M76/M90 nos comentários e testes) — cada comportamento pinado tem cicatriz real; generalizar além disso é YAGNI. Fonte é da mesma família/licença (seed interno, como o bootstrap da lib a partir do theo-ui).

**Alternatives considered:** redesign composicional (subs Chart.Line/Axis — rejeitado: verbosidade sem demanda); adotar vocabulário tremor completo (data/index/categories — rejeitado: transforma séries em tabela pivotada, pior para séries irregulares que o M90 resolve).

**Consequences:** dashboard migra no M7 trocando import + `yFormat`→`valueFormatter` + testids→data-slot (diff pequeno e mecânico).

### D2 — Zero chart lib (reafirmação)

**Decision/Rationale:** mantém o ADR da lib (registry copy-pasteable); tremor confirma o custo da alternativa (Recharts). **Alternatives:** Recharts/visx (rejeitados). **Consequences:** features futuras (área, barras) são componentes novos, não flags.

## Recommendations for the project

| # | Recommendation | Priority |
|---|---|---|
| 1 | Portar componente+helpers com deltas D1; 13 testes portados + data-slots + axe | HIGH |
| 2 | Stories: caso rag p50/p95 (valueFormatter ms) + caso dashboard (uma métrica multi-séries) + empty | HIGH |
| 3 | Registry `trend-chart` (composite) | HIGH |
| 4 | M7: PR de adoção no dashboard substituindo o local | (fase Tier 2) |

## Blocked questions (if any)

(none)

## Halt-loop progress (audit trail)

- Fonte lida integralmente (191/191 LoC) + 13 testes + tremor LineChart.tsx:147-416 + 5 callers enumerados; 0 fabricadas (citações externas são paths absolutos de consumer/fonte, per ADR D3 da família de planos).

## Related

- Project rules: `.claude/rules/testing.md`, `.claude/rules/parsimony-ladder.md`
- Referência tremor: `.claude/knowledge-base/references/tremor/src/components/LineChart/LineChart.tsx:147,371-381`
