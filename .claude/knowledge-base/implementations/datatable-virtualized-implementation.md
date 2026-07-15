# Implementation Contract — datatable-virtualized (M6)

**Plan:** `.claude/knowledge-base/plans/datatable-virtualized-plan.md` (v1.2, SHIPPABLE_WITH_CAVEATS 89)
**Started:** 2026-07-15
**Engine note:** halt-loop inline com rigor integral (precedente aprovado M0-M5).
**SEPA:** não gerado — precedente M0-M5.

## Ordered tasks

| ID | Phase | Task | Status |
|---|---|---|---|
| T1.1 | 1 | Dep @tanstack/react-virtual + baseline bundle | committed |
| T1.2 | 1 | União de tipos + corpo virtual + 14 REDs | committed |
| T1.3 | 1 | Stories (2) + smoke | committed |
| T2.1 | 2 | Barrel (tipo) + smoke | committed |
| T2.2 | 2 | Registry (dep + 2º file) | committed |
| T2.3 | 2 | CHANGELOG § Added | committed |
| Final | — | Integration Validation | PASS — test 892 + tc + lint + registry 68 + build |

## Medições (ADR D1 do plano)

- Bundle baseline (pré-dep): 211822 bytes (dist/index.js, pnpm build 2026-07-15)
- Bundle pós-T1.2: 217055 bytes — **delta total do modo virtualized (dep + código): +5233 bytes min ESM** (~2,4% do dist; muito abaixo da estimativa 10-16KB do blueprint) — fecha o ADR D1
