# North-star delta — M8 Lens Observability Kit

**Date:** 2026-07-15 · **Milestone:** M8 (lens-observability-kit)

## Pilar (c) — símbolos únicos importados de `@usetheo/ui`

| Consumidor | Baseline (pós-M7) | Pós-M8 | Δ |
|---|---|---|---|
| dashboard | ~45 (single-line) | **55** (multi-line-aware) | +8 trace-native adotados |
| studio | 14 | 14 | 0 (M8 não toca o studio) |
| **união** | 48 | **59** | +8 componentes trace + `computeTraceBounds` |

**8/8 componentes trace-native adotados no dashboard:** `SpanTree`, `SpanWaterfall`, `AttributesTable`, `IOCards`, `TraceTranscript`, `SpanGraph`, `TraceCompare` (+ o helper `computeTraceBounds`).

### Nota de método (honestidade)

O método canônico do audit M7 (`adoption-northstar-2026-07-15.md`) usava grep single-line
(`grep "from '@usetheo/ui'"` + sed). Ele **subconta** o import multi-linha do `trace-detail/index.tsx`
(os 4 componentes do pane esquerdo entram num `import { ... }` de várias linhas). Por isso este audit
usa uma contagem robusta a imports multi-linha (regex `import {…} from '@usetheo/ui'` com `re.S`):

```python
re.finditer(r"import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['\"]@usetheo/ui['\"]", text, re.S)
```

Números literais reproduzíveis: dashboard 55, studio 14, união 59 (rodado 2026-07-15).

## Pilar (a) — adoção real (não decorativa)

Os 7 componentes substituíram código hand-rolled em telas de produção do theo-lens:

| Componente da lib | Substituiu | Tela |
|---|---|---|
| `SpanTree` | RecursiveTree/VirtualTree (tree.tsx, 433 LoC) | trace-detail pane esquerdo |
| `SpanWaterfall` | Waterfall (waterfall.tsx, 208 LoC) | trace-detail lane inferior |
| `TraceTranscript` | Transcript (transcript.tsx, 300 LoC) | trace-detail view "Transcript" |
| `SpanGraph` | SpanGraph local + graph-layout.ts (141+220 LoC) | trace-detail view "Graph" |
| `AttributesTable` | Attributes (attributes.tsx, 177 LoC) | SpanDetail (pane direito) |
| `IOCards` | IoCards (io-cards.tsx, 283 LoC) | SpanDetail input/output |
| `TraceCompare` | Lane/DiffRow/DeltaBadge (compare.tsx interno) | página /observability/compare |

Fronteira de tipo: `toTraceSpan` (`dashboard/src/pages/lens/trace-detail/to-trace-span.ts`) — mapper
puro OTLP→genérico (`spanId→id`, `startTimeUnixNano→startTime`, `statusCode→status` via `isSpanError`).

## Deleções (pilar de dedup — SHAs)

Commit único da adoção+deleção no theo-cloud develop: **`b7f6a28`**.

| Arquivo deletado | LoC |
|---|---|
| `trace-detail/tree.tsx` | 433 |
| `trace-detail/transcript.tsx` | 300 |
| `trace-detail/io-cards.tsx` | 283 |
| `trace-detail/graph-layout.ts` | 220 |
| `trace-detail/waterfall.tsx` | 208 |
| `trace-detail/attributes.tsx` | 177 |
| `trace-detail/span-graph.tsx` | 141 |
| **subtotal código** | **1.762** |
| `trace-detail/tree.test.tsx` + `graph-layout.test.ts` (migrados p/ lib) | 269 |
| **total removido** | **2.031** |

Novos (fronteira, consumidor): `to-trace-span.ts` (~35 LoC) + `span-detail.tsx` (extração do SpanDetail
com AttributesTable/IOCards). Saldo líquido: **−1.7k LoC no consumidor**, com a lógica correspondente
agora numa única fonte testada na lib.

## Evidência de funcionamento (pilar (a) — 100% funcional)

- **Dashboard full suite: 1654 passed | 8 skipped (216 files)** · typecheck 0
- Os ~65 testes de componente migraram para a suíte da lib (`@usetheo/ui` 1038 testes); a suíte do
  dashboard manteve a integração consumer-owned (URL/router/fetch/erro): `trace-detail.test.tsx` 17/17,
  `compare.test.tsx` 8/8.
- Lib publicada `@usetheo/ui@0.23.0` (npm latest); dashboard bumpado `^0.23.0`.

## Comandos reprodutíveis

```bash
# north-star (multi-line-aware) — ver bloco Python acima, rodado sobre:
#   dashboard/src  e  theokit-studio/packages/studio/src
# deleções:
git -C theo-cloud/theo-cloud show --stat b7f6a28
# suite:
cd theo-cloud/theo-cloud/dashboard && pnpm vitest run   # 1654 passed
```
