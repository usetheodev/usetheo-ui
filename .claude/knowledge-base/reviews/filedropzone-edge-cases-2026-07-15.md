# Discover Edge Case Review — filedropzone

Date: 2026-07-15
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/filedropzone-plan.md
Research questions analyzed: 6
Edge cases found: 3 (MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 1)

## MUST FIX

(nenhum — paths verificados em disco 2026-07-15; budget e stop conditions declarados; 4/4 corners)

## SHOULD TEST

### EC-1: index.spec.tsx tem 3609 linhas — Q4 estoura o budget se lido integral
- **Affected question:** Q4
- **Verificado:** `wc -l src/index.spec.tsx` = 3609; 12 describes mapeados (behavior, document drop protection, event propagation, onFocus/onBlur/onClick/onKeyDown/onDrag*/onDrop/onFileDialogCancel).
- **Suggested halt-loop checkpoint:** ler SELETIVAMENTE apenas os describes `onDrag*` (l.1989), `onDrop` (l.2398), `onKeyDown` (l.1809) + as fixtures do topo (createDtWithFiles) — os demais viram inventário por nome.

### EC-2: validação tem spec próprio (utils/index.spec.ts, 41 tests) não citado no plan
- **Affected question:** Q2/Q4
- **Verificado:** `src/utils/index.spec.ts` (573 linhas, 41 tests) existe.
- **Suggested halt-loop checkpoint:** Q2 lê `utils/index.ts` + cruza com `utils/index.spec.ts` (os 41 tests pinam exatamente o shape de rejeição que vamos portar) — fonte mais barata que o spec gigante.

## DOCUMENT

### EC-3: `document drop protection` (l.532) é comportamento global (preventDocumentDrop)
- **Accepted risk:** proteger o document inteiro contra drop acidental é feature do hook da referência; nosso primitive pode documentar como responsabilidade do consumidor (app shell) — anotar a fronteira no blueprint, sem expandir escopo.

## Summary

| Question | Edges | MUST FIX | SHOULD TEST | DOCUMENT |
|---|---|---|---|---|
| Q2 | 1 | 0 | 1 | 0 |
| Q4 | 1 | 0 | 1 | 0 |
| (global) | 1 | 0 | 0 | 1 |

**Verdict:** DISCOVERY PLAN OK (v1.0 → v1.1 absorvendo EC-1/EC-2 como checkpoints)
