# Edge Case Review — trendchart-promotion (implementation plan)

Date: 2026-07-15 · Plan: v1.0 · Tasks: 5
Cases: 3 (MUST FIX: 0, SHOULD TEST: 1, DOCUMENT: 2)

## MUST FIX
(none — os edges centrais são as lições de produção JÁ pinadas nos 13 testes portados: M90 séries irregulares, M76 esparsas, single-bucket, empty, zero-width domain)

## SHOULD TEST
### EC-1: ponto com y não-finito DENTRO de série com dados
- **Task:** T1.1 · **Kind:** NEGATIVE
- **Suggested test:** `test_nonfinite_point_does_not_break_path()` — série com um `y: NaN` no meio: o path não contém "NaN" (ponto ignorado no path e "—" na tabela). A fonte não pina isso (gaps em produção = ponto ausente, não NaN) — o porte endurece a fronteira (fail-safe, testing.md § 4.1).

## DOCUMENT
### EC-2: y negativo clipa abaixo da baseline (domínio [0, yMax] — paridade com a fonte; métricas alvo são ≥ 0). JSDoc declara o contrato.
### EC-3: x não ordenado — seriesPath conecta na ordem dada (paridade; consumidor ordena). JSDoc declara.

**Verdict:** PLAN OK (absorver EC-1 no TDD; contagem 16→17)
