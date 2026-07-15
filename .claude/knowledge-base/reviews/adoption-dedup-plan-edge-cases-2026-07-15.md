# Edge Case Review — adoption-dedup (plan)

Date: 2026-07-15 · Plan: v1.0→v1.1 · Cases: 4 (MUST FIX: 0, SHOULD TEST: 1, DOCUMENT: 3)

## SHOULD TEST

### EC-1: playground pode não ter caminho de request para ligar os params
- **T3.2 · NEGATIVE** — se o playground não tiver estado de request, o painel viraria decorativo (violando o próprio ADR D3).
- **Checkpoint:** T3.2 HALT e surface ao humano se não existir caminho de request para wiring real.

## DOCUMENT

### EC-2: @theokit/ui pode divergir dos 7 símbolos — já coberto (T2.0 Deep Dives: HALT com diff).
### EC-3: 0.22.0 precisa estar no npm antes do PR-0 — coberto pelo grafo (M7 só inicia pós-M6 released).
### EC-4: fluxos de contribuição próprios dos repos consumidores — PRs seguem as convenções de cada repo; DoD aceita "merged OU abertos".

**Verdict:** PLAN OK (v1.1 absorve o checkpoint EC-1)
