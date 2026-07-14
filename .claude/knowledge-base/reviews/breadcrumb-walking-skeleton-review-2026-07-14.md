# Review: breadcrumb-walking-skeleton

**Date:** 2026-07-14
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (audit trail em `.claude/agents/review-breadcrumb-walking-skeleton-2026-07-14/`)
**Findings:** 25 total (BLOCKER: 0, HIGH: 0, MEDIUM: 6 → dedupe 2 pares → 3 FIXADOS + 3 documentados, LOW: 6, INFO: 10)
**Verdict:** **READY_TO_MERGE**

> **Nota de processo (meta-defeito honesto):** `consolidate_findings.py` descartou silenciosamente 3/5 YAMLs de findings (parse errors — dois-pontos sem aspas na prosa dos agentes) e emitiu um relatório com zeros. Este relatório foi consolidado manualmente a partir dos 5 outputs dos agentes (2 YAMLs parseáveis + resumos estruturados); os YAMLs brutos permanecem no audit trail. Followup de kit registrado (robustez do agregador + template de agente exigindo strings quoted).

## BLOCKER findings

(none)

## HIGH findings

(none)

## MEDIUM findings

| ID | Found by | Resolução |
|---|---|---|
| F-arch-2 ≡ F-dom-2 — `Breadcrumb.Link asChild` descartava `href` em vez de repassar via Slot (contradiz ADR D3/paridade shadcn; caminho não testado) | architecture + domain-frontend | **FIXADO** em `2f2d9a56` (href repassado; child props vencem no merge; teste novo pina) |
| F-tests-1 — teste de lista vazia sem o `axe` prometido pelo RED #10 do plano | tests | **FIXADO** em `2f2d9a56` (axe adicionado) |
| F-wire-3 — checkpoint T3.1 `blocked` sem chave `blocked_reason` canônica | wiring | **FIXADO** em `2f2d9a56` |
| F-arch-1 — factory interna `sub()` introduzida sem ADR (diverge do idioma "subs à mão") | architecture | **Documentado**: a factory foi exigida pelo quality-hook (duplicate-block) no REFACTOR; racional no commit `5017db2b` + aqui. Aceito como idioma para subs presentacionais; generalização candidata no followup do topnav. |
| F-arch-3 ≡ F-xval-2 — commit T2.2 regenerou 5 artefatos `registry/r/*` pré-existentes (drift do 0.15.0), violando literalmente o AC "diff só aditivo" | architecture + cross-validation | **Documentado**: regeneração determinística do `registry:build`; drift pré-existente; explicitado aqui e no PR de release. |
| F-xval-1 — plano v1.3 commitado após os commits de código (ordering do audit-trail) | cross-validation | **Documentado**: evidência prova amendment pré-RED (T1.1 nasceu com os 13 testes do v1.3); defeito de ordenação do trail, não contrato mudado mid-flight. |

## LOW findings (advisory)

- F-tests-2: teste de separador custom usa N=2 (o teste de contagem 3→2 cobre a propriedade N-1 geral).
- F-tests-3: 3 nomes de teste com "and" (espelham os nomes do plano).
- F-arch-4: `HTMLAttributes<E>` genérico no factory perde props específicas por elemento — aceito no M0.
- F-wire-1: `check_wiring.py` exige `tests/integration/` e conta callers dos clones em `references/` (falso negativo de ferramenta) — followup do kit antes do M1.
- F-wire-2: valores `wiring` normalizados para o enum do schema (fixado com F-wire-3).
- F-dom-1: `sr-only "More"` do Ellipsis dentro de `aria-hidden` nunca é anunciado (quirk herdado do shadcn shipped) — limpeza candidata em minor futura.

## INFO (10)

"No issues found" por lente/arquivo: testes 16/16 conformes (AAA, sem skip/only), stories, barrel aditivo, topnav JSDoc-only (regressão 11/11), registry descriptor íntegro, CHANGELOG atualizado, tokens-only PASS (zero hex), APG conformance PASS, SSR-safe, `role=link+aria-disabled` no Page avaliado criticamente e aceito (paridade plan-locked).

## Edge-case coverage report

- Edge/negative do plano: **cobertos** — empty list (+axe), single item, custom separator, `javascript:` href, href undefined/"", asChild props/href. EC-3 (studio bare route) pertence ao T3.1 (pós-release, por design).
- `edge_case_coverage.py` (heurística keyword sobre AC/DoD) marca "missing" itens que são comandos de gate — ruído da heurística; os gates rodaram de verdade (abaixo).

## Cross-validation summary

- Plan tasks: 6 — fully implemented: 5 (`5017db2b`, `0eeed798`, `107eecb7`, `bd3fe0e4`, `3330fadf`) · partial: 0 · missing: 0 · diverged: 0 · blocked-by-design: 1 (T3.1, gated on release; checkpoint + roadmap-run consistentes)
- AC/DoD: 18/21 verificados por execução real; 3 pendentes = T3.1 (cross-repo pós-release). 0 false claims. ADRs 5/5 respeitados (D5: package.json/lockfile intocados).
- Coverage Matrix: 7/7.

## Quality gates summary (re-validados neste review)

- `pnpm test:run`: 684 passed (suite completa; breadcrumb 16/16 pós-fixes)
- `pnpm typecheck`: PASS (0) · `pnpm lint`: PASS (0 warnings)
- `pnpm registry:build && registry:validate`: PASS (61 itens)
- `pnpm build`: PASS (Breadcrumb no dist)
- `/code-quality`: PASS_WITH_CAVEATS (89 — soft floor `symbol_fab_unverifiable_typescript`, D2 sem rede; 0 hard caps)
- Wiring triad: (a) PASS — barrel+story+registry inline · (b) PASS per plan ADR D4 — testes de composição co-localizados · (c) PASS — data-slot assertado no DOM

## Spawned agents (audit trail)

- `.claude/agents/review-breadcrumb-walking-skeleton-2026-07-14/{architecture,tests,wiring,cross-validation,domain-frontend}.md`
- `.claude/agents/review-breadcrumb-walking-skeleton-2026-07-14/findings/*.yaml` (3 com YAML parse error — conteúdo íntegro, ver nota de processo)

## Handoff decision

**READY_TO_MERGE** — 0 BLOCKER, 0 HIGH; 3 MEDIUMs corrigidos e re-verificados (`2f2d9a56`), 3 documentados com racional; LOWs logados como followups. Próximo: `/release`.
