# Edge Case Review — datatable-virtualized (plan)

Date: 2026-07-15
Plan analyzed: .claude/knowledge-base/plans/datatable-virtualized-plan.md (v1.0)
Cases: 4 (EDGE: 3, NEGATIVE: 1 | MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 2)

## SHOULD TEST

### EC-1: dataset MENOR que o viewport
- **T1.2 · EDGE** — 3 rows num viewport de 400px: a janela deve conter TODAS as linhas (virtualização vira no-op correto, sem NaN/sizer quebrado).
- **Test:** `test_virtualized_dataset_smaller_than_viewport_renders_all()`.

### EC-2: rowHeight inválido (0/negativo)
- **T1.2 · NEGATIVE** — divisão por zero na matemática da janela; consumidor JS pode passar 0.
- **Test:** `test_virtualized_invalid_row_height_dev_warning()` — dev-warning + fallback (rowHeight mínimo 1) sem crash.

## DOCUMENT

### EC-3: overscan > count
- Core da dep clampa (comprovado pela API); sem teste próprio — comportamento de terceiro (testing.md § 4).

### EC-4: height responsivo (string "60vh")
- Aceito pelo tipo; rect real só em browser — coberto pela matriz manual da story.

**Verdict:** PLAN NEEDS ADJUSTMENT (menor — absorver EC-1/EC-2; 12→14 REDs no T1.2)
