# Discovery Plan: Lens Observability Kit (M8)

> **Version 1.1** (2026-07-15 — edge cases absorvidos: EC-1..EC-5) — Estudar como Phoenix (Arize OSS) e Langfuse constroem as superfícies de LLM tracing (waterfall, span tree, transcript, attributes, IO, graph, compare) e cruzar com o hand-rolled do theo-lens (~1.850 LoC) para fixar os contratos de API genéricos dos 7 componentes trace-native do M8 — matando o risco R1 (API-lock a partir de um único consumidor) antes do `/to-plan`.

**Slug:** `lens-observability-kit`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 3h (ADR D1)

## Context

ROADMAP § M8 (deps M2, M6, M7 — todas `[x]`; milestone elegível). Grill em `knowledge-base/grills/lens-observability-kit-feature-grill.md` fixou: kit completo NESTE repo (out-of-scope amendado — observabilidade em escopo, conversação segue fora), DoD de 7 componentes + adoção/deleção no lens, riscos R1 (API-lock) e R2 (fronteira).

Peers clonados pelo `/roadmap-feature` (catalog: `knowledge-base/references/_catalog.md`): **phoenix** (⚠️ Elastic 2.0 — study-only, PROIBIDO copiar código; padrões são reimplementados do zero) e **langfuse** (MIT core; diretórios `ee/` EXCLUÍDOS do estudo). O consumidor de origem (theo-lens) é lido via path absoluto (ADR D3 — família M0-M7).

Regras consumidas: `rules/architecture.md § 3` (module cohesion), `rules/testing.md § 4.1` (edge + negative), `rules/public-copy.md` (nada de "Arize killer" em copy), ADR do roadmap "SVG puro, zero dep de chart".

## Objective

Blueprint que fixe, para cada um dos 7 componentes: contrato de props genérico validado contra ≥ 2 shapes reais (peer + lens), técnica de render (SVG/DOM), estratégia de virtualização, padrão a11y e plano de teste — mais o tipo compartilhado `TraceSpan` que os 7 consomem.

