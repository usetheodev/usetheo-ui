# ADR 0002-m6 — DataTable: extrações pelo piso de 300 + união discriminada

**Date:** 2026-07-15 · **Status:** Accepted · **Amends:** plan datatable-virtualized v1.2 (T1.2 Files-to-edit / AC "diff mínimo < 60 linhas")

## Context

`data-table.tsx` tinha 357 LoC — já acima do piso `MAX_FILE_LINES=300` do hook de qualidade; QUALQUER edição era bloqueada. O plano previa o fallback ("se o hook bloquear a edição, extrair o branch para o módulo novo" — D2), mas o AC de diff < 60 linhas era inalcançável.

## Decision

1. Extrações co-localizadas: `compare-values.ts` (comparator puro), `use-data-table-sort.ts` (estado de sort compartilhado pelos DOIS modos — mata duplicação de lógica de negócio), `data-table-loading.tsx` (skeleton), `data-table-parts.tsx` (HeaderRow + RowActionsCell + renderCellContent, compartilhados pelos dois corpos). `data-table.tsx` → 288 LoC.
2. Testes novos em `data-table-virtualized.test.tsx` próprio (o test file legado já tinha 279 LoC).
3. `DataTableProps<T>` de interface → união discriminada (type-only; § Changed do CHANGELOG).
4. Registry: 6 files no descriptor + `env` registryDependency (isDev). Followup #11 do kit: o validator não introspecta imports LOCAIS dos files — um item com file faltante passa no validate.

## Alternatives considered

- Editar com allowlist do hook (não existe mecanismo — criar um seria workaround).
- Reescrever data-table.tsx inteiro abaixo de 300 sem extrações (rejeitado — perderia o diff mínimo e a rastreabilidade; os 15 testes legados protegem exatamente o refactor por extração).

## Consequences

- Duplicação PRÉ-EXISTENTE (header do loading vs corpo) e a que NASCERIA entre os modos foi eliminada — o hook forçou um design melhor.
- 15 testes legados verdes sem alteração = prova do zero-breaking; suite 892/892.
