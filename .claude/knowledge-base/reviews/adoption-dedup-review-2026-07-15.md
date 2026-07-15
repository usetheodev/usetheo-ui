# Review: adoption-dedup (M7 — cross-repo)

**Date:** 2026-07-15
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (`.claude/agents/review-adoption-dedup-2026-07-15/`, findings em `findings/*.yml`)
**Findings:** 36 total (BLOCKER: 1, HIGH: 3, MEDIUM: 8, LOW: 9, INFO: 15)
**Verdict:** **READY_TO_MERGE** — BLOCKER e todos os HIGH fechados. Cadeia do PR #9 CONCLUÍDA: merge 73fd109f → tag v0.22.1 + gh release + npm publish (latest: 0.22.1) → bump ^0.22.1 nos consumidores → dashboard full suite **1734/1734** (217 files, o known-fail do projects.test resolveu) + studio **173/173**. Todos os MEDIUMs corrigidos.

> Consolidação manual (precedente M0-M6).

## BLOCKER — CORRIGIDO

### F-arch-1/F-xval-1 — bump do package.json do dashboard nunca foi commitado
- O e618bd6 declarava o bump na mensagem mas continha só os 9 retargets — HEAD do develop deles não compilava de clone limpo (imports de `@theokit/ui` sem a dep declarada); o progress registrava um arquivo não-commitado (claim falso).
- **Fix:** commit dedicado do `package.json` (^0.22.0 + @theokit/ui) referenciando o finding; typecheck de árvore verificado. Lição de kit (#13): o gate `check_checkpoint_consistency` deveria validar files[] contra `--name-only` do commit, não só o SHA.

## HIGH

| ID | Resumo | Estado |
|---|---|---|
| F-arch-2/F-wire-2 | `@theokit/ui@1.0.3` trazia `@usetheo/ui@^0.14` como dependency → DUAS cópias do DS nos consumidores (Toaster/useToast em runtimes distintos) | **CORRIGIDO** — theokit-ui#21 filado; dep movida para peerDependencies `>=0.22 <1`; `@theokit/ui@1.0.4` publicada (1406/1406 na suíte deles); consumidores re-lockados (zero cópias 0.14 verificado) |
| F-xval-2/F-arch-5 | Suite full do dashboard 1 vermelho (projects.test — regressão DA LIB #8) | **CORRIGIDO** — 0.22.1 released (PR #9 merged 73fd109f) + bump ^0.22.1 → dashboard full suite 1734/1734 verde |
| F-xval-3 | DoDs em shape de PR sem substituto registrado no run-file | **CORRIGIDO** — nota contratual da substituição PR→commit (single-trunk; precedente M0) + SHAs completos no run-file |

## MEDIUM — todos CORRIGIDOS

| ID | Fix |
|---|---|
| F-dom-1 | Separator movido para irmão do Item (li dentro de li era HTML inválido) |
| F-dom-2 | Chip do chat mostra `params.model` efetivo (não mais o default estático) |
| F-tests-1 | Payload pinado DENTRO do json-viewer (chave `stepId`, ausente do resumo) |
| F-tests-2 | Spy de params com interação real (Home no slider → temperature 0) + `model` assertado |
| F-tests-4 | `aria-current="page"` + não-botão pinados no crumb selecionado |
| F-tests-5/6 | Causa `failed: OOM` no step + timer `5s` via slot assertados |
| F-xval-4 | Comment reword — grep do DoD passa (0 hits) |
| F-xval-5 | Nota de review: o diff da lib pós-v0.22.0 é o fix #8 com trilha própria (issue+TDD+release) — fora do escopo do oracle do DoD |

## LOW (destaques)

Corrigidos: F-dom-3 (mapper SSE degrada desconhecido→pending), F-dom-4 (error_message na causa), F-dom-5 (Card sem aria-label órfã), F-dom-6 (text-xs na Page), F-tests-3 (asserts por data-slot/aria-current), F-tests-7 (data-state done/failed pinados), F-arch-4 (import type no topo — aceito como está, estilo). Aceitos com nota: F-xval-6/7 (arquivos extra nos commits — inventory drift EC-2 e wiring EC-1, ambos antecipados pelo plano), F-wire-3 (comments históricos), F-arch-3 (options object no runAgent — followup para o M1 do studio).

## Quality gates (re-run pós-fixes)

- **Dashboard:** typecheck 0; lens 8/8 + trace-detail 90/90 + deploy 41/41 (139/139 nas áreas tocadas); grep de hand-rolled = 0; full suite = 1 known-fail com cadeia in-flight (PR #9)
- **Studio:** typecheck 0; **173/173**
- **North-star (pilar c, reproduzido pelo agente de wiring):** baseline 46 → **48** símbolos únicos; números do audit re-executados batendo exatamente (44/161/155 + 14/22/22)
- **Adoção real verificada (pilar a):** 8/8 componentes com telas reais; zero adoção decorativa

## Handoff decision

**READY_TO_MERGE** — cadeia do PR #9 concluída (merge → v0.22.1 publicada → bumps commitados: dashboard 7606988+37139cf, studio 49db318+3e05cd4 → full suites verdes). M7 flippado.
