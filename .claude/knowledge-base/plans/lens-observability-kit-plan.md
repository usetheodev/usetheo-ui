---
slug: lens-observability-kit
milestone_id: M8
created_at: 2026-07-15
goal: Publicar 7 componentes trace-native (SpanWaterfall, SpanTree, TraceTranscript, AttributesTable, IOCards, SpanGraph, TraceCompare) + tipo TraceSpan e helpers puros, adotá-los no theo-lens deletando ~1.850 LoC hand-rolled, com delta north-star registrado e zero dependência nova.
---

# Plan: Lens Observability Kit (M8)

> **Version 1.1** (absorve EC-1..EC-4 do edge-case review) — Executa o blueprint do M8 (`.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` — SHIPPABLE): fundação de dados primeiro (TraceSpan + helpers puros, ADR D5 do blueprint), depois os pares tree/waterfall, payloads, grafo SVG-puro e compare lens-derived por último; fecha com adoção cross-repo no lens (mesmo playbook do M7) e delta north-star. Zero dep nova (react-virtual do M6 cobre; markdown via slot — ADR D2 do blueprint; JSON via JsonViewer M2 — ADR D3 do blueprint).

## Goal

Elevar a lib ao nível "agent observability kit": os 7 componentes do DoD do M8 publicados com DoD padrão (stories + axe + testes + registry), adotados no theo-lens com deleção dos hand-rolled (~1.850 LoC) e delta north-star sobre a baseline 48.

## Context

ROADMAP § M8 (deps M2/M6/M7 todas `[x]`). Blueprint SHIPPABLE com contratos validados em 3 fontes (phoenix ⚠️ ELv2 study-only; langfuse MIT-core; lens). Riscos do grill: R1 API-lock (mitigado pela validação 3-fontes + compare por último), R2 fronteira AI/não-AI (nota no ROADMAP delimita conversação fora).

## Baseline Context (deep review of current state)

### Files that will be touched

**Lib @ `5e5defb6` (v0.22.1, develop).** Novos: `src/lib/trace/*` (6 arquivos + testes), `src/components/composites/{span-tree,span-waterfall,attributes-table,io-cards,trace-transcript,span-graph,trace-compare}/*`, `src/test/fixtures/trace.ts`, `registry/*` (gerados). Editados: `src/index.ts`, `CHANGELOG.md`. Componentes reutilizados pelo kit:

| Arquivo | LoC | Papel no M8 |
|---|---|---|
| `src/components/primitives/json-viewer/json-viewer.tsx` | ~279 | Fallback JSON de IOCards/AttributesTable (ADR D3 do blueprint) |
| `src/components/composites/data-table/data-table-virtualized.tsx` | ~200 | Precedente de uso do `useVirtualizer` (spacer-row, viewport injection p/ teste) |
| `src/lib/cn.ts`, `Badge`, `Button`, `Card`, `CopyButton`, `EmptyState`, `StatusDot` | — | Blocos de composição já importados pelos hand-rolled do lens |

**Lens (consumidor de origem) @ `8d7f4ec` (theo-cloud develop), paths sob `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/`:**

| Arquivo | LoC | Vira |
|---|---|---|
| `src/pages/lens/trace-detail/waterfall.tsx` | 208 | `SpanWaterfall` |
| `src/pages/lens/trace-detail/tree.tsx` | 433 | `SpanTree` (split ≤300/arquivo — ADR D3 deste plano) |
| `src/pages/lens/trace-detail/transcript.tsx` | 300 | `TraceTranscript` |
| `src/pages/lens/trace-detail/io-cards.tsx` | 283 | `IOCards` |
| `src/pages/lens/trace-detail/attributes.tsx` | 177 | `AttributesTable` |
| `src/pages/lens/trace-detail/span-graph.tsx` + `graph-layout.ts` | 141+~200 | `SpanGraph` + `buildLayeredGraph` |
| `src/pages/lens/compare.tsx` | 312 | `TraceCompare` |
| `src/lib/trace-layout.ts` | 336 | Fonte dos helpers (`computeBarLayout`, `niceAxisTicks`, `TraceSpanNode`) |
| `src/pages/lens/trace-detail/helpers.ts` | 103 | Fonte de `durationMs`, `flattenVisible`, `asChat`, `prettyValue` (VIRTUALIZE_THRESHOLD=200) |
| `src/pages/lens/trace-detail.test.tsx` | 90 testes | ~65 migram como testes de componente; ~25 ficam (URL/fetch/layout) |

### Current callers / dependents

Hoje ZERO callers na lib (componentes novos). Pós-T6.1 os callers de produção são `dashboard/src/pages/lens/trace-detail/index.tsx` e `dashboard/src/pages/lens/compare.tsx` (inventário de imports no blueprint Corner 3 Q11 — os hand-rolled importam apenas Badge/Button/Card/CopyButton/EmptyState/StatusDot da lib, sem ciclos). Dependents internos: trace-transcript → io-cards → json-viewer (EC-1).

### Domain glossary

**Glossário:** span = unidade de trabalho com timestamps ns; trace = árvore de spans; kind = vocabulário OpenInference (llm/tool/agent/chain/retriever/embedding/reranker/evaluator/guardrail); ChatML roles = system/user/assistant/tool; masking fail-closed = valor raw nunca no DOM pré-reveal.

### Architecture boundaries affected

**Fronteira arquitetural (ADR D1 do blueprint):** a lib recebe DADOS via props e expõe callbacks; URL/fetch/painéis ficam no consumidor.

## Prior Art & Related Work

