# Implementation Contract — filedropzone (M5)

**Plan:** `.claude/knowledge-base/plans/filedropzone-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
**Started:** 2026-07-15
**Engine note:** halt-loop inline com rigor integral (precedente aprovado M0-M4; ralph-loop concorrente com o Stop hook do goal = anti-pattern do loop-engine).
**SEPA:** não gerado — precedente M0-M4.

## Ordered tasks

| ID | Phase | Task | Status |
|---|---|---|---|
| T1.1 | 1 | Helpers puros matchesAccept/validateFiles (14 REDs) | committed |
| T1.2 | 1 | Componente FileDropzone (18 REDs) | committed |
| T1.3 | 1 | Stories (4) + smoke | committed |
| T2.1 | 2 | Barrel + smoke identidade | committed |
| T2.2 | 2 | Registry (68 itens) | committed |
| T2.3 | 2 | CHANGELOG § Added | committed |
| Final | — | Integration Validation | PASS — run_validation exit 0 |

## Wiring triad (ADR D4 do plano — adaptação aprovada M0-M4)

(a) barrel+stories+registry · (b) testes co-localizados · (c) data-slot no DOM
