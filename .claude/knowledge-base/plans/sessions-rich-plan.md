---
slug: sessions-rich
milestone_id: M9
created_at: 2026-07-15
goal: Publicar SessionSummary + SessionTimeline + o tipo SessionTraceItem e o helper aggregateSession no @usetheo/ui, e construir a tela de session detail no theo-lens (traces em ordem temporal + métricas agregadas) sobre a traces-list já filtrável por sessão, com zero dependência nova.
---

# Plan: Sessions ricas (M9)

> **Version 1.0** — Executa o blueprint do M9 (`.claude/knowledge-base/discoveries/blueprints/sessions-rich-blueprint.md` — SHIPPABLE): UI-only (risco R1 resolvido — sem `/sessions/{id}` no BFF), reusa o trace-core do M8 para a barra temporal (ADR D2 do blueprint), agrega client-side sobre os traces filtrados por sessão (ADR D1). Zero dep nova.

## Goal

Fechar o maior stub do lens: promover `SessionSummary` + `SessionTimeline` ao DS (DoD padrão) e construir a session detail page no theo-lens consumindo-os, deletando o stub-como-lista.

## Context

ROADMAP § M9 (V2, gap P0 do gap analysis). Blueprint SHIPPABLE. O lens `sessions.tsx` (134 LoC) é só uma lista de sessionId+traceCount; a traces-list já aceita `session_id` e retorna os campos necessários por trace.

## Baseline Context (deep review of current state)

### Files that will be touched

**Lib @ `437a7f8e` (v0.23.0, develop).** Novos: `src/lib/session/{types,aggregate}.ts` (+ testes), `src/components/composites/{session-summary,session-timeline}/*`, `registry/*` (gerados). Editados: `src/index.ts`, `CHANGELOG.md`. Reusa (M8): `src/lib/trace/bar-layout.ts` (`computeTraceBounds`, `computeBarLayout`), `src/lib/trace/duration.ts` (`formatDurationMs`, `toNs`).

| Arquivo reusado | Papel no M9 |
|---|---|
| `src/lib/trace/bar-layout.ts` | Janela + barra temporal do SessionTimeline |
| `src/lib/trace/duration.ts` | `formatDurationMs`/`toNs` para labels e normalização |
| `Badge`, `Card`, `EmptyState` | Blocos de composição |

**Lens (consumidor) @ theo-cloud develop, `dashboard/src/pages/lens/`:**

| Arquivo | LoC | Vira |
|---|---|---|
| `sessions.tsx` | 134 | lista de sessões com link p/ session detail (mantém a lista, adiciona navegação) |
| (novo) `session-detail.tsx` | — | tela nova consumindo SessionSummary+SessionTimeline |
| `traces/columns.tsx` (tipo `Trace`) | — | fonte do `SessionTraceItem` (mapper local) |

### Current callers / dependents

Hoje ZERO callers na lib (componentes novos). Pós-adoção: `dashboard/src/pages/lens/session-detail.tsx`. Dependents internos: nenhum entre os 2 componentes (irmãos desacoplados); ambos dependem de `src/lib/session/*` e reusam `src/lib/trace/*`.

### Domain glossary

**Glossário:** sessão = conjunto de traces que compartilham `session.id`; trace = execução de agente (árvore de spans); janela da sessão = [min startTime, max endTime] sobre os traces; erro de sessão = contagem de traces com status ERROR.

### Architecture boundaries affected

**Fronteira (herdada do M8, ADR D1 blueprint):** a lib recebe DADOS via props e expõe callbacks; fetch/URL/agregação-de-fonte ficam no consumidor. `aggregateSession` é puro (recebe a lista, devolve métricas).

## Prior Art & Related Work

- Blueprint do M9 (`.claude/knowledge-base/discoveries/blueprints/sessions-rich-blueprint.md`): contratos + ADRs D1/D2.
- Gap analysis (`.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`): sessions é gap P0.
- Trace-core do M8 (`src/lib/trace/`): bar-layout + duration reusados (DRY).
- Playbook de adoção M7/M8: bump → substituição → deleção com SHAs.

