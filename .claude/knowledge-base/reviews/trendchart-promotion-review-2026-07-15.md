# Review: trendchart-promotion

**Date:** 2026-07-15
**Reviewers:** 5 papéis (agente consolidado; YAMLs 5/5 válidos em `.claude/agents/review-trendchart-promotion-2026-07-15/findings/`)
**Findings:** 0 BLOCKER · 0 HIGH · 2 MEDIUM (mesma causa — **FIXADOS**: pin de potência limpa do `niceMax` restaurado, `toBe(40)` + caso fracionário) · 6 LOW (followups) · INFOs
**Verdict:** **READY_TO_MERGE**

## Destaques verificados pelo review

- **Fidelidade do porte CONFIRMADA** por diff semântico fonte↔porte: apenas os deltas do ADR D1 + endurecimento EC-1 (non-finite skip); 2 micro-deltas behavior-neutral (INFO).
- ACs re-executados: suite trend-chart 19/19 (20/20 pós-fix); suite completa 796/796; typecheck/lint 0; registry 66; build com TrendChart no dist; zero `data-testid`; axe 0.
- **Kit fix #9 (diff_symbols) auditado e aprovado**: filtra derivação de símbolos de stories/tests, não a busca de callers; 25/25 símbolos reais seguem verificados; risco residual LOW anotado.
- Wiring triad 7/7 per ADR D3 (stories renderizam de fato — pillar a re-verificado manualmente pelo agente).
- Cross-validation: 5/5 tasks ([T{N.M}]), Coverage Matrix 6/6, plano congelado (sem drift), CHANGELOG ✅.

## LOWs (followups, não bloqueiam)

linScale endpoints sem pin dedicado; header da tabela sem pin; aritmética 17/18/19 no plano (drift de contagem documentado); log de exclusões no diff_symbols; `font-semibold` sobrepõe o peso do token label-caps (paridade visual com a fonte — revisar no sweep de tokens).

## Handoff decision

**READY_TO_MERGE** → `/release` (minor 0.19.0).