- Blueprint do M8 (`.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` — Corners 1-4 e ADRs D1-D5): contratos, veredictos e fronteira de testes.
- Playbook de adoção+deleção do M7 (`.claude/knowledge-base/plans/adoption-dedup-plan.md` — Fases 2-4): sequência bump→substituição→deleção com SHAs, reaplicada na Fase 6.
- Precedente de virtualização M6 (`.claude/knowledge-base/plans/datatable-virtualized-plan.md`): spacer-row + injeção de viewport em teste.

## Objective

- [ ] 7 componentes + `TraceSpan` + helpers exportados, cada um com stories (+axe), testes e entrada de registry válida
- [ ] Suíte da lib 100% verde; typecheck/lint/format limpos; `registry:validate` PASS
- [ ] Lens adota os 7; hand-rolled deletados; suíte do dashboard verde
- [ ] Delta north-star registrado com comandos canônicos do audit M7
- [ ] Zero dependência nova (`package.json` da lib inalterado em `dependencies`)

## Dependencies

Nenhuma dependência NOVA (Rule 9 satisfeita por reuso — rung 4 da parsimony). Deps tocadas (já instaladas):

| Dependência | Versão pinada | Uso no M8 | Rule 9 (não reinventar) |
|---|---|---|---|
| `@tanstack/react-virtual` | `^3.13.12` (peer/dep desde M6) | SpanTree/TraceTranscript acima do threshold | Virtualizador consagrado; precedente M6 |
| `react` / `react-dom` | peer `^18 \|\| ^19` | runtime | — |
| (dev) `vitest`, `@testing-library/react`, `axe-core` | lockfile | testes + a11y | — |

Markdown (react-markdown) e CodeMirror explicitamente NÃO entram (ADRs D2/D3 do blueprint). CVE scan: sem manifesto alterado → `/deps-audit` roda em modo plan-bound confirmando ausência de dep nova.

## ADRs

### D1 — Estrutura de arquivos: família `trace/` com helpers como registry:lib

**Decision:** tipo+helpers em `src/lib/trace/` (`types.ts`, `bar-layout.ts`, `flatten.ts`, `graph-layout.ts`, `chat.ts`, `duration.ts` — cada ≤300 linhas); componentes em `src/components/composites/{span-tree,span-waterfall,trace-transcript,attributes-table,io-cards,span-graph,trace-compare}/` (um dir por componente, padrão da lib). Registry: 1 item `trace-core` (registry:lib) + 7 itens de componente dependendo dele.

**Rationale:** os 7 compartilham `TraceSpan` e helpers; duplicar por componente violaria DRY; um monólito `trace-kit/` violaria o limite de 300 linhas e o SRP por dir. Alternativas: (a) helpers dentro de span-tree e re-import cruzado — rejeitada (acoplamento irmão-irmão, architecture.md § 2); (b) pacote separado @usetheo/trace — rejeitada (YAGNI, um pacote atende).

### D2 — Timestamps: `bigint` ns nativo com aceitação de ISO string

**Decision:** `startTime/endTime: bigint | string` — helpers normalizam para ns bigint na entrada (`toNs()` total, retorna null p/ inválido); toda matemática interna em bigint.

**Rationale:** o lens já opera em `*UnixNano` bigint com guarda de clock-skew (`durationMs` null quando end<start); ISO cobre phoenix/langfuse shapes. Alternativas: number ms (rejeitada — perde precisão ns e o shape do lens exigiria conversão no consumidor); só bigint (rejeitada — força conversão nos consumidores ISO).

### D3 — Split do SpanTree em 3 arquivos

**Decision:** `span-tree.tsx` (orquestrador + dual-path), `span-tree-row.tsx` (SpanRow com ARIA APG completo), `span-tree-virtual.tsx` (caminho virtualizado) — cada ≤300 linhas.

**Rationale:** a origem tem 433 LoC (> budget 300 do hook de qualidade); o corte natural é o mesmo do data-table M6 (ADR 0002-m6). Alternativas: um arquivo com override do hook (rejeitada — o budget existe por legibilidade); fundir row no virtual (rejeitada — row é compartilhado pelos dois caminhos).

### D4 — TraceCompare recebe lanes prontas (dados), nunca busca

**Decision:** `TraceCompareProps { laneA, laneB: CompareLane; align?: custom }` — fetch, react-query e URL `?ids=` ficam no lens; a lib entrega alinhamento estrutural (`alignSpanTrees` reimplementado como helper puro) e render.

**Rationale:** ADR D1 do blueprint (fronteira); os ~25 testes de integração ficam no consumidor. Alternativas: componente com fetcher injetável (rejeitada — API de dados no DS acopla transport); só o helper sem componente (rejeitada — o DoD pede o componente).

### D5 — Fase 6 (adoção) por commits atômicos no develop do theo-cloud

**Decision:** mesma mecânica do M7 — bump da lib no dashboard, substituição componente a componente com testes migrando de seletor no MESMO commit, deleções secas ao final com SHAs registrados no audit.