## Objective

- [ ] `SessionSummary` + `SessionTimeline` + tipo `SessionTraceItem` + `aggregateSession` exportados, cada componente com stories (+axe), testes e registry válido
- [ ] Suíte da lib 100% verde; typecheck/lint/format limpos; `registry:validate` PASS
- [ ] Lens: session detail page consumindo os componentes; suíte do dashboard verde
- [ ] Delta north-star registrado
- [ ] Zero dependência nova (`package.json` da lib inalterado em `dependencies`)

## Dependencies

Nenhuma dependência NOVA (Rule 9 por reuso — rung 4 da parsimony). Deps tocadas (já instaladas):

| Dependência | Versão | Uso | Rule 9 |
|---|---|---|---|
| `react`/`react-dom` | peer `^18 \|\| ^19` | runtime | — |
| (dev) `vitest`, `@testing-library/react`, `axe-core` | lockfile | testes + a11y | — |

Nenhum manifesto alterado → `/deps-audit` plan-bound confirma ausência de dep nova.

## ADRs

### D1 — `src/lib/session/` separado do `src/lib/trace/`

**Decision:** tipos+helper de sessão em `src/lib/session/{types,aggregate}.ts`; componentes em `src/components/composites/{session-summary,session-timeline}/`. Registry: 1 item lib `session` + 2 itens de componente.

**Rationale:** sessão é um conceito de nível-trace (agrega traces), distinto de span; misturar em `trace/` violaria SRP do módulo. Reusa `trace/` sem se fundir. Alternativas: pôr em `trace/` (rejeitada — SRP; sessão não é span-math); pacote separado (rejeitada — YAGNI).

### D2 — Barra temporal reusa `computeBarLayout` do trace-core (M8)

**Decision:** `SessionTimeline` usa `computeTraceBounds`/`computeBarLayout`/`formatDurationMs` do M8.

**Rationale:** a matemática de janela+barra é idêntica em nível trace (blueprint ADR D2). DRY + zero dep. Alternativa: helper próprio (rejeitada — duplicaria).

### D3 — Componentes controlados; agregação client-side no consumidor

**Decision:** `SessionSummary`/`SessionTimeline` recebem `items: SessionTraceItem[]` + `selectedId?`/`onSelect?`; a tela do lens busca `?session_id=X` e passa a lista. `aggregateSession` é puro e exportado (o consumidor OU o SessionSummary o chamam).

