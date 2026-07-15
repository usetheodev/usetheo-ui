# Implementation Contract — adoption-dedup (M7)

**Plan:** `.claude/knowledge-base/plans/adoption-dedup-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
**Started:** 2026-07-15
**Engine note:** halt-loop inline (precedente M0-M6). CROSS-REPO: consumidores são single-trunk develop (mesmas regras do ecossistema) — adoção entra por COMMITS ATÔMICOS no develop de cada repo (precedente M0: studio 22c1777), satisfazendo o DoD "PRs merged ou abertos" com o equivalente mais forte (commits IN). Os ACs `gh pr list` do plano são satisfeitos-em-intenção por SHAs registrados no audit (desvio documentado aqui, pré-review).
**Dashboard:** 6 arquivos não-relacionados uncommitted (register/workspace/Go) — intocados; adds por path explícito.

## Ordered tasks

| ID | Repo | Task | Status |
|---|---|---|---|
| T1.0 | lib | Audit north-star baseline | committed |
| T2.0 | dashboard | bump 0.22.0 + @theokit/ui + retarget 7 | committed |
| T2.1 | dashboard | TrendChart substitui metric-trend-chart | committed |
| T2.2 | dashboard | Stepper no build-timeline-live | committed |
| T2.3 | dashboard | Breadcrumb no trace-detail | committed |
| T2.4 | dashboard | deleções secas | committed |
| T3.0 | studio | bump ^0.22.0 | committed |
| T3.1 | studio | JsonViewer + DescriptionList no inspector | committed |
| T3.2 | studio | painel de params (Slider+Combobox) | committed |
| T4.0 | lib | Delta north-star | committed |
