# Discover Edge Case Review — adoption-dedup

Date: 2026-07-15 · Plan: v1.0 · Cases: 2 (MUST FIX: 0, SHOULD TEST: 1, DOCUMENT: 1)

## SHOULD TEST

### EC-1: workspaces do studio — o package.json relevante pode não ser o raiz
- **Q4/Q6** — studio é monorepo (`packages/studio`); a dep pode estar em mais de um package.
- **Checkpoint:** Q4 varre TODOS os package.json do workspace (`find -name package.json -not -path '*/node_modules/*'`).

## DOCUMENT

### EC-2: dashboard pode ter mudado desde as leituras M3-M6
- Os inventários citam file:line do estado ATUAL; M7 implement re-verifica antes de cada PR de adoção (cross-repo, ciclos próprios — risco #1 do ROADMAP).

**Verdict:** DISCOVERY PLAN OK (checkpoint EC-1 absorvido abaixo)
