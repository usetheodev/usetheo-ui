# Implementation Contract — stepper-promotion (M4)

**Plan:** `.claude/knowledge-base/plans/stepper-promotion-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
**Started:** 2026-07-15
**Engine note:** halt-loop executado inline com rigor integral (RED→GREEN→REFACTOR→WIRING→COMMIT por task, progress checkpoint, mini-review por phase boundary) — ralph-loop concorrente com o Stop hook do goal da sessão é o anti-pattern documentado em `rules/loop-engine-convention.md § Anti-patterns`; precedente aprovado nas reviews M0-M3.
**SEPA:** não gerado — precedente M0-M3 (componente único, plano com blueprint 89 + edge-case review; segundo par de olhos vem do `/review` de 5 agentes).

## Ordered tasks

| ID | Phase | Task | Status |
|---|---|---|---|
| T1.1 | 1 | Stepper + deriveSteps com TDD completo (23 REDs) | pending |
| T1.2 | 1 | Stories (4) + smoke | pending |
| T2.1 | 2 | Barrel + smoke identidade | pending |
| T2.2 | 2 | Registry (descriptor + entry, validate 67) | pending |
| T2.3 | 2 | CHANGELOG § Added | pending |
| Final | — | Integration Validation (test/typecheck/lint/registry/build) | pending |

## Wiring triad (ADR D4 do plano — adaptação de lib aprovada M0-M3)

- (a) caller = barrel + stories + registry inline
- (b) integration = testes de composição co-localizados
- (c) métrica = data-slot assertado no DOM
