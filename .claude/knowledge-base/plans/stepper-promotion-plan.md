---
slug: stepper-promotion
milestone_id: M4
created_at: 2026-07-15
goal: Ship o composite Stepper promovido do build-timeline do dashboard com estados explícitos por etapa, 2 orientações, timestamps e retry slot, com testes e registry.
---

# Plan: Stepper — promoção do build-timeline (M4)

> **Version 1.1** (absorve EC-1/EC-2 do edge-case review; 21→23 REDs no T1.1; EC-3/4/5 documentados) — Promove o padrão `build-timeline.tsx`/`build-step-card.tsx` do dashboard (produção) a um composite genérico `Stepper`: estado EXPLÍCITO por etapa (`pending/active/done/failed` — blueprint ADR D1), helper puro `deriveSteps` para o caso índice-simples, orientações vertical (default)/horizontal via `data-orientation`, timestamp e retry como slots, a11y `<ol>` + `aria-current="step"` + erro em texto. Zero dependências novas.

## Goal

Enable os consumidores do `@usetheo/ui` a renderizar pipelines multi-etapas acessíveis com `Stepper`, measured by `pnpm vitest run src/components/composites/stepper/` verde (≥ 22 testes, axe zero violations nas 2 orientações) e `pnpm registry:validate` com a entry `stepper` (67 itens).

## Context

ROADMAP § M4 (deps M0 ✅). Blueprint (`stepper-promotion`, SHIPPABLE_WITH_CAVEATS 89): estado explícito por etapa (ADR D1 — os dois casos reais exigem failed em etapa arbitrária; a derivação-por-índice do Mantine não expressa isso), sem navegação clicável (ADR D2 — pipeline read-only), nome `Stepper` (ADR D3). Mantine tem zero ARIA (evidência negativa) — contrato a11y vem do consumidor real (`<ol aria-label>`) + APG. Fontes de design: dashboard `build-timeline.tsx` (máquina de estados + anatomia `<ol>`) e `build-step-card.tsx` (ícones por estado, truncamento, `aria-label` com causa do erro); segundo caso real: ingest do theo-rag (`document-status.ts` 5-state público).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/composites/stepper/stepper.tsx` (NEW) | 0 | — | (a criar — promoção) | — |
| `src/components/composites/stepper/stepper.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/composites/stepper/stepper.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/composites/stepper/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 172 | `acba0e2c` | Barrel (60 componentes pós-M3) | Aditivo only |
| `registry/stepper.json` (NEW) / `registry/index.json` | 412 | `8f48de71` | Índice (66 itens) | Aditivo; ordem alfabética |
| `CHANGELOG.md` | 102 | `3a5a3280` | `[Unreleased]` vazio pós-0.19.0 | Released intocadas |

Fontes de design (leitura, fora do repo — paths absolutos no blueprint § Consumer requirements): dashboard `build-timeline.tsx` (117 LoC) + `build-step-card.tsx` + `build-timeline-live.tsx` (fronteira live); theo-rag `document-status.ts` — lidos integralmente 2026-07-15.

### Current callers / dependents

- **Symbol:** `Stepper` / `deriveSteps` (NEW) — zero callers; pós-plano: barrel + stories + registry. O original do dashboard migra no M7 (Tier 2 § adoção, com deleção).
- **Symbol:** `cn` — consumido (read-only).
- **Symbols (stories only):** `StatusDot` (125 LoC, `66a3335b`), `Badge`, `Timestamp` (189 LoC) — usados APENAS na story de composição do DoD; componente não os importa.

### Domain glossary