**Rationale:** precedente M7 validado (single-trunk; nota contratual PR→commit no run-file M7). Alternativas: PR único gigante (rejeitada — reviews do M7 mostraram valor do atômico); feature branch no theo-cloud (rejeitada — viola single-trunk deles).

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| API-lock: contratos generalizados de 1 consumidor real (R1 do grill) | High | Contratos validados nas 3 fontes do blueprint; TraceCompare (lens-derived) por último (D5 do blueprint); release só após adoção provar os 7 | Claude |
| ~65 testes migrados podem carregar acoplamento a testids do lens | Medium | Testes da lib reescritos contra papel ARIA/data-slot (convenção da lib), não testids do lens; a suíte do lens mantém os dela até a adoção | Claude |
| bigint em props públicas pode surpreender consumidores JSON-only | Medium | Aceitação dupla `bigint \| string` (ADR D2) + testes negativos de entrada inválida | Claude |
| Fase 6 cross-repo esbarra em WIP não relacionado do dashboard | Low | Commits por path explícito (precedente M7); nunca `git add -A` | Claude |
| Volume (7 componentes) estoura o ciclo | Medium | Fases independentes com mini-review por fase (Step 4.7); release pode cortar após Fase 5 com adoção na sequência imediata (DoD exige ambos antes do flip) | Paulo |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
F1: T1.0 tipos+helpers → T1.1 fixtures
F2: T2.0 SpanTree → T2.1 SpanWaterfall          (dependem de F1)
F3: T3.0 AttributesTable → T3.1 IOCards → T3.2 TraceTranscript   (F1; T3.2 usa padrões de T3.1)
F4: T4.0 SpanGraph                               (F1)
F5: T5.0 TraceCompare                            (F1, F2 — reusa bar-layout)
F6: T6.0 registry+release-prep → T6.1 adoção lens+deleções → T6.2 north-star delta
```

## Phase 1: Fundação de dados (lib)

### T1.0 — `TraceSpan` + helpers puros em `src/lib/trace/`

#### Objective
Criar `src/lib/trace/{types,duration,bar-layout,flatten,chat,graph-layout}.ts` com o tipo do blueprint e os helpers `toNs`, `durationMs`, `computeBarLayout`, `niceAxisTicks`, `flattenVisible`, `flattenAll`, `asChat`, `prettyValue`, `buildLayeredGraph`, `isSpanError` — todos puros, totais e exportados no barrel.

#### Why this step (action + reasoning — ReAct discipline)
Todos os 7 componentes consomem esses contratos (blueprint ADR D5): travá-los primeiro elimina retrabalho de assinatura nas fases seguintes e concentra a validação 3-fontes onde o R1 mora.

#### Evidence
Blueprint do M8 (`.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` — Coverage Corner 2, tipo e kinds; Corner 4 Q1/Q6, equações e layout). Origens: lens `trace-layout.ts` (336 LoC), `helpers.ts` (103 LoC), `graph-layout.ts`.

#### Files to edit
- `src/lib/trace/types.ts` (novo — TraceSpan, SpanKind, ChatMessage, TranscriptRow)
- `src/lib/trace/duration.ts`, `bar-layout.ts`, `flatten.ts`, `chat.ts`, `graph-layout.ts` (novos)
- `src/lib/trace/*.test.ts` (novos, co-locados)
- `src/index.ts` (exports)

#### Deep file dependency analysis
Helpers não importam React nem componentes (camada pura — architecture.md § 1); `graph-layout.ts` importa apenas `types.ts` + `flatten.ts`. Nenhum import de `src/components/**` permitido (verificável por grep no AC).

#### Deep Dives
Clock-skew (end<start → null), spans in-flight (end null → unbounded), órfãos (parentId sem match → raiz), janela de trace zero-duration (guard), bigint vs ISO na entrada (`toNs` total).

#### Tasks
1. RED: portar os ~30 testes puros classificados no blueprint (Corner 1) reescritos para a API nova.
2. GREEN: implementar helpers (reimplementação limpa; código do lens é do próprio ecossistema — MIT interno; nada do phoenix).
3. REFACTOR + barrel + docs JSDoc por função.

#### TDD
- `test_toNs_aceita_bigint_ns_e_iso_string_e_retorna_null_para_invalido` — `expect(toNs("not-a-date")).toBeNull()`
- `test_durationMs_retorna_null_quando_end_antes_de_start` — `expect(durationMs(s)).toBeNull()` com `endTime < startTime`
- `test_computeBarLayout_clampa_em_0_100_e_marca_unbounded_sem_end` — `expect(layout.widthPct).toBeLessThanOrEqual(100); expect(layout.unbounded).toBe(true)`
- `test_flattenVisible_respeita_collapsed_set_e_ordem_dfs` — `expect(rows.map(r=>r.span.id)).toEqual(["root","a","c"])`
- `test_asChat_detecta_array_chatml_e_rejeita_json_generico` — `expect(asChat('[{"role":"user","content":"x"}]')).not.toBeNull(); expect(asChat('{"a":1}')).toBeNull()`
- `test_buildLayeredGraph_bfs_deterministico_e_parent_malformado_vira_raiz` — `expect(nodes.find(n=>n.id==="orphan").y).toBe(0)`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/lib/trace` → 0 failed
- `grep -rn "from \"../../components\|from '@/components" src/lib/trace/` → 0 hits (camada pura)
- `pnpm typecheck` → exit 0

#### DoD
Helpers exportados no barrel; testes verdes; CHANGELOG `[Unreleased] § Added` com a entrada do trace-core.

### T1.1 — Fixtures de trace reais

#### Objective
Extrair para `src/test/fixtures/trace.ts` 3 fixtures: trace aninhado com ramificação+retry (do teste do lens), trace com órfão+clock-skew, trace >200 spans (gerador determinístico para virtualização).

#### Why this step (action + reasoning)
Os ~65 testes migrados e as stories das fases 2-5 consomem os mesmos dados; fixtures compartilhados evitam 7 cópias divergentes (DRY de conhecimento).

#### Evidence
Blueprint (`.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` — Corner 1, "fixtures extraíveis"); origem `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/pages/lens/trace-detail.test.tsx`.

#### Files to edit
- `src/test/fixtures/trace.ts` (novo)
- `src/test/fixtures/trace.test.ts` (novo — sanidade dos fixtures)

#### Deep file dependency analysis
Fixtures importam apenas `src/lib/trace/types.ts`.

#### Deep Dives
Gerador >200 spans SEM Math.random (determinístico por índice — regra de testes determinísticos).

#### Tasks
1. RED: `test_fixture_nested_tem_ramificacao_retry_e_erro`; `test_fixture_generator_produz_n_spans_deterministicos`.
2. GREEN: fixtures.

#### TDD
- `test_fixture_nested_tem_ramificacao_retry_e_erro` — `expect(flattenAll(NESTED_TRACE).some(s=>s.status==="ERROR")).toBe(true)`
- `test_fixture_generator_produz_n_spans_deterministicos` — `expect(makeTrace(250)).toEqual(makeTrace(250))`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/test/fixtures` → 0 failed

#### DoD
Fixtures usados por ≥ 1 teste de fase 2 quando ela chegar (wiring pillar).

## Phase 2: Pares tree/timeline

### T2.0 — `SpanTree` composite

#### Objective
`src/components/composites/span-tree/` (3 arquivos por ADR D3): árvore ARIA APG completa (treeitem/level/posinset/setsize/selected/expanded/group), dual-path com `virtualizeThreshold` default 200, ícone/cor por kind, badges de erro/latência/tokens, controlado (`selectedId/onSelect`, `collapsed/onToggleCollapse`).

#### Why this step (action + reasoning)
É o componente de maior LoC de origem (433) e o mais consumido (tree é a navegação primária do trace-detail); a fundação F1 já travou flatten/duration, restando o render — fazê-lo primeiro valida os helpers com o caso mais exigente.

#### Evidence
Blueprint (`.claude/knowledge-base/discoveries/blueprints/lens-observability-kit-blueprint.md` — Corner 4 Q2 e Corner 3 Q10). Origem lens `tree.tsx:87-92,99,183` (ARIA), `tree.tsx:3` (virtualizer). Padrões phoenix (kind icon/latency — descritos, não copiados).

#### Files to edit
- `src/components/composites/span-tree/{span-tree.tsx,span-tree-row.tsx,span-tree-virtual.tsx,index.ts}` (novos)
- `src/components/composites/span-tree/span-tree.test.tsx` + `span-tree.stories.tsx` (novos)
- `src/index.ts`, `registry/` (T6.0 consolida)

#### Deep file dependency analysis
Importa `src/lib/trace/*` + Badge/Button/cn; NUNCA importa outros composites do kit (irmãos desacoplados — architecture.md § 2).

#### Deep Dives
Virtualização com viewport injetado em teste (padrão M6 `virtualizerOptions.observeElementRect`); seleção não rouba foco durante navegação por teclado; setas ↑/↓ + Home/End (gap do lens — nível Arize).

#### Tasks
1. RED: migrar os testes de árvore do lens (ARIA, collapse, threshold, dup spanId) reescritos p/ data-slot + novos de teclado.
2. GREEN: 3 arquivos.
3. REFACTOR: extrair `useSpanKindColor` local (cores via tokens).
4. WIRING: story composta com fixture NESTED_TRACE + axe.

#### TDD
- `test_tree_expoe_semantica_aria_treeitem_completa` — `expect(row).toHaveAttribute("aria-level","2"); expect(row).toHaveAttribute("aria-posinset")`
- `test_collapse_esconde_subtree_e_atualiza_aria_expanded` — `expect(screen.queryByText("child-b")).toBeNull()`
- `test_acima_do_threshold_usa_caminho_virtualizado` — `expect(container.querySelector('[data-slot="span-tree-virtual"]')).toBeInTheDocument()` com `makeTrace(250)`
- `test_setas_navegam_e_enter_seleciona` — `await user.keyboard("{ArrowDown}{Enter}"); expect(onSelect).toHaveBeenCalledWith("span-2")`
- `test_span_id_duplicado_renderiza_todas_as_linhas` — `expect(screen.getAllByRole("treeitem")).toHaveLength(5)`
- Negativo: `test_root_sem_children_renderiza_item_unico_sem_group` — `expect(screen.queryByRole("group")).toBeNull()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/span-tree` → 0 failed
- `wc -l src/components/composites/span-tree/*.tsx` → nenhum > 300
- `pnpm vitest run src/components/composites/span-tree/span-tree.stories.test.tsx` → 0 failed (story smoke + axe: `expect(await axe(container)).toHaveNoViolations()`)

#### DoD
Exportado no barrel; CHANGELOG; testes+stories verdes.

### T2.1 — `SpanWaterfall` composite

#### Objective
`src/components/composites/span-waterfall/`: barras percentuais (`computeBarLayout`), AxisTicks (`niceAxisTicks`), hover-needle com timestamp, rollup de custo em parents, erro em destructive, in-flight unbounded, controlado como o tree.

#### Why this step (action + reasoning)
Par visual do tree (compartilham flatten/collapse/seleção); fazê-lo em seguida reusa os testes de layout já verdes de F1 e fecha a view-assinatura Arize.

#### Evidence
Blueprint (Corner 4 Q1 — decisão percentuais; extras do lens preservados). Origem lens `waterfall.tsx:35-52,67,105-111,159-167`.

#### Files to edit
- `src/components/composites/span-waterfall/{span-waterfall.tsx,index.ts,span-waterfall.test.tsx,span-waterfall.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/trace/*` + Badge/cn; não importa span-tree.

#### Deep Dives
Row-packing p/ spans assíncronos sobrepostos; `formatTimestamp` injetável (default ISO); needle por mousemove sem re-render em cascata (rAF/CSS var).

#### Tasks
1. RED: migrar testes de timeline do lens (barra por span visível, posição por computeBarLayout, erro, unbounded, click seleciona).
2. GREEN. 3. REFACTOR. 4. WIRING: story com trace ramificado + axe.

#### TDD
- `test_renderiza_barra_para_cada_span_visivel` — `expect(bars).toHaveLength(flattenVisible(root, collapsed).length)`
- `test_barra_posicionada_por_compute_bar_layout` — `expect(bar.style.left).toBe("25%")`
- `test_span_com_erro_usa_cor_destructive` — `expect(bar).toHaveClass(/destructive/)`
- `test_click_na_barra_seleciona_o_span` — `expect(onSelect).toHaveBeenCalledWith("span-3")`
- Negativo: `test_janela_zero_duration_nao_lanca_e_mostra_estado_honesto` — `expect(() => render(...)).not.toThrow()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/span-waterfall` → 0 failed
- `pnpm vitest run src/components/composites/span-waterfall` (inclui story smoke com axe assert) → 0 failed; `pnpm typecheck` → exit 0

#### DoD
Barrel + CHANGELOG + mini-review de fase (F2) PASS.

## Phase 3: Payloads

### T3.0 — `AttributesTable` composite

#### Objective
`src/components/composites/attributes-table/`: cards por namespace (collapsible), promoted badges, rows `<dl>`, masking fail-closed (`maskedKeys` predicate + `canReveal`), fallback JSON de valores complexos no `JsonViewer`.

#### Why this step (action + reasoning)
É o payload de menor acoplamento (não depende de ChatML) — abre a fase validando o padrão de composição com JsonViewer que T3.1/T3.2 reutilizam.

#### Evidence
Blueprint (Corner 4 Q4 — masking inegociável). Origem lens `attributes.tsx:28-177`.

#### Files to edit
- `src/components/composites/attributes-table/{attributes-table.tsx,index.ts,attributes-table.test.tsx,attributes-table.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa JsonViewer (primitive M2), Card/Badge/Button/CopyButton, `src/lib/trace/types.ts`.

#### Deep Dives
Invariante fail-closed: valor mascarado ausente do DOM inteiro (incl. title/aria/data-*) pré-reveal; CopyButton retido.

#### Tasks
1. RED: migrar os 5 testes de masking/attrs do lens + negativo do DOM.
2. GREEN. 3. REFACTOR. 4. WIRING: story com semconv real + axe.

#### TDD
- `test_valor_mascarado_ausente_do_dom_pre_reveal` — `expect(container.innerHTML).not.toContain("secret@ex.com")`
- `test_can_reveal_false_esconde_o_controle` — `expect(screen.queryByRole("button", {name:/reveal/i})).toBeNull()`
- `test_reveal_exibe_valor_e_copy` — `await user.click(reveal); expect(screen.getByText("secret@ex.com")).toBeInTheDocument()`
- `test_valor_objeto_renderiza_em_json_viewer` — `expect(container.querySelector('[data-slot="json-viewer"]')).toBeInTheDocument()`
- Negativo: `test_attrs_vazio_mostra_empty_state` — `expect(screen.getByText(/no attributes/i)).toBeInTheDocument()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/attributes-table` → 0 failed (inclui `expect(await axe(container)).toHaveNoViolations()`)

#### DoD
Barrel + CHANGELOG.

### T3.1 — `IOCards` composite

#### Objective
`src/components/composites/io-cards/`: detecção `asChat` → message/tool-call/tool-result cards; fallback `JsonViewer`; copy do RAW; `renderMarkdown` slot (default texto plano seguro); truncamento 8000 chars com "Show more".

#### Why this step (action + reasoning)
Payload intermediário: introduz ChatML cards que o transcript reusa; depende só de F1 + JsonViewer.

#### Evidence
Blueprint (Corner 4 Q5; ADRs D2/D3). Origem lens `io-cards.tsx:26-29,92-104,151-182` e `markdown.tsx:15-42`; langfuse `chat-message-utils.ts:74-82` (parse duplo de tool_calls).

#### Files to edit
- `src/components/composites/io-cards/{io-cards.tsx,message-card.tsx,index.ts,io-cards.test.tsx,io-cards.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/trace/chat.ts`, JsonViewer, Card/Badge/CopyButton. ZERO import de markdown lib (slot).

#### Deep Dives
Parse duplo de tool_calls (top-level e aninhado em content JSON); redacted marker preservado; default renderMarkdown = `<p>` com quebras (nunca HTML).

#### Tasks
1. RED: migrar os testes de chat/IO do lens (cards por role, tool-call card, fallback JSON, histórico colapsado, `dangerouslySetInnerHTML` ausente).
2. GREEN. 3. REFACTOR. 4. WIRING: story chat + story JSON + axe.

#### TDD
- `test_renderiza_card_por_mensagem_com_badge_de_role` — `expect(screen.getAllByTestId(/message-card/)).toHaveLength(4)` (via data-slot)
- `test_tool_call_e_result_pareiam_por_tool_call_id` — `expect(within(result).getByText(/call_1/)).toBeInTheDocument()`
- `test_nao_chat_cai_no_json_viewer` — `expect(container.querySelector('[data-slot="json-viewer"]')).toBeInTheDocument()`
- `test_historico_longo_colapsa_head_tail_com_show_more` — `expect(screen.getByRole("button", {name:/show 4 more/i})).toBeInTheDocument()` (10 msgs)
- Negativo (segurança): `test_default_render_nao_interpreta_html` — `expect(container.querySelector("img")).toBeNull()` com `content:"<img src=x onerror=alert(1)>"`
- Negativo: `test_nunca_usa_dangerously_set_inner_html` — grep no AC

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/io-cards` → 0 failed
- `grep -rn "dangerouslySetInnerHTML" src/components/composites/io-cards src/components/composites/trace-transcript` → 0 hits

#### DoD
Barrel + CHANGELOG.

### T3.2 — `TraceTranscript` composite

#### Objective
`src/components/composites/trace-transcript/`: row model (`TranscriptRow`), group-headers colapsáveis (subagentes), stats inline (tokens/custo/duração), virtualização acima do threshold, seleção controlada, `renderMarkdown` slot.

#### Why this step (action + reasoning)
Fecha a fase de payloads reusando MessageCard (T3.1) e flatten/virtual (F1/F2) — o último a entrar porque compõe os dois anteriores.

#### Evidence
Blueprint (Corner 4 Q3). Origem lens `transcript.tsx` (300 LoC; virtualizer em `transcript.tsx:2`).

#### Files to edit
- `src/components/composites/trace-transcript/{trace-transcript.tsx,index.ts,trace-transcript.test.tsx,trace-transcript.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa io-cards APENAS via composição pública documentada? NÃO — reusa `MessageCard` interno via export nomeado do io-cards (mesma família); registrado no registry como dependência entre itens.

#### Deep Dives
Group collapse não quebra virtualização (rows re-flattened); scroll-into-view na seleção via virtualizer.scrollToIndex.

#### Tasks
1. RED: migrar testes de transcript do lens (cards por row, group collapse, virtualização, seleção).
2. GREEN. 3. REFACTOR. 4. WIRING: story com trace de subagentes + axe.

#### TDD
- `test_renderiza_card_por_row_do_transcript` — `expect(rows).toHaveLength(TRANSCRIPT_ROWS.length)`
- `test_group_header_colapsa_subtree_de_subagente` — `await user.click(header); expect(screen.queryByText("sub-span")).toBeNull()`
- `test_acima_do_threshold_virtualiza` — `expect(container.querySelector('[data-slot="trace-transcript-virtual"]')).toBeInTheDocument()`
- `test_selecao_faz_scroll_to_index` — spy em scrollToIndex chamado com o índice da row
- Negativo: `test_rows_vazias_mostram_empty_state` — `expect(screen.getByText(/no transcript/i)).toBeInTheDocument()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/trace-transcript` → 0 failed (inclui axe assert)
- `python3 .claude/skills/implement/scripts/mini_review.py lens-observability-kit --phase 3` → PHASE_REVIEW_PASS

#### DoD
Barrel + CHANGELOG.

## Phase 4: Grafo

### T4.0 — `SpanGraph` composite

#### Objective
`src/components/composites/span-graph/`: renderer SVG nativo sobre `buildLayeredGraph` (F1) — nodes rect+kind-dot+label, edges line com destaque de caminho (`computePath`), oversize honesto (`nodeCap` default 60), seleção controlada.

#### Why this step (action + reasoning)
Único componente com veredicto de viabilidade próprio (Q6) — feito após os payloads para não bloquear a fase 3 caso o render precise de iteração; o layout já está testado em F1.

#### Evidence
Blueprint (Corner 4 Q6 — VEREDICTO SVG puro; ADR D4). Origem lens `span-graph.tsx:46-75`, `graph-layout.ts:44-169`. Langfuse elkjs+d3 REJEITADO (deps).

#### Files to edit
- `src/components/composites/span-graph/{span-graph.tsx,index.ts,span-graph.test.tsx,span-graph.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/trace/graph-layout.ts` + cn; zero d3/elk (verificável no AC).

#### Deep Dives
`role="group"` + `aria-label` no svg; nodes como `<g role="button">` focáveis; cap com mensagem honesta "graph too large (N spans > cap)".

#### Tasks
1. RED: migrar os 3 testes de graph do lens (nodes+edges, oversize honesto, parent malformado) + teclado.
2. GREEN. 3. REFACTOR. 4. WIRING: story + axe.

#### TDD
- `test_renderiza_node_por_span_e_edge_por_parentesco` — `expect(svg.querySelectorAll('[data-slot="span-graph-node"]')).toHaveLength(7)`
- `test_oversize_mostra_estado_honesto_sem_render` — `expect(screen.getByText(/too large/i)).toBeInTheDocument()` com `makeTrace(250)`
- `test_parent_malformado_ainda_renderiza_como_raiz` — não lança + node presente
- `test_node_click_e_enter_selecionam` — `expect(onSelect).toHaveBeenCalledWith("span-2")`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/span-graph` → 0 failed
- `grep -rn "d3\|elkjs\|force-graph" src/components/composites/span-graph package.json` → 0 hits novos

#### DoD
Barrel + CHANGELOG + mini-review F4 PASS.

## Phase 5: Compare

### T5.0 — `TraceCompare` composite (lens-derived)

#### Objective
`src/components/composites/trace-compare/`: helper puro `alignSpanTrees` (matched/only-in-A/only-in-B, delta suprimido sem par) + componente de 2 lanes (header, métricas `<dl>`, LaneTimeline via bar-layout) + DiffRow table + DeltaBadge.

#### Why this step (action + reasoning)
Último componente por ser lens-derived (EC-3 do discovery): API menos validada externamente fica ajustável até o release, minimizando o R1 residual.

#### Evidence
Blueprint (Corner 4 Q7 — sem equivalente em peer; contrato de dados). Origem lens `compare.tsx:30-312`.

#### Files to edit
- `src/lib/trace/align.ts` (novo — helper puro)
- `src/components/composites/trace-compare/{trace-compare.tsx,index.ts,trace-compare.test.tsx,trace-compare.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa bar-layout/flatten (F1) + Badge/Card/EmptyState; NUNCA fetch (ADR D4 deste plano).

#### Deep Dives
Align com spans reordenados/duplicados (retry) e ciclos malformados (visited set); deltas honestos (nunca fabricar par 1:1).

#### Tasks
1. RED: testes de align (matched/only-in/dup/ciclo) + render de lanes/deltas.
2. GREEN. 3. REFACTOR. 4. WIRING: story com 2 fixtures divergentes + axe.

#### TDD
- `test_align_marca_only_in_a_e_suprime_delta` — `expect(row.status).toBe("only-in-a"); expect(row.delta).toBeUndefined()`
- `test_align_com_ciclo_malformado_termina` — `expect(() => alignSpanTrees(a,b)).not.toThrow()`
- `test_delta_badge_mostra_direcao_e_percentual` — `expect(screen.getByText("+25%")).toBeInTheDocument()`
- Negativo: `test_lane_pending_mostra_skeleton_sem_delta` — `expect(screen.queryByText(/%/)).toBeNull()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/lib/trace src/components/composites/trace-compare` → 0 failed
- `python3 .claude/skills/implement/scripts/mini_review.py lens-observability-kit --phase 5` → PHASE_REVIEW_PASS

#### DoD
Barrel + CHANGELOG.

## Phase 6: Registry, adoção e fechamento

### T6.0 — Registry + full gates da lib

#### Objective
Itens de registry: `trace-core` (registry:lib com `src/lib/trace/*`) + 7 itens de componente (deps → trace-core, json-viewer onde aplicável); `registry:build` + `registry:validate` verdes; full suite/typecheck/lint/format.

#### Why this step (action + reasoning)
O DoD padrão da lib exige registry válido por componente; consolidar após F5 evita 7 rebuilds parciais.

#### Evidence
Precedente M0-M6 (registry por componente); `scripts/build-registry.ts`.

#### Files to edit
- `registry/*.json` (gerados) — via `pnpm registry:build`
- `scripts/` apenas se o builder precisar do tipo registry:lib (verificar antes; NÃO deve)

#### Deep file dependency analysis
Registry referencia arquivos existentes (validator cobra).

#### Deep Dives
Dependências entre itens (trace-transcript → io-cards → json-viewer) declaradas.

#### Tasks
1. RED: `registry:validate` como oráculo (falha antes do build). 2. GREEN: build+ajustes. 3. Full gates.

#### TDD
- Oráculo executável: `pnpm registry:build && pnpm registry:validate` → exit 0
- `pnpm test:run` → 0 failed; `pnpm lint` → 0; `pnpm format:check` → 0

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm registry:validate` → exit 0
- `pnpm test:run && pnpm typecheck && pnpm lint` → todos exit 0

#### DoD
Pronto para `/code-quality` + `/review` + `/release` (fora do plano — ciclo).

### T6.1 — Adoção no lens + deleções (cross-repo, playbook M7)

#### Objective
No theo-cloud develop (commits atômicos por path): bump da lib para a versão do M8; substituir waterfall/tree/transcript/io-cards/attributes/span-graph pelo kit em `trace-detail/index.tsx` e compare pela TraceCompare em `compare.tsx`; migrar os ~25 testes que ficam (URL/fetch) para os novos data-slots; DELETAR os 7 arquivos hand-rolled + helpers órfãos; suíte do dashboard 100% verde.

#### Why this step (action + reasoning)
O DoD do M8 é adoção com deleção (prova material, não import decorativo) — mesmo critério que fez o M7 valer.

#### Evidence
DoD do ROADMAP § M8; playbook M7 (`.claude/knowledge-base/plans/adoption-dedup-plan.md` — Fases 2-4); inventário de imports no blueprint (Corner 3 Q11).

#### Files to edit
(cross-repo) `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/`: `package.json`, `src/pages/lens/trace-detail/index.tsx`, `src/pages/lens/compare.tsx`, testes co-locados; DELETE dos 7 + `graph-layout.ts` (o `trace-layout.ts` compartilhado só se ficar órfão — verificação 2× antes de deletar, precedente M7).

#### Deep file dependency analysis
`trace-layout.ts` tem outros consumidores? Verificar por grep ANTES (se sim, permanece e o lens importa da lib apenas nos pontos migrados).

#### Deep Dives
markdown.tsx do lens vira o `renderMarkdown` injetado (react-markdown+sanitize continua LÁ); CodeMirror pode sair se a adoção aceitar JsonViewer (decisão na adoção, registrada no commit).

#### Tasks
1. Bump + install + typecheck. 2. Substituição por componente (1 commit cada, testes juntos). 3. Deleções secas com verificação 2× (grep de import → 0). 4. Suíte full verde.

#### TDD
- Oráculo por commit: `pnpm vitest run src/pages/lens` → 0 failed no repo dashboard
- Deleção: `grep -rn "trace-detail/tree\|trace-detail/waterfall" dashboard/src` → 0 hits pós-delete

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `cd dashboard && pnpm vitest run` → 0 failed (suíte completa)
- `cd dashboard && for f in waterfall tree transcript io-cards attributes span-graph; do test ! -f src/pages/lens/trace-detail/$f.tsx || exit 1; done` → exit 0 (deleções efetivas)

#### DoD
Commits pushed; WIP alheio intocado.

### T6.2 — North-star delta + audit

#### Objective
Re-rodar os comandos canônicos do audit M7 e registrar `.claude/knowledge-base/audits/lens-observability-northstar-2026-MM-DD.md` com baseline 48 → pós-M8, tabela de deleções com SHAs e LoC removidas.

#### Why this step (action + reasoning)
DoD do M8 (norte-star registrado) e o mecanismo de honestidade que evita "adoção decorativa".

#### Evidence
Método canônico em `.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` (comandos literais).

#### Files to edit
- `.claude/knowledge-base/audits/lens-observability-northstar-*.md` (novo)
- `.claude/knowledge-base/roadmap-runs/M8-2026-07-15.md` (trail)

#### Deep file dependency analysis
(n/a — artefato)

#### Deep Dives
Delta esperado: +8 símbolos (7 componentes + TraceSpan/type exports contam pela regra do audit — conferir a regra de contagem de types do método canônico antes de afirmar).

#### Tasks
1. Rodar comandos. 2. Escrever audit. 3. Atualizar trail.

#### TDD
- Oráculo: os comandos do audit executados colam saída literal no arquivo (verificável por re-execução)

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `test -f .claude/knowledge-base/audits/lens-observability-northstar-*.md && grep -c "^\$ " $(ls .claude/knowledge-base/audits/lens-observability-northstar-*.md)` ≥ 2 (comandos literais colados) e `grep -cE "[0-9a-f]{7,}" ...` ≥ 7 (SHAs de deleção)

#### DoD
Pronto para review/release do milestone.

## Edge cases (MUST-FIX absorvidos — /edge-case-plan)

| EC | Risco | Absorção (owner: Claude) |
|---|---|---|
| EC-1 | T3.2 importa `MessageCard` de io-cards — contradiz a nota "irmãos desacoplados" do T2.0 | Direção de dependência PERMITIDA e declarada: `trace-transcript → io-cards → json-viewer` (unidirecional, registrada no registry); span-tree/waterfall/graph seguem sem imports de irmãos. Precedente: composites da lib já compõem primitives/composites (ConfirmDialog→Dialog). AC do T3.2 ganha grep de direção reversa (`grep -rn "trace-transcript" src/components/composites/io-cards/` → 0). |
| EC-2 | `bigint` em props quebra serialização de args/controls do Ladle nas stories | Stories usam fixtures diretos (sem args controls sobre props bigint); nota no JSDoc do TraceSpan. Teste de story smoke cobre render. |
| EC-3 | `trace-layout.ts` do lens pode ter consumidores fora do trace-detail (traces list, peek-sheet) | T6.1 já exige grep 2× pré-deleção; reforço: NUNCA deletar `trace-layout.ts` no M8 — só os 7 arquivos do DoD; o lens migra imports gradualmente. |
| EC-4 | Release do kit sem a adoção provada = API pública travada com R1 aberto | Release 0.23.0 só corta APÓS T6.1 verde (adoção provou os 7); ordem no Global DoD já cobre — reforçada aqui como gate explícito do `/release`. |

## Coverage Matrix

| Claim do Goal / DoD | Tasks |
|---|---|
| TraceSpan + helpers puros exportados | T1.0 |
| Fixtures reais compartilhados | T1.1 |
| SpanTree publicado (stories+axe+testes) | T2.0 |
| SpanWaterfall publicado | T2.1 |
| AttributesTable publicado (masking fail-closed) | T3.0 |
| IOCards publicado (ChatML + fallback JsonViewer) | T3.1 |
| TraceTranscript publicado | T3.2 |
| SpanGraph publicado (SVG puro, zero dep) | T4.0 |
| TraceCompare publicado (lens-derived, último) | T5.0 |
| Registry válido por componente | T6.0 |
| Lens adota os 7 e deleta hand-rolled (SHAs) | T6.1 |
| North-star delta registrado | T6.2 |
| Zero dependência nova | T1.0, T4.0, T6.0 (ACs com grep/package.json) |

**Coverage: 100% — todo claim mapeado em task explícita (T1.0, T1.1, T2.0, T2.1, T3.0, T3.1, T3.2, T4.0, T5.0, T6.0, T6.1, T6.2).**

## Global Definition of Done

- [ ] `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm registry:validate` → todos exit 0
- [ ] `git diff v0.22.1..HEAD -- package.json | grep '"dependencies"' -A5` sem linha nova de dep
- [ ] Suíte do dashboard 100% verde pós-adoção; 7 deleções com SHAs no audit
- [ ] CHANGELOG `[Unreleased]` com as entradas do kit
- [ ] `/code-quality` ∈ {PASS, PASS_WITH_CAVEATS} e `/review` READY_TO_MERGE antes do `/release`

## Failure scenarios (when I/O external)

(none — no external I/O touched: componentes recebem dados via props; fetch permanece no consumidor)

## Critical paths (para D4 mutation, se rodar)

`src/lib/trace/bar-layout.ts`, `src/lib/trace/flatten.ts`, `src/lib/trace/align.ts` — matemática de layout e alinhamento são onde mutantes sobrevivem silenciosamente.

## Final Phase: Integration Validation (MANDATORY)

1. Ladle: as 7 stories novas renderizam com o tema (verificação visual + axe addon).
2. `pnpm build` + `pnpm registry:build` limpos; pack dry-run lista os arquivos novos.
3. Dashboard: fluxo completo trace-detail (tree→waterfall→transcript→attributes→graph→compare) manualmente no dev server contra fixtures — evidência de screenshots no review.
4. Wiring triad por componente: caller real (lens), teste de integração (suíte do lens migrada), métrica de runtime (data-slot presente para observabilidade de uso — convenção da lib).
