---
slug: annotation-platform
milestone_id: M12
created_at: 2026-07-15
goal: Publicar AnnotationInput (categorical/continuous/freeform, controlado, config-driven) no @usetheo/ui compondo os primitivos de formulário existentes (RadioGroup/Input/Textarea/Label), e adotá-lo no labeling-queue do theo-lens com score-configs fixture, com zero dependência nova.
---

# Plan: Annotation platform (M12)

> **Version 1.0** — Executa o blueprint do M12 (`.claude/knowledge-base/discoveries/blueprints/annotation-platform-blueprint.md` — SHIPPABLE): modelo de 3 tipos do Phoenix, componente controlado config-driven, compondo `RadioGroup`/`Input`/`Textarea`/`Label` do DS (rung 4 parsimony). Backend de submissão real confirmado no discover; score-config store não existe → adoção com fixtures client-side (mitigação do ROADMAP § M12).

## Goal

Fechar o gap de anotação humana estruturada: promover `AnnotationInput` (3 tipos) ao DS e adotá-lo no labeling-queue do lens com tipos de score nomeados.

## Context

ROADMAP § M12 (V2, gap P0). Phoenix/Langfuse têm tipos de score nomeados; o lens tem só label/score/note free-form. Blueprint SHIPPABLE.

## Baseline Context (deep review of current state)

### Files that will be touched

