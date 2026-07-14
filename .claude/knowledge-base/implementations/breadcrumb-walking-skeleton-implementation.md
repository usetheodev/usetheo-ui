# Implementation contract: breadcrumb-walking-skeleton (M0)

**Plan:** `.claude/knowledge-base/plans/breadcrumb-walking-skeleton-plan.md` (v1.3, SHIPPABLE 98, attested 7d96ecac…)
**Date:** 2026-07-14
**Branch:** develop

## Pre-condition audit

- Plan verdict SHIPPABLE (98), attested. TDD shape gate: all_pass.
- Branch develop; tree clean (artefatos de cycle commitados em 745e/…).
- Toolchain: node v22.22.2 (.nvmrc: 22 ✅), pnpm, vitest, biome.
- SEPA: spawned (Explore agent, read-only). Brief inicial persistido em `breadcrumb-walking-skeleton/sepa-iterations/initial-brief-response.md`. Achados absorvidos no plano v1.3 (+2 testes: data-slot, forwardRef; convenções forwardRef/displayName/Slot named import; lucide fora do descriptor).
- **Engine note (honesto):** halt-loop executado inline nesta sessão goal-hooked (o goal hook da sessão é o mecanismo de restart; um ralph-loop concorrente sobre o mesmo estado é anti-pattern per `rules/loop-engine-convention.md § Anti-patterns`). Contrato por iteração (RED→GREEN→REFACTOR→WIRING→COMMIT→PROGRESS), stop conditions e promises mantidos integralmente.

## Ordered task list

| # | Task | Phase | Status |
|---|---|---|---|
| 1 | T1.1 Breadcrumb primitive com TDD completo (13 testes) | 1 | pending |
| 2 | T1.2 Story de composição | 1 | pending |
| 3 | T2.1 Export no barrel | 2 | pending |
| 4 | T2.2 Registry entry + build + validate | 2 | pending |
| 5 | T2.3 Soft-deprecation TopNav + CHANGELOG | 2 | pending |
| 6 | T3.1 Adoção no studio (cross-repo) | 3 | pending (gated: release) |

## Iteration log

(preenchido por iteração)
