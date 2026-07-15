# Blueprint: Lens Observability Kit (M8)

> Contratos de API validados contra 3 shapes reais (phoenix ⚠️ ELv2 study-only, langfuse MIT-core, theo-lens) para os 7 componentes trace-native + tipo compartilhado `TraceSpan`. Executado 2026-07-15 por 4 agentes de pesquisa paralelos sobre o plano v1.1 (12 questões, 4 corners).

**Slug:** `lens-observability-kit`
**Date:** 2026-07-15

## Context

ROADMAP § M8. Discovery plan: `knowledge-base/discoveries/plans/lens-observability-kit-plan.md` (SHIPPABLE_WITH_CAVEATS). Peers em `knowledge-base/references/phoenix/` e `knowledge-base/references/langfuse/` (licenças no `knowledge-base/references/_catalog.md`). Consumidor de origem lido por path absoluto (ADR D3 do plano).

## Objective

Fixar por componente: técnica de render, contrato de props genérico, estratégia de virtualização, padrão a11y e fronteira de testes — matando R1 (API-lock single-consumer) antes do `/to-plan`.

## Coverage Corner 1 — Integration Tests

**Q12 (done).** A suíte do lens (`/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/pages/lens/trace-detail.test.tsx`, 90 testes) foi classificada teste a teste:

- **~65 testes MIGRAM** para a lib como testes de componente puro: render da árvore de fixture aninhada, semântica ARIA tree completa (M71), computeBarLayout/bounds (matemática pura com clamps e edge cases), collapse/expand, virtualização acima/abaixo do threshold, asChat/prettyValue/durationMs (helpers), masking fail-closed (raw ausente pré-reveal; canReveal=false esconde controle), graph render + oversize honesto + parent malformado, invariante `does not use dangerouslySetInnerHTML`.
- **~25 FICAM no consumidor**: tudo que toca URL/router (`?spanId=`, `?view=`, breadcrumb, tecla `]` atualizando URL), painéis resizable (react-resizable-panels), fetch/error de dados, navegação externa (Playground reveal).
- Phoenix testa via `knowledge-base/references/phoenix/app/src/components/trace/useTraceDetailData.clienttest.tsx` (hooks de dados testados separados do render — mesmo padrão da fronteira acima).
- **Fixtures:** os fixtures de trace aninhado do lens são extraíveis como fixtures de story/teste da lib (traces reais de agente: ramificação, retry, spans órfãos, clock skew).

## Coverage Corner 2 — Dependencies

**Q8 (done) — tipo `TraceSpan`.** Interseção dos 3 shapes (phoenix `ISpanItem` em `knowledge-base/references/phoenix/app/src/components/trace/types.ts:4-16`; langfuse observation em `knowledge-base/references/langfuse/web/src/components/trace/useTraceDetailData.clienttest.tsx:1-86`; lens `TraceSpanNode` em `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/lib/trace-layout.ts`):

```ts
export interface TraceSpan {
  id: string;
  parentId: string | null;
  name: string;
  kind?: "llm" | "tool" | "retriever" | "agent" | "chain" | "embedding" | "reranker" | "evaluator" | "guardrail";
  startTime: bigint | string;          // ns unix preferido; ISO aceito
  endTime?: bigint | string | null;    // null = in-flight
  status?: "OK" | "ERROR" | "UNSET";
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  ttftMs?: number;
  costUsd?: number;
  attributes?: Record<string, unknown>;
  events?: Array<{ name: string; attributes?: Record<string, unknown> }>;
  children?: TraceSpan[];
}
```

Kinds = vocabulário OpenInference/OTel GenAI (phoenix `useSpanKindColor.ts:11-58`: llm, chain, tool, retriever, embedding, agent, reranker, evaluator, guardrail). Campos de transporte do langfuse (tRPC) descartados (EC-2). Roles de mensagem = ChatML: `system|user|assistant|tool` (comum às 3 fontes — lens `io-cards.tsx:92-104`, langfuse `IOPreview/components/ChatMessage.tsx:29-36`).

**Q9 (done) — veredicto ZERO dep nova.** Langfuse virtualiza com `@tanstack/react-virtual` (`knowledge-base/references/langfuse/web/src/components/trace/components/_shared/VirtualizedTree.tsx:1` e `TraceTimeline/index.tsx:1`); o lens idem (`tree.tsx:3`, `transcript.tsx:2`, threshold 200 em `helpers.ts:48`). A lib JÁ depende de react-virtual (M6). Markdown e CodeMirror do lens NÃO viram deps da lib — ver D2/D3 abaixo.

