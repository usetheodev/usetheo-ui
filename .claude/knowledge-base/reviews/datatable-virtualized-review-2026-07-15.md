# Review: datatable-virtualized (M6)

**Date:** 2026-07-15
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (`.claude/agents/review-datatable-virtualized-2026-07-15/`, findings em `findings/*.yml`)
**Findings:** 40 total (BLOCKER: 0, HIGH: 1, MEDIUM: 5, LOW: 14, INFO: 20)
**Verdict:** **READY_TO_MERGE** — o HIGH e os 5 MEDIUMs foram FIXADOS in-cycle com RED-GREEN; LOWs fixados em lote ou aceitos com nota. Suite pós-fixes **896/896**.

> Consolidação manual (precedente M0-M5).

## HIGH — FIXADO

### F-dom-1 — sticky thead soltava após ~1 janela em browser real (containing-block)
- **Found by:** domain-frontend (não-detectável em jsdom; o agente derivou da regra CSS de containing-block + evidência de que o exemplo oficial NÃO tem sticky e o dashboard içou o header para fora)
- O padrão translate do exemplo oficial NÃO cresce o layout box da `<table>` (~800px de fluxo para 400.000px de sizer) — o thead sticky perdia o containing block e a última linha era inatingível (F-dom-2 MEDIUM, mesma causa).
- **Fix:** técnica de **spacer rows** — dois `<tr role="presentation">` de altura fixa crescem o layout box real da table para o dataset inteiro; sem transform por linha. Regressões: `test_virtualized_spacers_sum_to_total_size` (top+janela+bottom == 400.000px) e `test_virtualized_rows_in_flow_with_fixed_height_and_overscan`. Bônus: os DOIS mutantes sobreviventes achados pelo agente de testes (F-tests-1 translate não-corrigido; F-tests-2 overscan ignorado) morrem — a fórmula translate deixou de existir e o overscan agora é pinado por "Item 14" + length ≥ 15. JSDoc documenta o porquê vs o padrão do exemplo oficial.

## MEDIUM — todos FIXADOS

| ID | Resumo | Fix |
|---|---|---|
| F-dom-2 | Última linha das 10K inatingível (thead desloca o fluxo; sizer só cobria rows) | Resolvido pela técnica de spacers (layout box exato) |
| F-dom-3 | rowHeight 40 < mínimo real da célula (~43px com py-3) — drift em browser | Células do modo virtual: `py-1.5 + overflow-hidden` (mín ~31px); story compact 28→32; contrato no JSDoc |
| F-dom-4 | SR anunciava "row N of ~21" para 10.000 linhas | `aria-rowcount` na table + `aria-rowindex` por linha; pinado em teste |
| F-tests-1/F-tests-2 | 2 mutantes sobreviventes (provados por mutação executada pelo agente) | Mortos pela mudança de técnica + assertions de overscan/soma |
| F-xval-6 | Progress T2.3 apontava sha DANGLING (amend não refletido) | Corrigido para `d9b9e3de`; kit followup #12: `check_checkpoint_consistency.py` deve assertar ancestor-of-HEAD, não existência de objeto |

## LOW (destaques)

| ID | Ação |
|---|---|
| F-dom-5 (scroll region não focável — WCAG 2.1.1) | FIXADO — `<section aria-label tabIndex={0}>` + focus ring |
| F-dom-6 (virtualizerOptions spread por último podia sobrescrever o contrato) | FIXADO — injection primeiro |
| F-arch-1 (loading duplicava header) | FIXADO — reusa `DataTableHeaderRow` com sortable stripped |
| F-arch-2 (props duplicavam base — drift) | FIXADO — `Omit<DataTableBaseProps>` |
| F-arch-3 (stickyHeader ignorada silenciosamente) | FIXADO — `stickyHeader?: never` no braço virtualized |
| F-tests-3/5 (oráculo de sort negativo; fallback sem assert de DOM) | FIXADOS |
| F-wire-1/2 (slot -scroll e rowActions não exercitados) | FIXADOS (asserts + teste novo) |
| F-xval-1/2/7 (AC diff<60; testes em arquivo novo; registry 6 files) | ACEITOS — todos cobertos pelo ADR 0002-m6 (zero divergência silenciosa) |
| F-xval-3/4/5 (baseline de contagem do plano; oráculo grep -c pegando prose) | ACEITOS com feedback ao /to-plan (re-medir contagens; escopar oracles com jq) |
| F-arch-4 (loading/empty duplicados entre corpos) | ACEITO — followup de próximo touch |
| F-tests-4 (nenhum teste ROLA — scrollOffset sempre 0) | ACEITO — risco declarado no plano (matriz manual na story); candidato a followup |

## INFO (destaques)

- F-dom-7: verificação POSITIVA do agente de domínio — index do array (não do dataset) correto, keys por rowKey, hooks antes dos early-returns, classes do preset existem.
- Cross-validation: 6/6 tasks com traceabilidade; plano congelado pré-implement; TODOS os oracles re-executados verdes; bundle delta reproduzido byte-exato; OSV limpo.
- Wiring: registry/r NÃO stale (rewrite reproduzido independentemente, 6 files byte-identical); zero exports mortos.

## Quality gates summary (re-run pós-fixes)

- `pnpm test:run`: **896 passed / 0 failed** (20 novos no módulo; 19 legados byte-intocados = selo de zero-breaking)
- `pnpm typecheck` PASS (com @ts-expect-error genuinamente mordendo) · `pnpm lint` PASS
- `pnpm registry:build && registry:validate`: PASS (68; regenerado pós-fix)
- Bundle delta final medido: **+6.142 bytes min ESM** (~2,9% — ADR D1 fechado com número real)
- `/code-quality`: PASS_WITH_CAVEATS (89, ambiental)

## Handoff decision

**READY_TO_MERGE** → `/release` (0.22.0 — minor; § Added + § Changed type-only).
