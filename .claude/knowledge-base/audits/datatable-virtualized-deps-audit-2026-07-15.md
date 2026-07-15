# Deps Audit: datatable-virtualized

**Date:** 2026-07-15 · **Mode:** plan-bound · **Verdict:** PASS
**Hard caps triggered:** (none)

## Summary

- Plano declara 1 dep NEW: `@tanstack/react-virtual@^3.14.6` (a única do V1 — ADR D1 do plano com Rule 9 rationale numérico e 3 alternativas rejeitadas).
- **Verificação de registry:** `npm view` → versão 3.14.6 = latest, licença MIT ✓.
- **CVE (OSV API, consultada 2026-07-15):** `@tanstack/react-virtual` → **0 vulns**; transitiva `@tanstack/virtual-core` → **0 vulns**. Re-verificação pós-install agendada no T1.1 (AC: osv-scanner no lockfile).
- Lockfile atual: mesmas 5 advisories dev-chain (vite/esbuild — followup #2); nenhuma em dep declarada.
- `## Dependencies` presente, versão pinada, Rule 9 preenchida → nenhum INVALID_PLAN_DEPS.

## Plan validation

| Plan dep | Section | Registry | Audit clean? | Rule 9 OK? | Verdict |
|---|---|---|---|---|---|
| `@tanstack/react-virtual` | NEW `^3.14.6` | exists (latest 3.14.6, MIT) | yes (OSV 0 vulns; re-check no install) | yes (own/react-window/content-visibility rejeitados com números) | OK |
| `lucide-react` | Existing | — | yes | n/a | OK |

## Next steps

1. Prosseguir com `/implement datatable-virtualized` após o merge do PR #6 (plan-confidence já em 89).
2. T1.1 re-executa osv-scanner no lockfile pós-install (AC do plano).