## Coverage Corner 3 — Tools

**Q10 (done) — ARIA.** O lens já implementa o padrão WAI-ARIA APG TreeView completo e ele vira o contrato da lib: `role="treeitem"` + `aria-level` + `aria-posinset` + `aria-setsize` + `aria-selected` + `aria-expanded` (lens `tree.tsx:87-92`), grupos `role="group"` (`tree.tsx:183`), toggles com `aria-label` dinâmico (`tree.tsx:99`). Waterfall: barras clicáveis como `button` com `aria-label="Timeline: {name}"`. Masking: reveal button + hint desabilitado quando `canReveal=false` (`attributes.tsx:139-177`). Phoenix NÃO tem tree ARIA (só `role="button"`) — o lens é superior aqui; langfuse tem slider/separator ARIA no playhead (`TraceTimeline/index.tsx:560-565,641-643`) — padrão a adotar SE zoom entrar (não entra no M8 — YAGNI).

**Q11 (done) — comandos.** Inventário: os 7 hand-rolled importam APENAS símbolos genéricos da lib (Badge, Button, Card, CopyButton, EmptyState, StatusDot) + react-virtual — nenhum ciclo de dependência para a promoção. North-star baseline = **48 símbolos únicos (união dashboard+studio)** per audit `knowledge-base/audits/adoption-northstar-2026-07-15.md` (comandos literais lá; re-rodar pós-M8). Nota de honestidade: um re-run parcial pelo agente de pesquisa deu 46 no dashboard isolado com pipeline de sed diferente — o método CANÔNICO é o do audit citado; o delta pós-M8 usa exclusivamente aquele.

## Coverage Corner 4 — Techniques

### Q1 — SpanWaterfall (done)

- **Escala:** lens usa percentuais (`computeBarLayout` → `{leftPct, widthPct, unbounded}` — `waterfall.tsx:67,105`); langfuse usa px absolutos com SCALE_WIDTH constante (`TimelineBar.tsx:28-168`, equação startOffset/itemWidth em `TraceTimeline/index.tsx:44-52`). **Decisão: percentuais (lens)** — responsivo sem re-medição.
- **Elemento:** div absoluta com inline style (as 3 fontes) — NÃO precisa de SVG para barras; o "SVG puro" do ADR refere-se a não usar chart lib.
- **Ticks:** lens `AxisTicks` via `niceAxisTicks` (`waterfall.tsx:35-52`); langfuse `TimelineScale.tsx:16-80` (step 1|2|5×10ⁿ). Lens já resolve.
- **Extras do lens a preservar:** hover-needle com timestamp (`waterfall.tsx:159-167`), row-packing p/ spans assíncronos sobrepostos, rollup de custo (∑) em parents, clock-skew → duração null (`helpers.ts:51-59`), in-flight → barra unbounded. **Gap vs Arize (fora do M8, documentado):** zoom interativo e split-bar de TTFT (langfuse `TimelineBar.tsx:117-149`).
- **Contrato draft:** `SpanWaterfallProps { root: TraceSpan; bounds?: {start,end}; selectedId?: string | null; onSelect?: (id) => void; collapsed?: Set<string>; onToggleCollapse?: (id) => void; formatTimestamp?: (ns) => string }`.

### Q2 — SpanTree (done)

- Phoenix: collapse global+local via context (`TraceTree.tsx:168-192`), ícones por kind (`SpanKindIcon.tsx`), latência (`LatencyText.tsx`), seleção com `startTransition` (`TraceTree.tsx:198-211`) — MAS sem ARIA tree e sem virtualização.
- Lens: ARIA completo (corner 3) + dual-path RecursiveTree/VirtualTree com threshold 200 (`tree.tsx:57-268`). **Base do componente da lib.**
- Adições nível-Arize vindas do phoenix (padrão, não código): ícone/cor por kind, badges de tokens/custo por linha.
- **Contrato draft:** `SpanTreeProps { root: TraceSpan; selectedId?: string | null; onSelect?: (id) => void; collapsed: Set<string>; onToggleCollapse: (id) => void; showMetrics?: boolean; virtualizeThreshold?: number; renderBadge?: (span) => ReactNode }`.

### Q3 — TraceTranscript (done)

