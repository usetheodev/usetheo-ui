# Review: V3 SOTA components (M14–M19) — consolidated library phase

**Date:** 2026-07-15
**Reviewer:** 1 agente consolidado (qualidade + correção + a11y + DRY), lib-only. Adoção cross-repo é pós-release.
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER, 0 HIGH. 2 LOW (1 corrigido in-cycle, 1 aceito-com-nota) + 3 INFO.

## Escopo
13 componentes novos em 6 milestones: **M14** DiffView+PromptVersionDiff+DatasetItemDiff (+`diffLines` puro) · **M15** TokenCostBreakdown+PriceBreakdown · **M16** SeverityBadge · **M17** TagInput+CommentThread · **M18** EvaluatorForm+AnnotationSummaryGroup · **M19** ChatMessageCard+MessageBranchSelector+PromptTemplateEditor (+`extractVars` puro).

## Achados e resolução

### LOW
| ID | Achado | Resolução |
|---|---|---|
| L-1 | `prompt-template-editor` `deriveChips`: `variables` com duplicata gerava chaves React duplicadas (`[...variables, ...]` usava o array cru em vez do Set `declared`). | **CORRIGIDO in-cycle** — usa `[...declared, ...]` (Set dedup); +1 regressão (`variables` duplicadas → 1 chip). |
| L-2 | `evaluator-form` `type=number` controlado round-trip de estados intermediários (`"1."`) via `Number()`. | **Aceito** — idêntico ao precedente do AnnotationInput (M12); consistente, não é regressão. |

### INFO (verificado)
- I-1: `extractVars` detecta `{"k":1}` (JSON literal) como f-string var — inerente a qualquer parser de chave; chips são advisory, sem impacto funcional. Doc honesto.
- I-2: comentário de unified-mode do `diff-view` fala "both line numbers" mas renderiza `rightNo ?? leftNo` — doc drift, não bug.
- I-3: `annotation-summary-group` `finiteMean` coage `Number("")→0`, mas só alcançável no branch continuous (onde string vazia não ocorre); guardado por `Number.isFinite`.

## Verificação de correção (probes adversariais, não só verde)
- **`diffLines`**: LCS correto (`skipA >= skipB` = del-antes-de-add); trailing-newline, empty→empty=[], blank-line, mid-replace — todos honestos.
- **`extractVars`**: mustache+fstring, dedup, none — corretos.
- **`price-breakdown`**: escala 1K/1M = multiplicação; `.toFixed(12)` absorve ruído float (`0.000003×1M→"3"`).
- **`annotation-summary-group`**: `finiteMean` ignora não-finitos; count por opção correto; reusa `AnnotationConfig` do M12 (importado, não redefinido).

## DRY / não-duplicação (verificado)
- `SeverityBadge` ≠ `StatusIndicator`/`StatusDot` (vocabulário + superfície distintos; compõe Badge).
- `ChatMessageCard` ≠ `TraceTranscript` (card de UMA mensagem vs feed); reusa `ToolCall` do trace-core + `CodeBlock`.
- `PromptVersionDiff`/`DatasetItemDiff` reusam `DiffView` (não reimplementam diff).
- Os 2 `to-diff-text.ts` normalizam domínios distintos (não é duplicação Rule 12).

## Gates (re-run pós-fix L-1)
- **Full suite: 1300/1300** (após +1 regressão L-1; era 1299)
- **typecheck 0 · lint 0** (1 warning pré-existente `span-tree`) · **format limpo**
- **registry:validate PASS (97 itens)** — 13 novos + core `diff`
- **build ESM** ok (323 KB)
- **Zero dep nova confirmado** — `git diff package.json` vazio; LCS puro (M14 ADR anti-lib), overlay sobre Textarea (M19 ADR D1 — sem CodeMirror)
- **Wiring triad** por componente: caller (stories), integração (testes+axe), observabilidade (data-slot)
- **A11y**: axe verde nos 13 (rodado); `diff-view` `<table>` semântica; override do biome (chat-message-card `role`) legítimo (prop de domínio, não ARIA — mascara nada)
- **Discriminated union** (`evaluator-form`): Extract após guard sound (TS#30581, padrão M12)

## Handoff decision
**READY_TO_MERGE** para o release da biblioteca (release combinado V3). Adoção no theo-lens (M15 span/trace detail, M16 alerts.tsx; M14/M17/M18/M19 onde houver superfície) + north-star + flips completam pós-merge.
