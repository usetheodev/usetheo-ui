# Edge Case Review — slider-combobox-playground (implementation plan)

Date: 2026-07-14
Plan analyzed: .claude/knowledge-base/plans/slider-combobox-playground-plan.md (v1.0)
Tasks analyzed: 7 (T1.1, T1.2, T2.1, T2.2, T3.1, T3.2, T3.3)
Cases found: 7 (EDGE: 4, NEGATIVE: 3 | MUST FIX: 1, SHOULD TEST: 3, DOCUMENT: 3)

## MUST FIX

### EC-1: min === max → posição percentual das marks divide por zero
- **Affected task:** T1.1
- **Kind:** EDGE (extremo válido degenerado)
- **Family:** Input / Boundary
- **Scenario:** `((mark.value - min) / (max - min)) * 100` com `max === min` → `NaN%`/`Infinity%` no style — render quebrado silencioso. O Deep Dive menciona o caso mas NENHUM teste do TDD o cobre.
- **Impact:** Estilo inválido no DOM; regressão visual silenciosa.
- **Suggested fix:** guard de 1 linha (`const range = max - min || 1`) + RED test `test_marks_with_min_equal_max_render_at_zero()` no TDD de T1.1.

## SHOULD TEST

### EC-2: Mark click com slider disabled deve ser no-op
- **Affected task:** T1.1
- **Kind:** NEGATIVE (interação inválida)
- **Suggested test:** `test_mark_click_ignored_when_disabled` — `disabled` + click no mark → `onValueChange` NÃO chamado (marks são buttons próprios; o disabled do Radix não os cobre automaticamente — propagar `disabled` + assert).

### EC-3: Loading + zero itens → mostra loading, NÃO Empty
- **Affected task:** T2.1
- **Kind:** EDGE (conflito de estados válidos)
- **Suggested test:** `test_loading_suppresses_empty_state` — `loading` com lista vazia → `combobox-loading` visível e `Command.Empty` ausente (evita "No results" enganoso durante fetch).

### EC-4: Unmount com listbox aberto remove o listener global
- **Affected task:** T2.1
- **Kind:** NEGATIVE (lifecycle)
- **Suggested test:** `test_unmount_removes_outside_listener` — unmount aberto → `document.removeEventListener` efetivo (spy) — sem leak/erro em mousedown posterior.

## DOCUMENT

### EC-5: Texto digitado vs valor selecionado no Combobox
- **Kind:** EDGE (semântica de estado)
- **Accepted risk:** cmdk separa search text (interno do `Command.Input`) do `value` de seleção — nosso root só gerencia seleção; comportamento "o que o input mostra após selecionar" definido na implementação (mostrar label selecionado; padrão shadcn/base-ui) e coberto pelo teste de seleção existente. Sem estado novo no plano.

### EC-6: Mark click em modo range é no-op
- **Kind:** EDGE
- **Accepted risk:** já declarado no Deep Dive de T1.1 e documentado em JSDoc (qual thumb mover é ambíguo — decisão consciente, paridade com a ausência do recurso no Mantine RangeSlider).

### EC-7: Clipping do listbox inline
- **Kind:** EDGE (layout do consumidor)
- **Accepted risk:** ADR D2 do plano + JSDoc + story (AC de T2.2 exige a menção). Trigger de reavaliação registrado.

## Summary

| Task | EDGE | NEGATIVE | MUST FIX | SHOULD TEST | DOCUMENT |
|------|------|----------|----------|-------------|----------|
| T1.1 | 2 | 1 | 1 (EC-1) | 1 (EC-2) | 1 (EC-6) |
| T2.1 | 2 | 2 | 0 | 2 (EC-3, EC-4) | 2 (EC-5, EC-7) |
| T1.2/T2.2/T3.x | 0 | 0 | 0 | 0 | 0 (fronteiras de toolchain cobertas por validate/typecheck — precedente M0) |

**Coverage check:** T1.1 e T2.1 (fronteiras de input reais) têm ≥1 EDGE e ≥1 NEGATIVE cada. ✅

**Verdict:** PLAN NEEDS ADJUSTMENT (1 MUST FIX + 3 SHOULD TEST — absorver no TDD)