- Vocabulário ChatML comum (corner 2). Tool calls: par call/result via `tool_call_id` (lens `io-cards.tsx:151-169`; langfuse parse duplo em `chat-message-utils.ts:74-82`). Langfuse suporta thinking/redacted_thinking blocks — entra como tipo opcional de mensagem.
- Truncamento: histórico >8 → head/tail 3+3 com "Show N more" (lens `io-cards.tsx:26-29`); markdown >8000 chars → "Show more" (lens `markdown.tsx:15-42`).
- **Markdown NÃO vira dep da lib** — ver D2.
- **Contrato draft:** `TraceTranscriptProps { rows: TranscriptRow[]; selectedId?: string; onSelect?: (id) => void; collapsedGroups?: Set<string>; onToggleGroup?: (id) => void; renderMarkdown?: (text: string) => ReactNode; virtualizeThreshold?: number }` com `TranscriptRow { kind: "span"|"group-header"; spanId; role?; preview?; stats? }`.

### Q4 — AttributesTable (done)

- Lens: cards por namespace (groupByNamespace) + promoted badges + `<dl>` rows (`attributes.tsx:28-121`). Phoenix `SpanAside.tsx`/`ReadonlyJSONBlock.tsx` e langfuse `ObservationDetailView/` são JSON-block-centric — o modelo namespace-cards do lens é superior para semconv.
- **Masking fail-closed é o contrato (inegociável):** valor raw NUNCA entra no DOM pré-reveal (nem title/aria/data-attrs); CopyButton retido até reveal; `canReveal=false` → hint desabilitado (`attributes.tsx:139-177`).
- **Contrato draft:** `AttributesTableProps { attrs?: Record<string, unknown>; maskedKeys?: (key: string) => boolean; canReveal?: boolean; promoted?: string[]; defaultOpen?: boolean }`.

### Q5 — IOCards (done)

- Detecção de formato: `asChat()` total/puro (lens `helpers.ts:71-85`) → chat cards; fallback JSON pretty (`prettyValue`, `helpers.ts:62-68`). Langfuse tem 3 modos com toggle (`IOPreview.tsx:212-216`) — overkill para v1 (YAGNI).
- **Fallback JSON usa o `JsonViewer` (M2) da própria lib** — NÃO CodeMirror (dep do lens, não vem). Copy sempre do RAW.
- **Contrato draft:** `IOCardsProps { value?: string; label?: "input"|"output"|string; renderMarkdown?: (text) => ReactNode; onCopy?: () => void }`.

### Q6 — SpanGraph (done — VEREDICTO BLOQUEANTE RESOLVIDO)

- Langfuse: **elkjs** (layered, `knowledge-base/references/langfuse/web/src/features/trace-graph-view/layout/elkLayout.ts:1,45-54`) + **d3-zoom/d3-selection** (`ElkGraphRenderer.tsx:8-15`) — REJEITADO como caminho (2 deps novas).
- Lens: layout PRÓPRIO puro — BFS layering determinístico `x=order*168, y=depth*96` + computePath (`graph-layout.ts:44-169`), renderer SVG nativo `<line>/<rect>/<circle>/<text>` (`span-graph.tsx:46-75`), com GRAPH_NODE_CAP para oversize honesto.
- **VEREDICTO: SVG puro SE SUSTENTA.** Generalizar `buildTraceGraph()` como função pura exportada + renderer SVG. O ADR "zero dep de chart/layout" é mantido; zoom/pan ficam fora do M8 (o caso do lens não usa).

### Q7 — TraceCompare (done — lens-derived)

- Lens `compare.tsx:30-312`: 2 traces lado a lado, `alignSpanTrees` estrutural (matched / only-in-A / only-in-B — delta suprimido quando não pareado, nunca fabricado), DeltaBadge (+/−, %, cor por "better"), LaneTimeline reusando os helpers do waterfall.
- **Nenhum peer tem equivalente citável** (grep compare/diff sem hit em phoenix/langfuse core) → contrato **lens-derived** (EC-3): TraceCompare vai para a ÚLTIMA fase do plano (API menos travada) e o R1 residual fica documentado.
- **Contrato draft:** `TraceCompareProps { laneA: CompareLane; laneB: CompareLane; align?: (a, b) => AlignRow[] }` — a lib recebe DADOS (lanes), nunca busca (fetch é do consumidor).

## Cross-cutting Comparison

| Dimensão | Phoenix | Langfuse | Lens | Lib (decisão) |
|---|---|---|---|---|
| Barras | div+context color | div px + SCALE_WIDTH | div % (`computeBarLayout`) | div % |
| Tree ARIA | ausente | parcial (playhead/separator) | APG completo | APG completo (lens) |
| Virtualização | não | react-virtual | react-virtual (threshold 200) | react-virtual (M6) |
| Grafo | — | elkjs + d3 | BFS puro + SVG | BFS puro + SVG |
| Markdown | próprio | react-markdown+sanitize | react-markdown+sanitize | slot `renderMarkdown` (D2) |
| JSON | ReadonlyJSONBlock | PrettyJsonView | CodeMirror | JsonViewer M2 (D3) |

