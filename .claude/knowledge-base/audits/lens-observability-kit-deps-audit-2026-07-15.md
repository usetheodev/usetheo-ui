# Deps Audit — lens-observability-kit (M8)

**Date:** 2026-07-15 · **Mode:** plan-bound · **Scanner:** osv-scanner (lockfile pnpm-lock.yaml); `pnpm audit` indisponível (endpoint npm 410 — aposentado; ambiente, não produto)

## Verdict: PASS_WITH_CAVEATS

O plano declara **ZERO dependência nova** (`## Dependencies` do plano) — hard caps de CVE aplicam-se às deps declaradas/tocadas:

| Dep tocada (runtime) | Versão | CVEs | Resultado |
|---|---|---|---|
| `@tanstack/react-virtual` | ^3.13.12 (desde M6) | 0 no OSV | PASS |
| `react`/`react-dom` (peers) | ^18 \|\| ^19 | 0 | PASS |

## Caveats (dev-chain transitivo — NÃO são deps declaradas do plano)

| Pacote | Versão | CVE | CVSS | Exposição |
|---|---|---|---|---|
| vite | 5.4.21 | GHSA-fx2h-pf6j-xcff | 8.2 | dev server local apenas; transitivo do toolchain de teste — não shipped |
| vite | 5.4.21 | GHSA-4w7w-66w2-5vf9 | 6.3 | idem |
| vite | 5.4.21 | GHSA-v6wh-96g9-6wx3 | 5.5 | idem |
| esbuild | 0.21.5 | GHSA-67mh-4wv8-2f99 | 5.3 | dev server local apenas |
| esbuild | 0.27.7 | GHSA-g7r4-m6w7-qqqr | 2.5 | idem |

**Ação:** reforça o followup já logado (kit #2 — upgrade vitest/vite). Não bloqueia o M8 (golden rule § 2: caps aplicam-se a deps DECLARADAS do plano; estas são devDependencies transitivas, sem superfície em produção — o pacote publicado não as carrega, verificável no tarball).

## Rule 9 (não reinventar)

Markdown (react-markdown) e CodeMirror deliberadamente NÃO entram (ADRs D2/D3 do blueprint — slot + JsonViewer M2). Nenhum parser/sanitizer hand-rolled no plano; o default do slot é texto puro (nunca interpreta HTML).