**Rationale:** fronteira DS herdada do M8 (dados via props, sem fetch). Alternativa: componente com fetcher (rejeitada — acopla transport ao DS).

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Sem backend de session-detail → sessão grande = muitos traces na lista | Medium | a traces-list já pagina; a tela consome uma página por vez; `SessionTimeline` virtualiza se > threshold (reusa react-virtual do M6) | Claude |
| Métricas agregadas podem divergir de um futuro `/sessions/{id}` do engine | Low | `aggregateSession` é honesto e documentado (custo/tokens ausentes = 0, nunca NaN); quando o engine expuser, o consumidor troca a fonte sem tocar o DS | Claude |
| Timestamps ISO vs ns (traces-list usa `startTimeUnixNano`) | Low | `SessionTraceItem.startTime: bigint \| string` + `toNs` total (herdado do M8, ADR D2 do plano M8) | Claude |
| Fase de adoção cross-repo esbarra em WIP do dashboard | Low | commits por path explícito (precedente M7/M8); nunca `git add -A` | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
F1: T1.0 tipos+aggregateSession (puro)
F2: T2.0 SessionSummary   (F1)
F3: T3.0 SessionTimeline  (F1, reusa trace-core)
F4: T4.0 registry+release-prep  (F2, F3)
F5: T5.0 adoção lens (session-detail page + navegação) + north-star  (F4 released)
```

## Phase 1: Fundação de dados (lib)

### T1.0 — `SessionTraceItem` + `aggregateSession` puro

#### Objective
`src/lib/session/types.ts` (tipo) + `src/lib/session/aggregate.ts` (`aggregateSession(items) → { traceCount, windowMs, totalCostUsd, totalTokens, errorCount, models }`) — puro, total, exportado no barrel.

#### Why this step (action + reasoning — ReAct discipline)
Ambos os componentes consomem o tipo e as métricas; travar primeiro elimina retrabalho de assinatura e concentra a validação da agregação honesta.

#### Evidence
Blueprint (`.claude/knowledge-base/discoveries/blueprints/sessions-rich-blueprint.md` — Corner 2, tipo; Corner 4 Q1, agregação). Fonte lens: `dashboard/src/pages/lens/traces/columns.tsx` (tipo `Trace`).

#### Files to edit
- `src/lib/session/types.ts`, `src/lib/session/aggregate.ts`, `src/lib/session/index.ts` (novos)
- `src/lib/session/aggregate.test.ts` (novo)
- `src/index.ts` (exports)

#### Deep file dependency analysis
`aggregate.ts` importa `src/lib/trace/duration.ts` (`toNs`) + `src/lib/trace/bar-layout.ts` (`computeTraceBounds` sobre um shape adaptado) OU reimplementa a janela sobre `SessionTraceItem`. Nenhum import de `src/components/**` (camada pura — grep no AC).

#### Deep Dives
Custo/tokens ausentes → 0 (nunca NaN); janela com startTime imparseável → o item é ignorado no cálculo da janela; lista vazia → tudo 0/[].

#### Tasks
1. RED: testes de agregação (soma, ausência→0, erro-count, janela, vazio).
2. GREEN: tipo + helper.
3. REFACTOR + barrel + JSDoc.

#### TDD
- `test_aggregateSession_soma_custo_e_tokens` — `expect(aggregateSession(items).totalCostUsd).toBeCloseTo(0.06)`
- `test_aggregateSession_custo_ausente_conta_zero_nunca_nan` — `expect(aggregateSession([{id:"a"}]).totalCostUsd).toBe(0)`
- `test_aggregateSession_conta_erros` — `expect(aggregateSession(items).errorCount).toBe(1)` com um item status ERROR
- `test_aggregateSession_janela_e_max_end_menos_min_start` — `expect(aggregateSession(items).windowMs).toBe(5000)`
- `test_aggregateSession_models_distintos` — `expect(aggregateSession(items).models.sort()).toEqual(["gpt","haiku"])`
- Negativo: `test_aggregateSession_lista_vazia_retorna_zeros` — `expect(aggregateSession([])).toMatchObject({traceCount:0,windowMs:0,errorCount:0})`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/lib/session` → 0 failed
- `grep -rn "from \"../../components\|from '@/components" src/lib/session/` → 0 hits (camada pura)
- `pnpm typecheck` → exit 0

#### DoD
Exportado no barrel; testes verdes; CHANGELOG `[Unreleased] § Added`.

## Phase 2: SessionSummary

### T2.0 — `SessionSummary` composite

#### Objective
`src/components/composites/session-summary/`: um `<dl>` de métricas agregadas (traceCount, janela via `formatDurationMs`, ∑custo, ∑tokens, erros em destaque destructive quando > 0, models). Recebe `items` OU `metrics` pré-agregadas.

#### Why this step (action + reasoning)
Componente de menor acoplamento (só agrega+exibe); abre a fase validando o consumo do `aggregateSession`.

#### Evidence
Blueprint (Corner 4 Q1). Padrão phoenix `SessionDetailsTracesView` (numTraces+latency+cost) — descrito, não copiado (ELv2).

#### Files to edit
- `src/components/composites/session-summary/{session-summary.tsx,index.ts,session-summary.test.tsx,session-summary.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/session/*`, `src/lib/trace/duration.ts`, Card/Badge; não importa session-timeline.

#### Deep Dives
Erro > 0 em destructive; sums de zero são honestos (`$0.0000`, `0` tokens — não em-dash); janela nula → "—".

#### Tasks
1. RED: testes de render (métricas presentes, erro destacado, vazio→zeros honestos).
2. GREEN. 3. REFACTOR. 4. WIRING: story + axe.

#### TDD
- `test_mostra_contagem_de_traces_e_janela` — `expect(screen.getByText(/3 traces/i)).toBeInTheDocument()`
- `test_erro_maior_que_zero_em_destructive` — `expect(container.querySelector('[data-slot="session-error"][data-error="true"]')).toBeInTheDocument()`
- `test_custo_zero_e_honesto_nao_em_dash` — `expect(screen.getByTestId("session-cost")).toHaveTextContent("$0.0000")`
- Negativo: `test_lista_vazia_mostra_zeros_nao_crash` — `expect(() => render(<SessionSummary items={[]} />)).not.toThrow()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/session-summary` → 0 failed (inclui `expect(await axe(container)).toHaveNoViolations()`)
- `pnpm typecheck` → exit 0

#### DoD
Barrel + CHANGELOG.

## Phase 3: SessionTimeline

### T3.0 — `SessionTimeline` composite

#### Objective
`src/components/composites/session-timeline/`: lista temporal (ordenada por startTime) de traces; cada linha = timestamp + name + barra de duração relativa à janela (via `computeBarLayout`/`computeTraceBounds`) + status + custo/tokens; controlado (`selectedId`/`onSelect`); virtualiza acima do threshold.

#### Why this step (action + reasoning)
Reusa a fundação F1 + o trace-core do M8; é a view-assinatura da sessão (o replay temporal que o stub não tem).

#### Evidence
Blueprint (Corner 4 Q2; ADR D2). Padrão langfuse `session/TraceRow` (timestamp+name+latency) + phoenix TraceRowList.

#### Files to edit
- `src/components/composites/session-timeline/{session-timeline.tsx,index.ts,session-timeline.test.tsx,session-timeline.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `src/lib/session/*`, `src/lib/trace/{bar-layout,duration}.ts`, `@tanstack/react-virtual` (M6), Badge; não importa session-summary.

#### Deep Dives
Ordenação estável por startTime (ties por id); barra unbounded p/ trace sem end; virtualização com viewport injetado em teste (padrão M6/M8); status ERROR em destructive.

#### Tasks
1. RED: testes (uma linha por trace, ordem temporal, barra posicionada, click seleciona, virtualização, empty).
2. GREEN. 3. REFACTOR. 4. WIRING: story + axe.

#### TDD
- `test_renderiza_uma_linha_por_trace` — `expect(screen.getAllByRole("listitem")).toHaveLength(3)`
- `test_ordena_por_start_time` — `expect(rows.map(nome)).toEqual(["primeiro","segundo","terceiro"])`
- `test_barra_posicionada_por_compute_bar_layout` — `expect(bar.style.left).toMatch(/%$/)`
- `test_click_na_linha_dispara_onSelect` — `expect(onSelect).toHaveBeenCalledWith("trace-2")`
- `test_acima_do_threshold_virtualiza` — `expect(container.querySelector('[data-slot="session-timeline-virtual"]')).toBeInTheDocument()`
- Negativo: `test_lista_vazia_mostra_empty_state` — `expect(screen.getByText(/no traces/i)).toBeInTheDocument()`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/session-timeline` → 0 failed (inclui axe assert)
- `python3 .claude/skills/implement/scripts/mini_review.py sessions-rich --phase 3` → PHASE_REVIEW_PASS OR gates diretos verdes (typecheck+lint+tests)

#### DoD
Barrel + CHANGELOG.

## Phase 4: Registry + release da lib

### T4.0 — Registry + full gates

#### Objective
Itens de registry: `session` (registry:lib) + `session-summary` + `session-timeline`; `registry:build`+`registry:validate` verdes; full suite/typecheck/lint/format.

#### Why this step (action + reasoning)
DoD padrão exige registry válido por componente.

#### Evidence
Precedente M8 (registry descriptor-driven).

#### Files to edit
- `registry/{session,session-summary,session-timeline}.json` (novos) → `pnpm registry:build`

#### Deep file dependency analysis
`session-timeline` depende de `session`, `trace`, `badge`, `tailwind-preset`; `session-summary` de `session`, `trace`, `card`, `badge`, `tailwind-preset`.

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

### T5.0 — Session detail page + navegação + north-star

#### Objective
No theo-cloud develop: bump da lib; novo `session-detail.tsx` (rota `/observability/sessions/:sessionId`) que busca `?session_id=X` na traces-list, mapeia para `SessionTraceItem`, e renderiza `SessionSummary` + `SessionTimeline` (cada trace linka p/ trace detail); `sessions.tsx` ganha link de row → session detail (deixa de ser dead-end); suíte do dashboard verde; north-star registrado.

#### Why this step (action + reasoning)
O DoD do M9 é a tela rica adotada (prova material), não só os componentes publicados.

#### Evidence
DoD do ROADMAP § M9; playbook M7/M8; contrato traces-list (`traces/columns.tsx`).

#### Files to edit
(cross-repo) `dashboard/`: `package.json`, `src/pages/lens/session-detail.tsx` (novo), `src/pages/lens/sessions.tsx` (link de row), rota no router, testes co-locados.

#### Deep file dependency analysis
`session-detail.tsx` reusa o fetch/params já usados pela traces page; mapper local `Trace → SessionTraceItem`.

#### Deep Dives
Sessão sem traces → empty honesto; deep-link `?session_id` inválido → estado vazio, sem crash.

#### Tasks
1. Bump + install + typecheck. 2. session-detail page + rota + navegação. 3. Testes de integração (fetch+render+empty). 4. Full suite verde.

#### TDD
- Oráculo: `cd dashboard && pnpm vitest run src/pages/lens` → 0 failed
- `test_session_detail_agrega_e_lista_traces` — render com traces mockados → SessionSummary + N linhas
- `test_session_row_linka_para_detail` — click no "View session" navega p/ `/observability/sessions/:id`

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
| SessionTraceItem + aggregateSession puros | T1.0 |
| SessionSummary publicado (stories+axe+testes) | T2.0 |
| SessionTimeline publicado | T3.0 |
| Registry válido por componente | T4.0 |
| Lens: session detail page adotada | T5.0 |
| North-star delta registrado | T5.0 |
| Zero dependência nova | T1.0, T4.0 (ACs com grep/package.json) |

**Coverage: 100% — todo claim mapeado em task explícita (T1.0, T2.0, T3.0, T4.0, T5.0).**

## Global Definition of Done

- [ ] `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm registry:validate` → todos exit 0
- [ ] `git diff v0.23.0..HEAD -- package.json | grep '"dependencies"' -A5` sem linha nova de dep
- [ ] Suíte do dashboard 100% verde pós-adoção; north-star no audit
- [ ] CHANGELOG `[Unreleased]` com as entradas
- [ ] `/code-quality` ∈ {PASS, PASS_WITH_CAVEATS} e `/review` READY_TO_MERGE antes do `/release`

## Failure scenarios (when I/O external)

(none — no external I/O touched: componentes recebem dados via props; o fetch dos traces-por-sessão fica no consumidor, que já trata erro/empty via os padrões da traces page)

## Critical paths (para D4 mutation, se rodar)

`src/lib/session/aggregate.ts` — a agregação honesta (custo/tokens/erro/janela) é onde mutantes sobrevivem silenciosamente.

## Final Phase: Integration Validation (MANDATORY)

1. Ladle: as 2 stories novas renderizam com o tema (visual + axe addon).
2. `pnpm build` + `pnpm registry:build` limpos.
3. Dashboard: fluxo session list → session detail manualmente no dev server contra fixtures.
4. Wiring triad por componente: caller real (lens session detail), teste de integração (suíte do lens), métrica de runtime (data-slot presente).
