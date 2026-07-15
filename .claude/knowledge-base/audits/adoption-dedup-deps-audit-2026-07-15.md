# Deps Audit: adoption-dedup

**Date:** 2026-07-15 · **Mode:** plan-bound · **Verdict:** PASS
**Hard caps triggered:** (none)

## Summary

- Deps do plano: `@usetheo/ui@^0.22.0` (o produto — publicada no pós-merge do PR #7) e `@theokit/ui` (interna do ecossistema, destino do pivot split no dashboard).
- `@theokit/ui`: existe no registry npm (versão verificada via `npm view` em 2026-07-15); **OSV: 0 vulns** (API consultada). Rationale Rule 9 presente (não é lib de terceiro).
- Lockfile da lib: mesmas 5 advisories dev-chain (followup #2); nenhuma em dep declarada.
- Instalações acontecem nos repos consumidores nos respectivos PRs (T2.0/T3.0 têm os oracles).

## Next steps

1. `/implement adoption-dedup` após M6 released (plan-confidence 89).
