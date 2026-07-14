# Deps Audit: breadcrumb-walking-skeleton

**Date:** 2026-07-14
**Mode:** plan-bound:breadcrumb-walking-skeleton
**Verdict:** PASS (plan deps limpos; MAJOR outdated com ADR-pin D5; advisories dev-chain não bloqueantes)
**Hard caps triggered:** (none)

## Summary
- Ecosystems detected: npm (pnpm-lock.yaml)
- Total deps audited: 740 (pnpm audit metadata)
- Vulnerabilities found: 0 CRITICAL, 1 HIGH, 3 MODERATE, 1 LOW — **todas em devDependencies transitivas (vite 5.4.21 / esbuild via vitest)**; NENHUMA em dep declarada do plano
- Outdated (deps do plano): 1 MAJOR — `lucide-react` 0.471.2 → 1.24.0 (**ADR-pinned**: plano ADR D5)
- Allowlist hits: 0
- Auditor coverage: { pnpm-audit: ran, osv-scanner (pnpm-lock.yaml): ran — cross-check consistente (5 findings, mesmos pacotes) }

## Vulnerabilities (sorted by severity) — dev-chain, fora das deps declaradas

### CVE-2026-53571 — HIGH (npm: vite@5.4.21, devDependency transitiva via vitest)
- **Título:** `server.fs.deny` bypass on Windows alternate paths
- **Fixed in:** >=6.4.3
- **Path:** root → vitest → vite (dev-only; a lib não roda dev server em produção; CI roda em Linux)
- **Plan reference:** NÃO é dep declarada do plano — não aciona `cve_high_npm` (golden rule § 2 escopo: declared deps). Registrado como follow-up.

### CVE-2026-39365 — MODERATE (vite@5.4.21) — Path Traversal em `.map` de optimized deps; fixed >=6.4.2
### CVE-2026-53632 — MODERATE (vite@5.4.21) — NTLMv2 hash disclosure via UNC (Windows); fixed >=6.4.3
### GHSA-67mh-4wv8-2f99 — MODERATE (esbuild@0.21.5) — dev server request forgery; fixed >=0.25.0
### GHSA-g7r4-m6w7-qqqr — LOW (esbuild@0.27.7) — arbitrary file read (Windows dev server); fixed >=0.28.1

**Diff suggestion (follow-up chore, fora deste plano):**
```diff
# bump vitest para versão que traga vite >=6.4.3 (ou pnpm override "vite": ">=6.4.3")
```

## Outdated (deps do plano)

### npm: lucide-react@0.471.2 → 1.24.0 (MAJOR)
- **ADR pin:** plano ADR D5 — bump 1.x é repo-wide (54 componentes), fora do escopo do walking skeleton; follow-up dedicado pós-M0.
- Diff OMITIDO para MAJOR — revisar breaking changes no follow-up.

## Plan validation (Mode 2)

| Plan dep | Section | Manifest match | Audit clean? | Rule 9 OK? | Verdict |
|---|---|---|---|---|---|
| `@radix-ui/react-slot` | Existing | yes (`^1.1.2`, package.json:50) | yes (0 CVEs) | n/a | OK |
| `lucide-react` | Existing | yes (`^0.471.0`, package.json:58) | yes (0 CVEs; MAJOR outdated → ADR D5) | n/a | OK |
| `class-variance-authority` | Existing (transparência; sem uso novo) | yes (`^0.7.1`, package.json:55) | yes | n/a | OK |
| (NEW) | — | — | — | Rule 9 avaliado: react-aria/Mantine rejeitados (blueprint § Q5) → zero dep nova | OK |

## Recommended next steps

1. Prosseguir com `/plan-confidence` (verdict PASS não capa o plano).
2. Follow-up chore (fora do M0): bump da cadeia vitest/vite para sanar CVE-2026-53571 (HIGH, dev-only) — sugestão: `pnpm up vitest` ou override `vite>=6.4.3`.
3. Follow-up pós-M0: avaliação do bump lucide-react 1.x (ADR D5).