## ADRs

### D1 — Estado 100% controlado; a lib nunca conhece URL nem fetch

**Decision:** todos os 7 componentes recebem dados via props e expõem callbacks (`selectedId/onSelect`, `collapsed/onToggleCollapse`); zero estado de rota, zero data-fetching.

**Rationale:** a fronteira lib/consumidor provada no Q12 (~25 testes de URL/fetch ficam no lens). Alternativas: uncontrolled com defaultValue (rejeitada para seleção — o lens sincroniza com URL; aceita APENAS para collapse interno default), context provider de trace (rejeitada — YAGNI, um nível de props resolve).

### D2 — Markdown via slot, não dependência

**Decision:** `renderMarkdown?: (text: string) => ReactNode` em TraceTranscript/IOCards; default = texto plano com quebras preservadas. O consumidor injeta react-markdown+rehype-sanitize (que o lens já tem).

**Rationale:** react-markdown+sanitize são 2 deps transitivas pesadas; o registry copy-pasteable não pode carregá-las (mesmo racional do ADR anti-chart-lib). Segurança preservada: o default NUNCA interpreta HTML (texto puro); a invariante `no dangerouslySetInnerHTML` migra como teste da lib. Alternativas: dep direta (rejeitada — peso/registry), sanitização própria (rejeitada — Rule 9, nunca reinventar sanitizer).

### D3 — Fallback JSON no JsonViewer da lib; CodeMirror não entra

**Decision:** IOCards/AttributesTable usam `JsonViewer` (M2) para payloads não-chat; CodeMirror fica no lens se quiserem manter (a adoção pode simplificar para JsonViewer).

**Rationale:** dep já existente e dependency-free (M2), com collapse/copy/circular-safety testados. Alternativa CodeMirror (rejeitada — dep nova pesada só para read-only view).

### D4 — SpanGraph SVG puro com layout BFS generalizado do lens

**Decision:** exportar `buildLayeredGraph()` (função pura, testável) + renderer SVG nativo; sem elkjs/d3; zoom/pan fora do M8.

**Rationale:** veredicto Q6 — o lens prova viabilidade em produção com oversize honesto (GRAPH_NODE_CAP). Alternativas: elkjs (rejeitada — dep pesada + WASM bundle), corte do SpanGraph (rejeitada — viável sem custo de dep).

### D5 — Ordem de implementação por risco de API

**Decision:** Fase 1: `TraceSpan` type + helpers puros (computeBarLayout, flattenVisible, buildLayeredGraph — a fundação de todos). Fase 2: SpanTree + SpanWaterfall (pares tree/timeline). Fase 3: AttributesTable + IOCards + TraceTranscript (payloads). Fase 4: SpanGraph. Fase 5: TraceCompare (lens-derived — por último, EC-3). Fase 6: adoção no lens + deleções + north-star.

**Rationale:** helpers primeiro = contratos de dados travados cedo (R1); compare por último = API menos validada externamente ajustável até o release. Alternativa: por tamanho (rejeitada — tree 433 LoC primeiro concentraria risco sem a fundação).

## Recommendations for the project

1. `/to-plan lens-observability-kit` com as 6 fases do D5; TraceCompare marcado lens-derived.
2. Fixtures de trace do lens extraídos para `src/test/fixtures/` da lib (traces com ramificação/retry/órfãos/skew).
3. A invariante de masking fail-closed e a de `dangerouslySetInnerHTML` viram testes NEGATIVOS obrigatórios (testing.md § 4.1).
4. Copy pública: posicionar como "agent observability components" — nunca comparativo com Arize sem benchmark (public-copy.md § 4/6).

## Blocked questions

(none — 12/12 done)

## Halt-loop progress (audit trail)

- 2026-07-15: 4 agentes paralelos (Q1+Q2, Q3+Q5, Q4+Q6+Q7, Q8-Q12) — todos retornaram com citações verificadas; síntese manual; discrepância de contagem north-star do agente Q11 anotada e resolvida a favor do método canônico do audit M7.

## Related

- Plan: `knowledge-base/discoveries/plans/lens-observability-kit-plan.md`
- Grill: `knowledge-base/grills/lens-observability-kit-feature-grill.md`
- Catalog: `knowledge-base/references/_catalog.md`
- Audit north-star: `knowledge-base/audits/adoption-northstar-2026-07-15.md`
