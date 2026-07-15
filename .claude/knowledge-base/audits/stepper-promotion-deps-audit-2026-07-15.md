# Deps Audit: stepper-promotion

**Date:** 2026-07-15 · **Mode:** plan-bound · **Verdict:** PASS
**Hard caps triggered:** (none)

## Summary

- Ecosystem: npm (`package.json` + `pnpm-lock.yaml`)
- Plano declara: 1 dep Existing (`lucide-react ^0.471.0`), 0 NEW, 0 Removed — package.json intocado por contrato do plano (Coverage Matrix #5)
- `pnpm audit`: endpoint npm aposentado (410 — `ERR_PNPM_AUDIT_BAD_RESPONSE`) — cross-check via `osv-scanner --lockfile=pnpm-lock.yaml` (instalado, ran)
- osv-scanner: 5 advisories, TODAS na cadeia dev (vitest → vite 5.4.21 / esbuild 0.21.5|0.27.7) — mesmas 5 já registradas nos audits M0-M2 (kit followup #2); nenhuma em dependência declarada do plano; nenhuma em dependência de runtime publicada
- Auditor coverage: { pnpm-audit: FAILED (endpoint 410 — gap ambiental documentado), osv-scanner: ran, npm outdated: ran }

## Vulnerabilities (dev-chain — fora da superfície declarada do plano)

| Package (dev-chain) | Advisory | Severity | Fixed in |
|---|---|---|---|
| vite 5.4.21 (via vitest) | GHSA-fx2h-pf6j-xcff | HIGH | 7.3.5 / 8.0.16 |
| vite 5.4.21 | GHSA-4w7w-66w2-5vf9 | MODERATE | 7.3.2 / 8.0.5 |
| vite 5.4.21 | GHSA-v6wh-96g9-6wx3 | MODERATE | 8.0.16 |
| esbuild 0.21.5 | GHSA-67mh-4wv8-2f99 | MODERATE | 0.25.0 |
| esbuild 0.27.7 | GHSA-g7r4-m6w7-qqqr | LOW | 0.28.1 |

**Posição (consistente com M0-M3):** são devDependencies transitivas do toolchain de teste (dev server/bundler nunca embarcados no pacote publicado `@usetheo/ui`); o upgrade de vitest/vite é o kit followup #2 — trabalho de infraestrutura fora do escopo deste plano, que não toca manifests. Não são deps *declaradas* do plano, logo não disparam os hard caps do golden rule (`cve_*` aplica-se a "declared dep").

## Outdated (runtime, informativo)

Radix patches disponíveis (avatar 1.2.2, checkbox 1.3.7, dialog 1.1.19, dropdown 2.1.20, radio 1.4.3, scroll-area 1.2.14) — PATCH level, fora do escopo (plano não toca manifests); sem ADR necessário (não são MAJOR).

## Plan validation

| Plan dep | Section | Manifest match | Audit clean? | Rule 9 OK? | Verdict |
|---|---|---|---|---|---|
| `lucide-react` | Existing | yes (`^0.471.0` em package.json:59) | yes (zero advisories) | n/a | OK |
| (NEW) | — | n/a | n/a | Rationale presente (mantine/radix avaliados e rejeitados com razão) | OK |

`## Dependencies` presente, versões pinadas, coluna Rule 9 preenchida — nenhum `INVALID_PLAN_DEPS`.

## Recommended next steps

1. Prosseguir com `/plan-confidence stepper-promotion`.
2. (Kit, fora do plano) followup #2: upgrade vitest/vite para sanar a cadeia dev.
