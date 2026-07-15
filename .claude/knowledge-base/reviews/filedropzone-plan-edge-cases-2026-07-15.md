# Edge Case Review — filedropzone (plan)

Date: 2026-07-15
Plan analyzed: .claude/knowledge-base/plans/filedropzone-plan.md (v1.0)
Tasks analyzed: 6
Cases found: 5 (EDGE: 3, NEGATIVE: 2 | MUST FIX: 0, SHOULD TEST: 3, DOCUMENT: 2)

## MUST FIX

(nenhum)

## SHOULD TEST

### EC-1: boundary exato de maxFiles
- **Affected task:** T1.1 · **Kind:** EDGE
- O plano testa 3>2 (estouro) mas não `files.length === maxFiles` (o maior VÁLIDO — testing.md § 4.1).
- **Suggested test:** `test_validatefiles_maxfiles_exact_boundary_accepts()` — 2 files com maxFiles 2 → todos accepted.

### EC-2: boundary exato de maxSize
- **Affected task:** T1.1 · **Kind:** EDGE
- `size === maxSize` deve ser aceito (referência usa `>` estrito — `utils/index.ts:97`).
- **Suggested test:** `test_validatefiles_size_equal_to_max_accepts()`.

### EC-3: drop/change com zero arquivos
- **Affected task:** T1.2 · **Kind:** NEGATIVE
- `fireEvent.change` com files=[] ou drop vazio → contrato: NENHUM callback (não `onFilesAccepted([])`).
- **Suggested test:** `test_empty_file_list_triggers_no_callbacks()`.

## DOCUMENT

### EC-4: diretório arrastado (getAsFile null / entrada sem type+size)
- **Kind:** NEGATIVE · **Accepted risk:** já em Drawbacks; jsdom não simula; JSDoc documenta a fronteira.

### EC-5: accept só com extensões inválidas como chave MIME
- **Kind:** EDGE · **Accepted risk:** paridade com a referência (`acceptPropAsAcceptAttr` filtra silenciosamente); tipo `Record<mime, ext[]>` guia o consumidor TS.

## Summary

| Task | EDGE | NEGATIVE | MUST FIX | SHOULD TEST | DOCUMENT |
|---|---|---|---|---|---|
| T1.1 | 2 | 0 | 0 | 2 | 1 |
| T1.2 | 1 | 2 | 0 | 1 | 1 |

**Verdict:** PLAN NEEDS ADJUSTMENT (menor — absorver EC-1/EC-2/EC-3; 29→32 REDs)
