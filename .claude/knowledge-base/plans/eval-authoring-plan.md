---
slug: eval-authoring
milestone_id: M18
created_at: 2026-07-15
goal: Publicar EvaluatorForm (form config-driven por tipo de evaluator built-in) + AnnotationSummaryGroup (grupo de anotações com stats agregadas, reusa AnnotationConfig do M12) no @usetheo/ui, com zero dependência nova.
---

# Plan: Eval authoring (M18)

> **Version 1.0** — V3. Fontes: phoenix `CodeEvaluatorForm.tsx` (form por tipo, ELv2 study-only) + `AnnotationSummaryGroup.tsx`. EvaluatorForm = union discriminada (padrão M12/AnnotationInput). AnnotationSummaryGroup reusa `AnnotationConfig` do M12. Compõe primitivos do DS. Zero dep nova.

## Goal
Fechar o gap de autoria de eval (Phoenix tem builder de evaluators). 2 componentes.

## Context
ROADMAP § M18 (V3). Reusa a fundação de config do M12.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/components/composites/{evaluator-form,annotation-summary-group}/*`, `registry/*`. Editados: `src/index.ts`, `CHANGELOG.md`. Reuso: `AnnotationConfig`/`AnnotationInput` (M12), `Input`, `Select`, `RadioGroup`, `Badge`, `Card`, `Label`, `cn`.
### Current callers / dependents
Zero na lib (novos). Adoção parcial: `dashboard/src/pages/lens/evaluators.tsx` (se a superfície casar).
### Domain glossary
evaluator = regra de avaliação com tipo (exact_match/regex/levenshtein/json_distance/contains) + campos por tipo; annotation summary = agregação (média/count) de anotações por config.
### Architecture boundaries affected
Ambos controlados: `EvaluatorForm` (value+onChange, union discriminada por `type`); `AnnotationSummaryGroup` (config + values[]). Sem fetch/execução (plataforma).

## Prior Art & Related Work
- V3 gap grill. phoenix `CodeEvaluatorForm.tsx`, `AnnotationSummaryGroup.tsx`. M12 (`AnnotationConfig`, `AnnotationInput`, Extract p/ TS#30581).

## Objective
- [ ] `EvaluatorForm` + `AnnotationSummaryGroup` publicados (stories+axe+testes+registry)
- [ ] typecheck/lint/format 0; `registry:validate` PASS
- [ ] North-star delta; zero dep nova
- [ ] Adoção avaliada em evaluators.tsx (se superfície) senão componente 100% funcional

## Dependencies
Nenhuma dep NOVA. `/deps-audit` plan-bound confirma.

## ADRs
### D1 — EvaluatorForm union discriminada por tipo (padrão M12)
**Decision:** `EvaluatorConfig` union por `type`; props discriminadas (Extract após guard, TS#30581). exact_match/contains → campo alvo; regex → padrão + flags; levenshtein/json_distance → threshold. **Rationale:** mesmo padrão do AnnotationInput/M12 (provado). Alternativa: form não-tipado (rejeitada — perde type-safety).
### D2 — AnnotationSummaryGroup reusa AnnotationConfig do M12 (DRY)
**Decision:** consome `AnnotationConfig` do M12; agrega values (média p/ continuous, count p/ categorical). **Rationale:** DRY (Rule 12). Alternativa: tipo próprio (rejeitada — duplica M12).
### D3 — Compõe primitivos; execução é plataforma
**Decision:** o form só edita config; sandbox/execução do evaluator é backend. **Rationale:** fronteira DS. Alternativa: incluir runner (rejeitada — plataforma).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| cada evaluator tem campos distintos | Medium | union discriminada (Extract, padrão M12) | Claude |
| sandbox de code-evaluator é backend | Low | form só edita config; execução é plataforma (ADR D3) | Claude |
| agregação de summary ambígua | Low | média p/ continuous, count/moda p/ categorical; documentado | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: EvaluatorForm (union discriminada, compõe Input/Select/RadioGroup)
F2: AnnotationSummaryGroup (reusa AnnotationConfig M12, compõe Badge/Card)
F3: registry + release-prep (F1,F2)
F4: adoção avaliada (evaluators.tsx) + north-star (F3 released)
```

## Phase 1: EvaluatorForm
### T1.0 — EvaluatorForm
#### Objective
`src/components/composites/evaluator-form/`: `EvaluatorConfig` union (`{type:"exact_match"|"contains", target} | {type:"regex", pattern, flags?} | {type:"levenshtein"|"json_distance", threshold}`); props discriminadas `{ value; onChange; disabled? }`; renderiza campos por tipo; forwardRef; data-slot.
#### Why this step (action + reasoning)
Entrega o builder; reusa o padrão M12.
#### Evidence
phoenix `CodeEvaluatorForm.tsx:10-44`. M12 (union+Extract).
#### Files to edit
`src/components/composites/evaluator-form/{evaluator-form.tsx,types.ts,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Input`/`Select`/`Label`/`cn`; sem outros composites.
#### Deep Dives
type change → campos certos; regex inválido → não crash (só edita, validação é do consumidor); threshold fora de range → onChange devolve o digitado.
#### Tasks
1. RED: testes (cada tipo renderiza campos certos, onChange emite config, type switch). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_exact_match_renderiza_campo_target`
- `test_regex_renderiza_pattern_e_flags`
- `test_levenshtein_renderiza_threshold`
- `test_onChange_emite_config_do_tipo`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/evaluator-form` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: AnnotationSummaryGroup
### T2.0 — AnnotationSummaryGroup
#### Objective
`src/components/composites/annotation-summary-group/`: props `{ config: AnnotationConfig; values: (string|number)[]; label?; defaultOpen? }`; grupo colapsável com stats agregadas (média p/ continuous, count/moda p/ categorical, count p/ freeform); reusa `AnnotationConfig` do M12; forwardRef; data-slot.
#### Why this step (action + reasoning)
Entrega o resumo agregado; reusa M12 (DRY).
#### Evidence
phoenix `AnnotationSummaryGroup.tsx`. M12 (`AnnotationConfig`).
#### Files to edit
`src/components/composites/annotation-summary-group/{annotation-summary-group.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `AnnotationConfig` (M12), `Badge`/`Card`/`cn`; sem fetch.
#### Deep Dives
values vazio → empty honesto; média de continuous ignora não-finitos; categorical mostra contagem por opção.
#### Tasks
1. RED: testes (stats por tipo, empty, colapsar). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_continuous_mostra_media`
- `test_categorical_mostra_contagem_por_opcao`
- `test_values_vazio_empty_honesto`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/annotation-summary-group` → 0 failed (axe)
- `python3 .claude/skills/implement/scripts/mini_review.py eval-authoring --phase 2` → PASS OR gates diretos verdes
#### DoD
Barrel + CHANGELOG.

## Phase 3: Registry + release
### T3.0 — Registry + full gates
#### Objective
Itens `evaluator-form` + `annotation-summary-group`; build+validate; full gates.
#### Why this step (action + reasoning)
DoD exige registry válido.
#### Evidence
Precedente M8-M17.
#### Files to edit
`registry/{evaluator-form,annotation-summary-group}.json` → build.
#### Deep file dependency analysis
evaluator-form deps: cn, input, select, label, tailwind-preset; annotation-summary-group deps: cn, annotation-input(config), badge, card, tailwind-preset.
#### Tasks
1. validate oráculo. 2. descriptors+build. 3. Full gates.
#### TDD
- `registry:build && validate` → 0; full suite verde
#### Concurrency tests
(none)
#### Acceptance Criteria
- registry:validate → 0
#### DoD
Pronto p/ review + release.

## Phase 4: Adoção (avaliar) + north-star
### T4.0 — Adoção evaluators.tsx (se superfície) + north-star
#### Objective
Avaliar adoção do EvaluatorForm em `evaluators.tsx`; se a superfície não casar (backend de evaluator config), adoção diferida honesta; north-star (+2 componentes).
#### Why this step (action + reasoning)
Honestidade: não forçar adoção decorativa.
#### Evidence
`evaluators.tsx` (lens).
#### Files to edit
(cross-repo, se aplicável) `dashboard/`; senão north-star do DS.
#### Deep file dependency analysis
adoção onde o config de evaluator for editável no lens.
#### Deep Dives
não fabricar adoção sem superfície.
#### Tasks
1. Avaliar evaluators.tsx. 2. Adotar SE casar. 3. North-star.
#### TDD
- Se adotar: `cd dashboard && pnpm vitest run <alvo>` → 0
- Sempre: north-star
#### Concurrency tests
(none)
#### Acceptance Criteria
- componentes 100% funcionais; adoção registrada (real ou diferida honesta)
#### DoD
North-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| EvaluatorForm publicado | T1.0 |
| AnnotationSummaryGroup publicado | T2.0 |
| Registry válido | T3.0 |
| Adoção avaliada + north-star | T4.0 |
| Zero dep nova | T1.0, T3.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T4.0).**

## Global Definition of Done
- [ ] `pnpm test:run && typecheck && lint && format:check && registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] CHANGELOG `[Unreleased]`; `/review` READY_TO_MERGE antes do release
- [ ] Adoção registrada (real ou diferida honesta)

## Failure scenarios (when I/O external)
(none — componentes controlados; execução do evaluator é plataforma)

## Critical paths (para mutation testing, se rodar)
`evaluator-form.tsx` (dispatch por tipo) e `annotation-summary-group.tsx` (agregação média/count).

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: stories (visual+axe). 2. build+registry. 3. Wiring triad.
