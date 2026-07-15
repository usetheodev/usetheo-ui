# Blueprint: Diff viewing (M14)

> Contrato de `DiffView` (primitivo) + `PromptVersionDiff` + `DatasetItemDiff` validado contra 2 fontes: langfuse `DiffViewer.tsx` (usa `diff` v8 BSD para line+word, split-view) + phoenix `PromptVersionDiffView.tsx` (usa `@pierre/diffs` Apache, unified, ELv2 study-only). **Decisão: LCS puro por linha (zero dep)** — ADR anti-lib-pesada do DS mantido (registry copy-pasteable); `diff`/`@pierre` rejeitados (30kB / 5MB).

**Slug:** `diff-viewing` · **Date:** 2026-07-15

## Coverage Corner 1 — Integration Tests
`DiffView` puro/controlado (oldText/newText via props). Testes: linhas iguais/adicionadas/removidas, vazio↔conteúdo, "no changes", split markup, axe. Composites: fixtures de prompt/dataset-item.

## Coverage Corner 2 — Dependencies
**Tipos:** `DiffView` props `{ oldText: string; newText: string; mode?: "split"|"unified"; oldLabel?; newLabel? }`. `PromptVersionDiff` `{ oldPrompt, newPrompt }` (normaliza template+config→string). `DatasetItemDiff` `{ oldItem, newItem }` (input/output/metadata em accordion). **Zero dep nova** — LCS puro em `src/lib/diff/diff-lines.ts`.

## Coverage Corner 3 — Tools
**A11y:** o diff renderiza como `<table>` (linhas = rows, add/remove/unchanged via `data-diff` + cor) com caption sr-only, OU `role="group"` + linhas rotuladas; markers +/- textuais (não só cor). axe por story.
**North-star:** +1 primitivo (`DiffView`) + 2 composites + helper puro `diffLines`.

## Coverage Corner 4 — Techniques
- **diffLines (Q1):** LCS puro (`src/lib/diff/diff-lines.ts`) → `DiffRow[]` (`{ kind: "eq"|"add"|"del", left?, right?, ... }`). O(n·m), suficiente p/ prompts/JSON (<500 linhas). Langfuse usa Myers via `diff`; nós LCS puro (o caso 80% é add/remove de linha inteira). Não-finitos N/A (texto).
- **DiffView (Q2):** split-view (2 colunas, padrão langfuse provado) sobre `diffLines`; cor verde/vermelho/neutro + marker +/−; `mode="unified"` opcional (inline +/−). Word-level best-effort dentro de linha alterada (split de palavras + longest-match) — interno, não exposto.
- **PromptVersionDiff (Q3):** normaliza prompt (text vs chat → string) + config (JSON) → 2 `DiffView` (conteúdo + config). Inspirado em `createSmartDiff` (langfuse) / `promptTemplateToText` (phoenix).
- **DatasetItemDiff (Q4):** input/output/metadata stringificados → 3 `DiffView` em accordion (padrão langfuse `DatasetItemDiffView`).

## ADRs
### D1 — LCS puro por linha, zero dep (ADR anti-lib mantido)
**Decision:** `diffLines` LCS puro em `src/lib/diff/`; sem `diff`/`@pierre/diffs`.
**Rationale:** ADR do DS (registry copy-pasteable, sem lib pesada); `diff` = +30kB, `@pierre` = 5MB (shiki). O caso do DS (prompts/JSON <500 linhas) não exige Myers ótimo. Alternativa: `diff` (rejeitada — dep p/ ganho marginal de word-level). Upgrade path: `granularity:"word"` via dep futura com ADR se feedback exigir.

### D2 — Split-view default, unified opcional
**Decision:** default split (2 colunas); `mode="unified"` inline.
**Rationale:** langfuse (split) provado; unified é o phoenix. Alternativa: só unified (rejeitada — split lê melhor lado-a-lado).

### D3 — Composites normalizam para string e compõem DiffView
**Decision:** PromptVersionDiff/DatasetItemDiff normalizam seus domínios para string e reusam DiffView (não reimplementam diff).
**Rationale:** DRY; a normalização (text/chat, JSON) é a lógica própria. Alternativa: diff por-campo custom (rejeitada — duplica).

## Recommendations
`/to-plan diff-viewing`: F1 `diffLines` puro (TDD) · F2 `DiffView` (split+unified, a11y table) · F3 `PromptVersionDiff` + `DatasetItemDiff` · F4 registry+release · F5 adoção (avaliar reuso no `trace-compare`).

## Blocked questions
(none)

## Related
- langfuse `web/src/components/DiffViewer.tsx` (line+word, `diff` v8), `PromptVersionDiffDialog.tsx`, `DatasetItemDiffView.tsx`
- phoenix `app/src/pages/prompt/PromptVersionDiffView.tsx` (`@pierre/diffs`, ELv2 study-only)
- ADR anti-chart-lib do M3 (mesma filosofia: primitivo puro, zero dep pesada)