**Lib @ develop (v0.25.0 após release do PR #12).** Novos: `src/components/composites/annotation-input/{types.ts,annotation-input.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `registry/annotation-input.json` (gerado). Editados: `src/index.ts`, `CHANGELOG.md`.

| Primitivo reusado (DS) | Papel no M12 |
|---|---|
| `src/components/primitives/radio-group/` (`RadioGroup`/`RadioGroup.Item`) | categorical (radiogroup a11y do Radix) |
| `src/components/primitives/input/` (`Input`) | continuous (`type=number` com min/max/step) |
| `src/components/primitives/textarea/` (`Textarea`) | freeform |
| `src/components/primitives/label/` (`Label`) | rótulo do score (htmlFor/id) |

**Lens (consumidor) @ theo-cloud develop, `dashboard/src/`:**

| Arquivo | Papel |
|---|---|
| `pages/lens/labeling-queue.tsx:228-238` (label/score/note free-form) | alvo de adoção: passa a compor `AnnotationInput` sobre score-configs fixture |
| backend `POST /v1/dashboard/lens/labeling-queue/{id}/resolve` (real) | submissão `{label,score?,note?}` (inalterado) |

### Current callers / dependents

Hoje ZERO callers na lib (componente novo). Pós-adoção: `dashboard/src/pages/lens/labeling-queue.tsx`. Dependents internos: nenhum; compõe apenas primitivos publicados.

### Domain glossary

**Glossário:** annotation config = descritor de um tipo de score nomeado (categorical=opções nomeadas; continuous=faixa numérica com bounds; freeform=texto livre). score-config store = persistência dos configs (backend — inexistente hoje; fixture no consumidor). controlado = value+onValueChange, sem estado interno.

### Architecture boundaries affected

**Fronteira (herdada M8/M9/M11):** o componente recebe `config` + `value` via props e emite `onValueChange`; fetch/submissão/persistência de configs ficam no consumidor. Camada de tipos (`types.ts`) é pura.

## Prior Art & Related Work

- Blueprint M12 (`.claude/knowledge-base/discoveries/blueprints/annotation-platform-blueprint.md`): contratos + ADRs D1/D2/D3.
- Referências: `phoenix/app/src/components/annotation/{Categorical,Continuous,Freeform}AnnotationInput.tsx`; `langfuse/packages/shared/src/domain/score-configs.ts`.
- Primitivos reusados: `src/components/primitives/{radio-group,input,textarea,label}/`.
- Playbook de adoção M7/M8/M9/M11.

## Objective

- [ ] `AnnotationInput` (3 tipos) + os tipos de config exportados, com stories (+axe), testes e registry válido
- [ ] Suíte da lib 100% verde; typecheck/lint/format limpos; `registry:validate` PASS
- [ ] Lens: labeling-queue compõe `AnnotationInput` sobre score-configs fixture; submissão real; suíte do dashboard verde
- [ ] Delta north-star registrado
- [ ] Zero dependência nova (`package.json` da lib inalterado em `dependencies`)

## Dependencies

Nenhuma dependência NOVA (Rule 9 por reuso — rung 4). Compõe primitivos já publicados. Deps tocadas (já instaladas):

| Dependência | Versão | Uso | Rule 9 |
|---|---|---|---|
| `react`/`react-dom` | peer `^18 \|\| ^19` | runtime | — |
| `@radix-ui/react-radio-group` (via primitivo RadioGroup do M-anterior) | lockfile | radiogroup a11y | reuso, não nova |
| (dev) `vitest`, `@testing-library/react`, `axe-core` | lockfile | testes + a11y | — |

Nenhum manifesto alterado → `/deps-audit` plan-bound confirma ausência de dep nova.

## ADRs

### D1 — Componente único config-driven (union discriminada), não 3 componentes soltos

**Decision:** um `AnnotationInput` que despacha por `config.type`; props discriminadas para o TS casar `value`/`onValueChange` ao tipo.

**Rationale:** o consumidor itera configs e renderiza `<AnnotationInput config={c}/>` sem branching (padrão phoenix). Alternativa: 3 componentes (rejeitada — empurra branching ao consumidor, repete por tela). Alternativa: value não-tipado (rejeitada — perde type-safety; cada tipo tem shape distinto).

### D2 — Compõe primitivos do DS; zero primitivo/dep novo

**Decision:** reusa `RadioGroup`/`Input`/`Textarea`/`Label`.

**Rationale:** rung 4 parsimony + primitivos já a11y/tema. Alternativa: radios nativos crus (rejeitada — perde tema/foco). Alternativa: Slider p/ continuous (rejeitada — number input é o padrão das 2 referências; Slider seria YAGNI).

### D3 — 3 tipos (phoenix); score-config store como fixture no consumidor

**Decision:** CATEGORICAL/CONTINUOUS/FREEFORM. O store de configs não é do DS nem existe no backend → o lens usa fixtures (mitigação ROADMAP § M12 risco #1).

**Rationale:** menor superfície honesta que cobre o gap; forçar 5 tipos ou depender de store inexistente fabricaria contrato. Alternativa: esperar backend (rejeitada — bloqueia sem necessidade). Alternativa: 5 tipos (rejeitada — BOOLEAN=categorical-de-2, CORRECTION system-only).

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Score-config store não existe no backend | Medium | ADR D3: fixtures client-side no lens (mitigação explícita do ROADMAP); componente config-driven não depende do store; migração para backend é aditiva (aceita `config` por prop igual) | Claude |
| Union discriminada de props pode ficar verbosa no call-site | Low | O consumidor passa `config` tipado; o TS estreita `value`/`onValueChange` — ergonomia validada por teste de tipo (compilação) | Claude |
| valor continuous fora de [min,max] | Low | onValueChange devolve o digitado (validação de negócio é do consumidor); o input expõe min/max nativos + hint de range (a11y) | Claude |
| Adoção cross-repo esbarra em WIP do dashboard | Low | commits por path explícito (precedente M7/M8/M9/M11) | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
F1: T1.0 tipos de config (camada de tipos pura)
F2: T2.0 AnnotationInput (F1; compõe RadioGroup/Input/Textarea/Label)
F3: T3.0 registry+release-prep (F2)
F4: T4.0 adoção lens (labeling-queue + score-configs fixture) + north-star (F3 released)
```

## Phase 1: Tipos de config (lib)

### T1.0 — Tipos de annotation config

#### Objective
`src/components/composites/annotation-input/types.ts`: `CategoricalOption`, `AnnotationCategoricalConfig`, `AnnotationContinuousConfig`, `AnnotationFreeformConfig`, `AnnotationConfig` (union). Camada de tipos pura (sem runtime além de type guards se necessário).

#### Why this step (action + reasoning — ReAct discipline)
Travar o contrato de tipos primeiro elimina retrabalho no componente; a union discriminada é a espinha do type-safety de `value`.

#### Evidence
Blueprint (Corner 2). Phoenix `pages/settings/types.ts:7-48` (3 configs). Langfuse `score-configs.ts` (categorias label+value).

#### Files to edit
- `src/components/composites/annotation-input/types.ts` (novo)
- `src/components/composites/annotation-input/types.test.ts` (novo — type guard `isCategoricalConfig` etc., se houver runtime)
- `src/index.ts` (exports de tipo)

#### Deep file dependency analysis
Sem imports de runtime de `src/components/**` nem de dep externa. Só tipos + (opcional) type guards puros.

#### Deep Dives
Guard por `config.type` (discriminante literal); options vazio em categorical é config inválido do consumidor (não do componente) — documentado.

#### Tasks
1. RED: teste dos type guards (`isCategoricalConfig`/`isContinuousConfig`/`isFreeformConfig`) discriminando por `type`.
2. GREEN: tipos + guards.
3. REFACTOR + barrel.

#### TDD
- `test_isCategoricalConfig_discrimina_por_type` — `expect(isCategoricalConfig({type:"categorical",options:[]})).toBe(true)`
- `test_isContinuousConfig_true_so_para_continuous` — `expect(isContinuousConfig({type:"continuous",min:0,max:1})).toBe(true)` e `.toBe(false)` p/ categorical
- `test_isFreeformConfig_true_so_para_freeform` — idem
- Negativo: `test_guards_false_para_type_desconhecido` — `expect(isCategoricalConfig({type:"x"} as never)).toBe(false)`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/annotation-input/types` → 0 failed
- `pnpm typecheck` → exit 0

#### DoD
Exportado no barrel; testes verdes; CHANGELOG `[Unreleased] § Added`.

## Phase 2: AnnotationInput

### T2.0 — `AnnotationInput` composite

#### Objective
`src/components/composites/annotation-input/annotation-input.tsx`: componente controlado que despacha por `config.type` — categorical→`RadioGroup`, continuous→`Input type=number` (min/max/step), freeform→`Textarea` (maxLength). Props discriminadas (`value`/`onValueChange` casam o tipo). `name` vira `Label`; `required`/`disabled`/`description` a11y.

#### Why this step (action + reasoning)
É a entrega do DS; consome F1 e compõe os primitivos (rung 4).

#### Evidence
Blueprint (Corner 4; ADR D1/D2). Phoenix `{Categorical,Continuous,Freeform}AnnotationInput.tsx`.

#### Files to edit
- `src/components/composites/annotation-input/{annotation-input.tsx,index.ts,annotation-input.test.tsx,annotation-input.stories.tsx}` (novos)
- `src/index.ts`

#### Deep file dependency analysis
Importa `./types`, `RadioGroup` (`../../primitives/radio-group`), `Input`, `Textarea`, `Label`, `cn`. Sem outros composites.

#### Deep Dives
categorical value=label selecionada (string|null); continuous vazio→null (não NaN); freeform vazio→null; disabled propaga a todos os controles; description via `aria-describedby`.

#### Tasks
1. RED: testes (cada tipo renderiza o controle certo; value controlado; onValueChange com shape certo; required/disabled; empty→null; a11y).
2. GREEN. 3. REFACTOR. 4. WIRING: stories (1 por tipo) + axe.

#### TDD
- `test_categorical_renderiza_radiogroup_com_uma_opcao_por_config` — `expect(screen.getAllByRole("radio")).toHaveLength(config.options.length)`
- `test_categorical_onValueChange_emite_label_selecionada` — clicar em opção → `onValueChange("<label>")`
- `test_continuous_renderiza_number_input_com_bounds` — `input.min===String(config.min)` e `.max===String(config.max)`
- `test_continuous_vazio_emite_null_nao_NaN` — limpar → `onValueChange(null)`
- `test_freeform_renderiza_textarea_e_emite_string` — digitar → `onValueChange("<texto>")`
- `test_name_vira_label_associada` — `expect(screen.getByLabelText(new RegExp(name))).toBeInTheDocument()` (ou role+name)
- `test_disabled_desabilita_o_controle` — controle com `disabled`
- Negativo: `test_required_marca_aria_required` — `aria-required="true"` presente

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- `pnpm vitest run src/components/composites/annotation-input` → 0 failed (inclui `expect(await axe(container)).toHaveNoViolations()` para os 3 tipos)
- `pnpm typecheck` → exit 0
- `python3 .claude/skills/implement/scripts/mini_review.py annotation-platform --phase 2` → PHASE_REVIEW_PASS OR gates diretos verdes

#### DoD
Barrel + CHANGELOG.

## Phase 3: Registry + release da lib

### T3.0 — Registry + full gates

#### Objective
Item de registry `annotation-input` (registry:ui; deps: cn, radio-group, input, textarea, label, tailwind-preset); `registry:build`+`validate` verdes; full suite/typecheck/lint/format.

#### Why this step (action + reasoning)
DoD padrão exige registry válido por componente.

#### Evidence
Precedente M8/M9/M11 (registry descriptor-driven; dep name deriva do diretório do primitivo).

#### Files to edit
- `registry/annotation-input.json` (novo) → `pnpm registry:build`

#### Deep file dependency analysis
`annotation-input` depende de `cn`, `radio-group`, `input`, `textarea`, `label`, `tailwind-preset` (todos itens de registry existentes — confirmar nomes no build).

#### Tasks
1. RED: `registry:validate` como oráculo. 2. GREEN: descriptor + build. 3. Full gates.

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

## Phase 4: Adoção no lens + north-star

### T4.0 — labeling-queue com score-configs + north-star

#### Objective
No theo-cloud develop: bump da lib; no `labeling-queue.tsx`, definir score-configs fixture (ex.: um categorical "quality" com opções nomeadas + um freeform "note") e compor `AnnotationInput` sobre eles no sheet de resolve; a submissão continua `POST .../resolve` com `{label,score?,note?}` derivado dos valores; suíte do dashboard verde; north-star registrado.

#### Why this step (action + reasoning)
O DoD do M12 é o componente adotado com configs reais no fluxo de labeling — prova material, não só publicado.

#### Evidence
DoD do ROADMAP § M12; alvo `labeling-queue.tsx:228-238`; backend `POST /v1/dashboard/lens/labeling-queue/{id}/resolve` (discover).

#### Files to edit
(cross-repo) `dashboard/`: `package.json`, `pages/lens/labeling-queue.tsx` (compõe AnnotationInput sobre configs fixture), fixture de score-configs (const local ou `lens-annotation-configs.ts`), testes co-locados.

#### Deep file dependency analysis
score-configs fixture → `AnnotationInput`; o valor categorical (label) + score opcional (do map da option) + freeform (note) montam o body do resolve.

#### Deep Dives
Preserva o contrato de submissão atual (label obrigatório; score numérico opcional; note opcional) — a fixture mapeia option→score; a suíte do resolve (round-trip) continua verde.

#### Tasks
1. Bump + install + typecheck. 2. fixture + compor AnnotationInput no sheet. 3. Testes de integração (resolve round-trip com os configs). 4. Full suite verde.

#### TDD
- Oráculo: `cd dashboard && pnpm vitest run src/pages/lens/labeling-queue` → 0 failed
- `test_resolve_usa_annotation_input_categorical` — o sheet renderiza radiogroup do config "quality"
- `test_resolve_submete_label_e_score_do_config` — resolver emite `{label, score}` derivado da option selecionada

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
| Tipos de config (union discriminada) | T1.0 |
| AnnotationInput publicado (3 tipos, stories+axe+testes) | T2.0 |
| Registry válido | T3.0 |
| Lens: labeling-queue com score-configs + componente | T4.0 |
| North-star delta registrado | T4.0 |
| Zero dependência nova | T1.0, T3.0 (ACs com package.json) |

**Coverage: 100% — todo claim mapeado em task explícita (T1.0, T2.0, T3.0, T4.0).**

## Global Definition of Done

- [ ] `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm registry:validate` → todos exit 0
- [ ] `git diff` de `package.json` sem linha nova em `dependencies`
- [ ] Suíte do dashboard 100% verde pós-adoção; north-star no audit
- [ ] CHANGELOG `[Unreleased]` com as entradas
- [ ] `/code-quality` ∈ {PASS, PASS_WITH_CAVEATS} e `/review` READY_TO_MERGE antes do `/release`

## Failure scenarios (when I/O external)

(none — no external I/O touched no DS: o componente recebe config+value via props e emite onValueChange; a submissão HTTP fica no consumidor, que já trata erro/loading no fluxo do resolve existente)

## Critical paths (para mutation testing, se rodar)

`src/components/composites/annotation-input/annotation-input.tsx` — o dispatch por `config.type` e o mapeamento value↔controle (categorical=label, continuous=number|null, freeform=string|null) é onde mutantes sobrevivem silenciosamente.

## Final Phase: Integration Validation (MANDATORY)

1. Ladle: as 3 stories (um por tipo) renderizam com o tema (visual + axe addon).
2. `pnpm build` + `pnpm registry:build` limpos.
3. Dashboard: fluxo de resolve com os score-configs manualmente no dev server contra fixtures.
4. Wiring triad por componente: caller real (labeling-queue), teste de integração (suíte do lens), métrica de runtime (data-slot presente).