- [ ] All research questions answered with citations (paths de `knowledge-base/references/` + paths absolutos do lens)
- [ ] Tipo `TraceSpan` genérico proposto e validado contra phoenix + langfuse + lens (R1)
- [ ] Decisão SVG-puro sustentada para waterfall E graph (ou ADR honesto se graph exigir layout lib)
- [ ] `/discover-plan-confidence` e depois `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope

| Alvo | Escopo | Reason |
|---|---|---|
| `knowledge-base/references/phoenix/app/src/components/trace/` + `knowledge-base/references/phoenix/app/src/pages/trace/` | TraceTree, SpanDetails, SpanAside, SpanKindIcon, LatencyText, ReadonlyJSONBlock | UI de tracing mais próxima da Arize (padrões, nunca código — ELv2) |
| `knowledge-base/references/langfuse/web/src/components/trace/` | TraceTimeline/TimelineBar, IOPreview, ObservationDetailView, TraceGraphView, SpanContent, _layout | 2ª fonte independente (MIT core) — evita single-source no shape |
| (consumidor — ADR D3) `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/pages/lens/trace-detail/` + `compare.tsx` | waterfall, tree, transcript, io-cards, attributes, span-graph, graph-layout, helpers, summary, compare | O shape REAL que o kit precisa servir no dia 1 |
| (interno) `src/components/composites/data-table/` + `src/components/composites/json-viewer/` | reuso M6/M2 | Rung 4 da parsimony — o kit compõe sobre o que existe |

### Out-of-Scope (explicit)

| Item | Why |
|---|---|
| `knowledge-base/references/langfuse/web/src/ee/` e qualquer dir `ee/` | Enterprise License — excluído do estudo (catalog) |
| Copiar código do phoenix | Elastic 2.0 — só padrões/UX, reimplementação limpa |
| Evals/scores/annotations UI | Fora do DoD do M8 (candidato a M9+); grill Q1 delimitou observability/tracing |
| Sessions view / filter DSL | Idem — gap Arize documentado mas fora do DoD |
| Backend/coleta OTel | O kit é UI pura; dados chegam via props |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** peers 1.5h (phoenix 0.75h, langfuse 0.75h), lens re-leitura dirigida 0.75h, síntese de contratos 0.75h. Total 3h.

**Rationale:** o grosso do risco (R1) mora na comparação de shapes — os dois peers têm peso igual. Alternativas consideradas: só phoenix (rejeitada — single-source é exatamente o R1), incluir openllmetry/openinference (rejeitada — semconv chega via docs do OTel GenAI sem clonar mais um repo, YAGNI).

**Stop condition — per question:** 3 variantes de grep sem hit → BLOCKED com nota; próxima. **Per project:** budget exaurido → BLOCKED honesto, nunca COMPLETE parcial.

### D2 — Disciplina de licença por peer

**Decision:** phoenix = ler para extrair PADRÕES (estrutura de dados, hierarquia de componentes, decisões de UX); nenhum trecho de código copiado para o blueprint — apenas descrições e citações `path:line`. langfuse = MIT core citável normalmente; qualquer path sob `ee/` é descartado na leitura.

**Rationale:** ELv2 não é OSI; o risco legal é cópia derivada, não estudo. Alternativas: não usar phoenix (rejeitada — é a referência nível-Arize pedida pelo usuário), pedir revisão jurídica (desproporcional para estudo de padrões).

### D3 — Consumidor via path absoluto (herdado da família M0-M7)

**Decision:** o lens é lido/citado por path absoluto; só paths sob `knowledge-base/references/` passam pelo check de citação do scorer.

**Rationale:** precedente do M7 (funcionou, com scorer lento como único custo). Alternativa: symlink do lens em references/ (rejeitada — references é read-only e o lens muda).

## Research Questions

| # | Question | Corner | Alvo | Fase A (broad) | Fase B (deep) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Como langfuse (`TraceTimeline/TimelineBar.tsx`) e phoenix (`TraceTree.tsx`) calculam/renderizam barras de duração (escala tempo→px, DOM vs SVG, cor por status/kind, ticks, zoom) vs lens `waterfall.tsx`? | techniques | peers + lens | Grep gantt/waterfall/timeline nos peers | Read dos arquivos + lens waterfall.tsx | Técnica de render + contrato de props draft do SpanWaterfall |
| Q2 | Estrutura/interação da árvore em phoenix (`ConnectedTraceTree.tsx`, `TraceTree.tsx`, `SpanKindIcon.tsx`, `LatencyText.tsx`) vs lens `tree.tsx` — collapse, seleção, kinds, badges, teclado, roles ARIA? | techniques | peers + lens | Grep treeitem/aria-expanded | Read dirigido | Contrato de props draft do SpanTree + padrão ARIA |
| Q3 | Como langfuse `IOPreview/` e phoenix `SpanDetails.tsx` renderizam mensagens LLM (roles, tool calls, markdown, truncamento) vs lens `transcript.tsx` — vocabulário de roles comum? | techniques | peers + lens | Grep role/message/tool_call | Read dos renderers | Contrato TraceTranscript + vocabulário de roles |
| Q4 | Como phoenix (`SpanAside.tsx`, `ReadonlyJSONBlock.tsx`) e langfuse `ObservationDetailView/` exibem atributos semconv; o masking/reveal do lens `attributes.tsx` generaliza como prop? | techniques | peers + lens | Grep attributes/metadata | Read + lens masking | Contrato AttributesTable (com masking) |
| Q5 | Shape input/output em langfuse `IOPreview/` vs lens `io-cards.tsx` — JSON vs texto vs multimodal; onde o JsonViewer (M2) entra? | techniques | peers + lens + lib | Grep input/output | Read + mapa de reuso M2 | Contrato IOCards + pontos de reuso |
| Q6 | Como langfuse `TraceGraphView/` desenha o grafo (layout lib? dagre? SVG?) vs lens `span-graph.tsx`+`graph-layout.ts` — o ADR "SVG puro, zero dep de chart" se sustenta para grafo? | techniques | peers + lens | Grep imports do TraceGraphView | Read graph-layout.ts | Veredicto SVG-puro OU proposta de corte com ADR |
| Q7 | O lens `compare.tsx` compara o quê (spans lado a lado? diff de payload?); existe equivalente citável em peer ou o contrato nasce lens-derived (R1 residual)? | techniques | lens + peers | Grep compare/diff nos peers | Read compare.tsx | Contrato TraceCompare + nota de fonte única se for o caso |
| Q8 | Qual o menor tipo `TraceSpan` que serve phoenix (OpenInference kinds), langfuse (observations) e lens (`helpers.ts`/`summary.ts`) — id, parent, name, kind, timestamps, status, attrs, tokens/custo? Kinds seguem OTel GenAI semconv? | deps | peers + lens | Grep type/interface de span/observation | Read dos tipos + interseção de campos | Tipo TraceSpan proposto + tabela de mapeamento 3-fontes |
| Q9 | Peers virtualizam árvores/waterfalls de milhares de spans? Com quê? `@tanstack/react-virtual` (M6, instalado) cobre — alguma dep NOVA seria exigida? | deps | peers + lib | Grep virtual/window nos peers | Confirmar API do react-virtual p/ tree | Veredicto "zero dep nova" (ou exceção justificada) |
| Q10 | Roles/padrões ARIA para tree (treeitem/aria-expanded), waterfall e masking nos peers; padrão WAI-ARIA APG aplicável por componente; o que o axe cobra? | tools | peers + APG | Grep aria-/role= | Mapear APG TreeView pattern | Tabela padrão ARIA por componente |
| Q11 | Comandos reprodutíveis: inventário de call sites dos 7 hand-rolled no lens (grep por import) e north-star baseline pós-M7 (48) re-executável — mesmo método do audit `adoption-northstar-2026-07-15.md`? | tools | lens | Escrever + rodar greps | Registrar números literais | Comandos + baseline + inventário file:line |
| Q12 | Como phoenix testa trace UI (`useTraceDetailData.clienttest.tsx`) e o que a suíte do lens (`trace-detail.test.tsx`) cobre — quais testes migram para a lib e quais ficam no consumidor? | tests | peers + lens | Glob *test* nos dirs de trace | Read seletivo das suítes | Tabela teste-por-componente (lib vs consumidor) + fixtures extraíveis |

**Consumer requirements:** paths absolutos `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/pages/lens/`.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q12 | Covered |
| Dependencies | Q8, Q9 | Covered |
| Tools | Q10, Q11 | Covered |
| Techniques | Q1, Q2, Q3, Q4, Q5, Q6, Q7 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop checkpoints (para /discover-execute)

- Q8 ANTES de Q1-Q7 fecharem contratos (o TraceSpan é o insumo de todos); Q6 é bloqueante de escopo (veredicto SVG-puro decide se SpanGraph fica no M8).
- Toda citação `path:linha` verificada por Read na mesma iteração; paths do phoenix NUNCA acompanhados de código copiado (ADR D2 — ELv2).
- Qualquer path `ee/` do langfuse encontrado em grep é descartado com nota (ADR D2).
- Q11: comandos registrados literais — a mesma linha roda pós-adoção para o delta.
- **EC-1..EC-5** da seção Edge cases aplicam-se por questão (EC-1→Q1/Q2/Q4; EC-2→Q8; EC-3→Q7; EC-4→Q6; EC-5→scorers em background).

## Acceptance Criteria

- [ ] 12/12 questões `done` (ou `blocked` honesto com o grep executado registrado)
- [ ] Citações resolvem em disco (`check_reference_citations.py` PASS)
- [ ] 4 corners populados (`check_research_coverage.py` PASS)
- [ ] ≥ 1 ADR no blueprint (mínimo: veredicto Q6 sobre SVG-puro/grafo)
- [ ] Tipo `TraceSpan` com tabela de mapeamento das 3 fontes
- [ ] `/discover-confidence lens-observability-kit` ≥ SHIPPABLE_WITH_CAVEATS (89)

## Global Definition of Done

Blueprint em `.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` ≥ SHIPPABLE_WITH_CAVEATS, com contratos draft dos 7 componentes + TraceSpan — insumo direto do `/to-plan lens-observability-kit`.

## Edge cases (MUST-FIX absorvidos — /discover-edge-cases)

| EC | Risco no plano de investigação | Absorção (owner: Claude) |
|---|---|---|
| EC-1 | Phoenix usa react-aria + design system próprio (Arize) — copiar hierarquia de componentes deles não mapeia para Radix/Tailwind | Q1/Q2/Q4: extrair DECISÕES (dados, interação, UX), nunca a implementação; blueprint descreve contratos, não componentes deles. Critério: nenhuma recomendação do blueprint referencia API react-aria. |
| EC-2 | Langfuse acopla UI a tRPC/queries live — o shape de "observation" pode vir poluído de campos de transporte | Q8: o `TraceSpan` proposto lista APENAS campos presentes nos 3 shapes (interseção), com extensões opcionais; campos de transporte descartados explicitamente. |
| EC-3 | `compare.tsx` pode não ter equivalente nos peers → contrato nasceria de 1 fonte (R1 residual) | Q7: se sem peer, blueprint marca TraceCompare como "contrato lens-derived" e o plano do M8 o coloca na ÚLTIMA fase (API menos travada, mais fácil de ajustar pré-release). |
| EC-4 | Grafo pode exigir layout lib (dagre/reactflow) nos peers → conflito frontal com ADR "SVG puro, zero dep de chart" | Q6 é BLOQUEANTE para o escopo: se layout lib for inevitável e `graph-layout.ts` do lens não generalizar, o blueprint propõe corte honesto (SpanGraph fora do M8 via ADR) — nunca dep nova silenciosa. |
| EC-5 | Scorer de citações lento com paths absolutos (precedente M7: 5-7min) | Rodar `run_discover_plan_score.py` e depois o de blueprint em background com nohup; nunca bloquear o loop. |

## Deliverables

1. Blueprint em `knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` com os 4 corners, ADRs e contratos de props draft dos 7 componentes + `TraceSpan`.
2. Insumo direto para `/to-plan lens-observability-kit` (fases por componente, ordem de risco).