- **estado explícito por etapa** — cada step carrega o próprio `status`; nunca derivado de um índice único no componente (blueprint ADR D1 — failed pode ocorrer em etapa arbitrária).
- **deriveSteps** — helper puro `(defs, activeIndex) → steps[]` para o caso wizard-simples: anteriores done, corrente active, posteriores pending; índice clampado.
- **retry slot** — `ReactNode` por etapa renderizado APENAS quando `status === 'failed'`; a ação é do consumidor (não é botão nosso).
- **fronteira live** — SSE/agrupamento/skeleton ficam no consumidor (`build-timeline-live.tsx`); o composite é 100% controlado (risco #2 do ROADMAP § M4).

### Architecture boundaries affected

Nenhuma (apresentação pura, stateless — sem hooks, sem "use client"). +2 exports (componente + helper).

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` — modelo de estado (Corner 4 Q1), gap failed do SOTA (Q2/EC-2), shape de testes (Corner 1), registry/stories (Corner 3), zero deps (Corner 2).
- **Reference projects:** `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Stepper/Stepper.tsx:87-88,200` (orientação data-attribute — adotada; derivação-por-índice — rejeitada como API, mantida como helper; zero ARIA — rejeitado); `.claude/knowledge-base/references/tremor/src/components/Tracker/Tracker.tsx:10-14` (strip compacto — fora de escopo, valida o recorte).
- **Fontes de design (consumer/família):** dashboard `build-timeline.tsx`/`build-step-card.tsx` + theo-rag `document-status.ts` (paths absolutos; ADR D3 da família).
- **Patterns skills:** (nenhuma — verificado: `skills/*-patterns/` vazio).

## Objective

- [ ] `Stepper` com estado explícito por etapa (4 estados), ícones fixos lucide (Check/Loader2/X/CircleDashed — mesmos do build-step-card), orientações v/h via `data-orientation` (default vertical), timestamp e retry slots; helper puro `deriveSteps` exportado.
- [ ] ≥ 22 testes: helpers (derivação, clamp, vazio), render por estado, `aria-current="step"`, retry só em failed, erro em texto acessível, timestamps opcionais, orientações, truncamento com `title`, edges (1 etapa; todas done) e negatives (steps vazio; step não é botão) + data-slots + forwardRef + axe.
- [ ] 4 stories (BuildPipeline com variante failed+retry; IngestPipeline com timestamps; ComposicaoStatus com StatusDot/Badge — DoD b3; Horizontal) + smoke.
- [ ] Barrel + `registry/stepper.json`; validate 67 itens; CHANGELOG.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `lucide-react` | instalada (peer/dep atual do repo) | npm | Ícones por estado — mesmos glifos do build-step-card (blueprint Corner 2) |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| (none) | — | — | @mantine/core avaliada e rejeitada (blueprint ADR D2 do plan de descoberta — sistema de estilo próprio incompatível com registry copy-pasteable); radix hover-card do Tracker não se aplica | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — Estado explícito por etapa + helper puro `deriveSteps`

**Decision:** `StepperProps.steps` carrega `status` por etapa; a derivação-por-índice (wizard simples) vira helper puro exportado `deriveSteps(defs, activeIndex)`.

**Rationale:** os dois casos reais exigem failed em etapa arbitrária e estados mistos simultâneos (dashboard `phaseState` produz done+active+failed+pending; theo-rag failed em qualquer stage) — blueprint § Q1. Helper puro segue o padrão testável isolado do M3 (`linScale`/`niceMax`). KISS: uma única fonte de verdade na API.

**Alternatives considered:** índice único como Mantine (rejeitado — não expressa failed no meio); dois modos na API, índice OU array (rejeitado — duas fontes de verdade); só array sem helper (rejeitado — o caso wizard-simples pagaria boilerplate em todo consumidor).

**Consequences:** componente 100% controlado (mitiga risco #2 do ROADMAP § M4 — streaming fica no consumidor); migração do dashboard no M7 = mapear `phaseState` → array (mecânica).

### D2 — Read-only: sem navegação clicável no M4

**Decision:** steps não são botões; sem `onStepClick`/matriz de seleção.

**Rationale:** pipeline de build/ingest é read-only — nenhum consumidor real clica em etapa (YAGNI, Rule 11); a matriz allow* do Mantine é complexidade de wizard sem caso concreto aqui. A11y simplifica: lista semântica `<ol>`, não toolbar.

**Alternatives considered:** portar `onStepClick` "para o futuro" (rejeitado — Rule 11; abre como milestone quando o studio precisar); tornar cada step um `<button disabled>` (rejeitado — semântica errada para conteúdo não-interativo).

**Consequences:** negative test pina "step não expõe role button"; wizard clicável é extensão futura aditiva (novo prop, sem breaking).

### D3 — A11y própria: `<ol>` + `aria-current="step"` + erro em texto

**Decision:** raiz `<ol>` com `aria-label` (prop `label` obrigatória), etapa ativa com `aria-current="step"`, ícones `aria-hidden`, estado failed comunicado em TEXTO (não só cor/ícone).

**Rationale:** Mantine tem zero ARIA (evidência negativa do blueprint — grep vazio); o consumidor real já usa `<ol aria-label>`; lição local do StatusDot (status só por cor emite warning). Cita `rules/testing.md § 4.1` (negative pina o contrato).

**Alternatives considered:** copiar a estrutura div+buttons do Mantine (rejeitada — zero semântica); `role="list"` em div (rejeitada — `<ol>` nativo é mais simples, KISS).

**Consequences:** axe sweep do Ladle cobre as stories automaticamente; leitores de tela leem posição/total de graça (`<ol>`).

### D4 — Wiring triad herdado (precedente dos planos M0-M3)

**Decision:** (a) caller = barrel+stories+registry inline; (b) integration = testes de composição co-localizados; (c) métrica = data-slot assertado no DOM.

**Rationale:** biblioteca de UI sem telemetria de ops; mesma adaptação aprovada em 4 reviews consecutivos (READY_TO_MERGE em M0, M1, M2 e M3).

**Alternatives considered:** exigir tests/integration/ dedicado (rejeitado — não existe na lib; falso negativo de ferramenta registrado como followup #5 do kit); dispensar o pilar (rejeitado — viola cycle-implement).

**Consequences:** check_wiring pillar b segue FAIL de ferramenta, coberto por este ADR.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Conflito de vocabulário com `StatusDot`/`StatusIndicator` (risco #1 do ROADMAP § M4) | Medium | `StepStatus` usa os nomes do consumidor (`pending/active/done/failed`), cores via tokens `text-success/destructive/primary/muted-foreground` (mesmas classes do build-timeline); story de composição demonstra reuso sem duplicação | Claude |
| Divergência entre o original do dashboard e o composite até o M7 | Medium | M7 substitui o original (deleção); até lá o original é estável | Paulo |
| Requisito futuro de wizard clicável forçar breaking change | Low | ADR D2: extensão é aditiva (novo prop opcional); API atual não fecha portas | Claude |
| Timestamps como slot livre (`ReactNode`) permitem conteúdo não-temporal | Low | JSDoc recomenda `<Timestamp/>`; slot livre é o mesmo trade-off aceito do retry | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
Phase 1 (T1.1 componente+helpers+testes → T1.2 stories) → Phase 2 (T2.1 barrel → T2.2 registry; T2.3 changelog ∥) → Final Validation
```

## Phase 1: Componente (TDD)

**Objective:** Stepper com 23 comportamentos pinados.

### T1.1 — Stepper + deriveSteps com TDD completo

#### Objective
`stepper.tsx` (+ index) com helper puro exportado, 4 estados, 2 orientações, slots.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** escreve `stepper.test.tsx` RED (23 testes), implementa o componente (GREEN — anatomia do build-timeline generalizada + decisões do blueprint), refactor tokens.
2. **Why now:** é o milestone inteiro em um componente; o RED pina a máquina de estados ANTES da implementação (o gap SOTA — Mantine sem failed — significa que os testes são nosso único contrato). Cita D1/D2/D3 e o blueprint do M4 (`.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` — Corner 1).

#### Evidence
blueprint do M4 (`.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md`) — Corner 1 (shape de testes), Q1/Q2 (máquina de estados + failed do build-step-card), Q5 (zero deps). Referência: `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Stepper/Stepper.test.tsx:56` (edge: active fora do range não quebra — transferido ao clamp do deriveSteps).

#### Files to edit
```
src/components/composites/stepper/stepper.test.tsx — (NEW) RED primeiro
src/components/composites/stepper/stepper.tsx — (NEW)
src/components/composites/stepper/index.ts — (NEW)
```

#### Deep file dependency analysis
- `stepper.tsx` (NEW): importa `cn` + 4 ícones lucide (Check, Loader2, X, CircleDashed — já usados no repo). Downstream: barrel/registry/stories.
- Teste: fixture builder de steps (helper `step(...)` — lição do quality hook contra blocos duplicados).

#### Deep Dives
- Anatomia: `<ol aria-label={label} data-slot="stepper" data-orientation>` → `<li data-slot="stepper-step" data-state={status}` + `aria-current="step"` no active; ícone em `<span aria-hidden>`; label truncado com `title` (porta EC-14 do build-step-card); description; slot timestamp; slot retry (só failed); estado failed com texto acessível (sr-only) incluindo o label.
- Invariants: helper puro `deriveSteps` exportado; componente stateless controlado; classes por estado idênticas em intenção às do build-timeline (done: foreground; active: primary; failed: destructive; pending: muted-foreground).

#### Pseudo-code / Signatures
```pseudocode
type StepStatus = "pending" | "active" | "done" | "failed"
interface StepperStepData { id: string; label: string; description?: string;
  status: StepStatus; timestamp?: ReactNode; retry?: ReactNode }
interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  label: string;                     // aria-label da <ol> (obrigatório — D3)
  steps: StepperStepData[];
  orientation?: "vertical" | "horizontal" }  // default "vertical"
export function deriveSteps(defs: Array<{id; label; description?}>, activeIndex: number): StepperStepData[]
export { Stepper, deriveSteps }
```

#### Tasks
1. RED (23); 2. GREEN; 3. REFACTOR tokens.

#### TDD
```
RED: test_derivesteps_marks_before_active_after() — deriveSteps(3 defs, 1) → [done, active, pending]
RED: test_derivesteps_clamps_out_of_range_index() — activeIndex 100 → todas done; -1 → todas pending (edge do Mantine Stepper.test.tsx:56, sem crash)
RED: test_derivesteps_empty_defs_returns_empty() — [] → [] (negative: sem throw)
RED: test_renders_one_li_per_step_with_data_state() — 4 steps (4 estados) → 4 li[data-slot=stepper-step] com data-state correto
RED: test_icon_per_state_rendered_aria_hidden() — done→check, active→spinner, failed→x, pending→dashed; todos aria-hidden
RED: test_active_step_has_aria_current_step() — só o active tem aria-current="step"
RED: test_failed_step_renders_retry_slot() — retry ReactNode presente no failed
RED: test_retry_slot_not_rendered_on_non_failed() — mesmo retry em step done → ausente (negative)
RED: test_failed_state_communicated_in_text() — failed tem texto acessível com o label (não só cor — D3)
RED: test_timestamp_slot_rendered_when_present() — timestamp aparece no step
RED: test_timestamp_absent_renders_no_slot() — sem timestamp → sem [data-slot=stepper-timestamp]
RED: test_default_orientation_is_vertical() — root [data-orientation=vertical]
RED: test_horizontal_orientation_data_attribute() — orientation=horizontal → [data-orientation=horizontal]
RED: test_long_label_truncates_with_title_attr() — label longo → classe truncate + title (EC-14)
RED: test_single_step_renders() — edge: 1 etapa não quebra separadores
RED: test_all_done_pipeline_renders() — edge: todas done, nenhum aria-current
RED: test_empty_steps_renders_ol_without_items() — negative: steps=[] → <ol> vazio sem crash
RED: test_steps_are_not_buttons() — negative: zero role=button dentro do root (D2)
RED: test_unknown_status_falls_back_to_pending_visual() — EC-1 negative: status fora do union (JS runtime) → ícone pending, sem throw
RED: test_multiple_active_steps_each_get_aria_current() — EC-2 edge: 2 actives → render-as-is (contrato "máx 1 active" no JSDoc)
RED: test_all_parts_have_data_slot() — stepper/-step/-icon/-label + root <ol> com aria-label
RED: test_root_forwards_ref() — ref chega ao <ol>
RED: test_axe_no_violations() — axe(vertical com failed+retry + horizontal) zero violations
GREEN: implementar stepper.tsx (anatomia Deep Dives)
REFACTOR: tokens (text-body-sm/text-label — vocabulário do preset; sem classes inexistentes)
VERIFY: pnpm vitest run src/components/composites/stepper/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/composites/stepper/` reporta 23 passed / 0 failed
- [ ] `pnpm lint` exit 0; `wc -l` ≤ 500 em `stepper.tsx`
- [ ] `grep -c "useState\|useEffect" src/components/composites/stepper/stepper.tsx` == 0 (stateless controlado — D1)
- [ ] `grep -c "\"use client\"" src/components/composites/stepper/stepper.tsx` == 0

#### DoD (Definition of Done)
- [ ] `pnpm vitest run src/components/composites/stepper/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T1.2 — Stories

#### Objective
4 stories (BuildPipeline com failed+retry; IngestPipeline com timestamps; ComposicaoStatus; Horizontal) + smoke.

#### Why this step (action + reasoning)
1. **What:** stories CSF + smoke test.
2. **Why now:** pilar (a) do D4; ComposicaoStatus é a evidência do DoD b3 do ROADMAP § M4 (StatusDot/Badge sem duplicar semântica); IngestPipeline valida o segundo caso real. Cita o blueprint do M4 (`.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` — Corner 3).

#### Evidence
blueprint do M4 (`.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md`) — Corner 3 (lista de stories) e Consumer requirements (casos dashboard + theo-rag `pending/processing/ready/failed`).

#### Files to edit
```
src/components/composites/stepper/stepper.stories.tsx — (NEW)
src/components/composites/stepper/stepper.test.tsx — +1 smoke
```

#### Deep file dependency analysis
- Stories importam o componente + `StatusDot`/`Badge`/`Timestamp` locais (só aqui — componente não os importa); dados fixos determinísticos (Timestamp com `value` fixo ISO — sem relógio).

#### Deep Dives
- Axe sweep do Ladle (`src/test/ladle-axe.test.tsx`) roda em TODAS as stories automaticamente — as 4 stories entram no sweep sem trabalho extra.

#### Tasks
1. 4 stories; 2. smoke.

#### TDD
```
RED: test_build_pipeline_story_renders_failed_with_retry() — story BuildPipeline renderiza step failed com retry slot e 6 etapas
VERIFY: pnpm vitest run src/components/composites/stepper/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 4 stories
- [ ] `pnpm vitest run src/test/ladle-axe.test.tsx` exit 0 (sweep cobre as novas stories)

#### DoD
- [ ] `pnpm vitest run src/components/composites/stepper/` reporta 24 passed / 0 failed

## Phase 2: Export, registry e docs

**Objective:** superfície pública + registry + CHANGELOG.

### T2.1 — Barrel

#### Objective
Exports (`Stepper`, `deriveSteps`, tipos) + smoke de identidade.

#### Why this step (action + reasoning)
1. **What:** RED smoke via barrel → export aditivo.
2. **Why now:** padrão M0-M3; pré-req do registry.

#### Evidence
`src/index.ts` (172 LoC, sha `acba0e2c` — Baseline); bloco TrendChart do M3 como modelo.

#### Files to edit
```
src/index.ts — aditivo
src/components/composites/stepper/stepper.test.tsx — +1 smoke barrel
```

#### Deep file dependency analysis
- Barrel aditivo only (invariant).

#### Deep Dives
(nenhum)

#### Tasks
1. RED; 2. GREEN.

#### TDD
```
RED: test_barrel_exports_stepper() — identidade via "../../../index.js" (Stepper e deriveSteps)
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
`registry/stepper.json` + entry; validate 67 itens.

#### Why this step (action + reasoning)
1. **What:** entry no index (RED validate) → descriptor (draft do blueprint Corner 3) → build+validate; **build é o ÚLTIMO passo antes do commit final** (disciplina M1-M3).
2. **Why now:** DoD padrão.

#### Evidence
blueprint do M4 (`.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` — Corner 3); `registry/trend-chart.json` (M3) como modelo; `registryDependencies` por introspecção real (componente não importa outros componentes — esperado vazio).

#### Files to edit
```
registry/stepper.json — (NEW)
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
GREEN: `pnpm registry:build && pnpm registry:validate` exit 0 (67 itens)
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm registry:validate` exit 0 reportando 67 itens

#### DoD
- [ ] `git diff --stat registry/` só adições + regenerações do build

### T2.3 — CHANGELOG

#### Objective
Entry `[Unreleased] § Added`.

#### Why this step (action + reasoning)
1. **What:** entry consumer-facing (Rule 6). 2. **Why now:** ∥ T2.2.

#### Evidence
CHANGELOG (102 LoC, Unreleased vazio pós-0.19.0 — Baseline).

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
RED: test_changelog_mentions_stepper() — `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém Stepper (gate documental)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém Stepper sob § Added

#### DoD
- [ ] `pnpm test:run` exit 0

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | Stepper com estados por etapa pending/active/done/failed, orientações h/v, timestamps opcionais, erro + retry slot (M4 DoD b1) | T1.1 | Estado explícito (D1) + slots + data-orientation; 23 testes (incl. EC-1/EC-2) |
| 2 | API validada contra os dois casos reais: ingest theo-rag e build timeline dashboard (M4 DoD b2) | T1.1, T1.2 | Máquina de estados do build-timeline generalizada (D1); stories BuildPipeline + IngestPipeline reproduzem os dois casos |
| 3 | Story de composição com StatusDot/Badge sem duplicar semântica (M4 DoD b3) | T1.2 | Story ComposicaoStatus (imports só na story) |
| 4 | DoD padrão da lib (testes+axe, stories, registry) | T1.1-T2.2 | 25 testes, 4 stories, registry 67 |
| 5 | Zero dependências novas (blueprint Corner 2; risco #1 mitigado por tokens) | T1.1, T2.2 | AC do T1.1 (só cn+lucide já instalados); descriptor sem dependencies npm novas; package.json intocado |
| 6 | CHANGELOG (Rule 6) | T2.3 | Entry § Added |

**Coverage: 6/6 gaps covered (100%)**

## Global Definition of Done

- [ ] `pnpm test:run` exit 0 (+25 novos; regressão 796 intacta)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] File-size ≤ 500 LoC por arquivo-fonte
- [ ] `CHANGELOG.md` atualizado (Rule 6)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0 (67 itens) — build como último passo
- [ ] Runtime-metric proof — data-slots assertados (D4)
- [ ] `pnpm build` com Stepper no dist (`grep -c "Stepper" dist/index.js` ≥ 1)
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

- [ ] `pnpm test:run` exit 0 (regressão + novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:validate` exit 0 (67 itens)
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado

### If Validation Fails

1. Plano vs pré-existente; 2. Fix; 3. Re-run; 4. Documentar.
