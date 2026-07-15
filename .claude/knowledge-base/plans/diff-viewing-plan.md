---
slug: diff-viewing
milestone_id: M14
created_at: 2026-07-15
goal: Publicar o primitivo DiffView (LCS puro por linha, split/unified, a11y table) + os composites PromptVersionDiff e DatasetItemDiff no @usetheo/ui, com zero dependência nova de diff.
---

# Plan: Diff viewing (M14)

> **Version 1.0** — Executa o blueprint do M14 (`.claude/knowledge-base/discoveries/blueprints/diff-viewing-blueprint.md`): LCS puro por linha (zero dep — ADR anti-lib do DS), split-view default. langfuse/`diff` e phoenix/`@pierre/diffs` estudados e rejeitados como deps.

## Goal
Fechar o gap de versionamento visual (langfuse/phoenix têm diff de prompt/dataset). Primitivo `DiffView` + 2 composites, zero dep.

## Context
ROADMAP § M14 (V3). Blueprint SHIPPABLE. Diff é a base de prompt/dataset ops.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/lib/diff/{diff-lines.ts,index.ts,*.test.ts}`, `src/components/composites/{diff-view,prompt-version-diff,dataset-item-diff}/*`, `registry/*`. Editados: `src/index.ts`, `CHANGELOG.md`.

| Reuso | Papel |
|---|---|
| `src/lib/cn.ts` | classes |
| `code-block` / `Badge` (composites) | render de config/labels nos composites |

### Current callers / dependents
Zero callers hoje (componentes novos). `trace-compare` (M8) já faz diff estrutural de spans — avaliar reuso do `DiffView` para texto na Fase 5 (não forçar).

### Domain glossary
diff por linha = LCS sobre as linhas → sequência de eq/add/del; split = 2 colunas (old|new); unified = inline +/−; word-level = destaque intra-linha (best-effort interno).

### Architecture boundaries affected
`diffLines` é camada pura (`src/lib/diff/`, sem import de components). `DiffView` é apresentação controlada (texto via props). Composites normalizam domínio→string.

## Prior Art & Related Work
- Blueprint M14 (ADRs D1-D3).
- langfuse `web/src/components/DiffViewer.tsx` (line+word via `diff` v8 BSD, split), `PromptVersionDiffDialog.tsx`, `DatasetItemDiffView.tsx`.
- phoenix `PromptVersionDiffView.tsx` (`@pierre/diffs`, ELv2 study-only).
- ADR anti-chart-lib do M3 (mesma filosofia zero-dep).

## Objective
- [ ] `DiffView` + `PromptVersionDiff` + `DatasetItemDiff` + `diffLines` publicados (stories+axe+testes+registry)
- [ ] Suíte da lib verde; typecheck/lint/format 0; `registry:validate` PASS
- [ ] North-star delta; zero dep nova (`package.json` dependencies inalterado)

## Dependencies
Nenhuma dep NOVA (Rule 9 por LCS puro — ADR D1). Dev: vitest/@testing-library/axe (lockfile). `/deps-audit` plan-bound confirma ausência de dep nova.

## ADRs
### D1 — LCS puro por linha, zero dep
**Decision:** `diffLines` LCS puro; sem `diff`/`@pierre/diffs`.
**Rationale:** ADR do DS (registry copy-pasteable). `diff`=+30kB, `@pierre`=5MB. Caso do DS (<500 linhas) não exige Myers. Alternativa: `diff` (rejeitada — dep p/ ganho marginal). Upgrade path documentado (`granularity:"word"` via dep futura + ADR).
### D2 — Split default, unified opcional
**Decision:** `mode="split"` default, `"unified"` opcional. **Rationale:** split (langfuse) lê melhor; unified (phoenix) é opção. Alternativa: só unified (rejeitada).
### D3 — Composites normalizam→string, reusam DiffView
**Decision:** PromptVersionDiff/DatasetItemDiff normalizam e compõem DiffView. **Rationale:** DRY. Alternativa: diff por-campo (rejeitada — duplica).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| LCS O(n·m) em diff gigante | Low | caso do DS é <500 linhas (prompt/JSON); documentado; upgrade a Myers via dep+ADR se necessário | Claude |
| word-level best-effort não-ótimo | Low | interno, não exposto; só destaque intra-linha; linha inteira sempre correta via LCS | Claude |
| a11y de diff (não só cor) | Medium | `<table>` semântica + marker textual +/− + `data-diff` + caption sr-only; axe por story | Claude |
| composites acoplarem a tipos de domínio externos | Low | tipos locais mínimos (`{template, config}` / `{input,output,metadata}`), não deps | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: diffLines puro (LCS)
F2: DiffView (F1; split+unified, a11y table)
F3: PromptVersionDiff + DatasetItemDiff (F2)
F4: registry + release-prep (F2,F3)
F5: adoção — avaliar reuso no trace-compare; senão entregável é o componente 100% funcional (F4)
```

## Phase 1: diffLines puro
### T1.0 — LCS por linha
#### Objective
`src/lib/diff/diff-lines.ts`: `diffLines(oldText, newText) → DiffRow[]` (`DiffRow { kind:"eq"|"add"|"del"; text: string; leftNo?: number; rightNo?: number }`), LCS puro, total.
#### Why this step (action + reasoning)
É o núcleo; travar o algoritmo com TDD (eq/add/del, vazio, "no changes") elimina retrabalho no render.
#### Evidence
Blueprint (Corner 4 Q1). langfuse `DiffViewer.tsx:110` (calculateDiffLines).
#### Files to edit
`src/lib/diff/{diff-lines.ts,index.ts,diff-lines.test.ts}` (novos), `src/index.ts`.
#### Deep file dependency analysis
Sem import de `src/components/**` nem dep externa (só stdlib).
#### Deep Dives
Textos idênticos → todas eq; old vazio → tudo add; new vazio → tudo del; linha trocada → del+add; trailing newline consistente.
#### Tasks
1. RED: testes LCS (eq/add/del/vazios/idênticos/contagem de linha). 2. GREEN: LCS. 3. REFACTOR+barrel.
#### TDD
- `test_textos_identicos_todas_eq` — todas as rows kind==="eq"
- `test_old_vazio_tudo_add` — `diffLines("", "a\nb")` → 2 add
- `test_new_vazio_tudo_del` — `diffLines("a\nb", "")` → 2 del
- `test_linha_alterada_del_mais_add` — 1 del + 1 add
- `test_insercao_no_meio_preserva_eq` — eq antes/depois do add
- Negativo: `test_ambos_vazios_retorna_vazio` — `diffLines("","")` → []
#### Concurrency tests
(none — single-threaded)
#### Acceptance Criteria
- `pnpm vitest run src/lib/diff` → 0 failed
- `grep -rn "components" src/lib/diff/` → 0 (camada pura)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: DiffView
### T2.0 — DiffView (split/unified, a11y table)
#### Objective
`src/components/composites/diff-view/`: `<table>` de diff sobre `diffLines`; split (old|new) default + `mode="unified"`; cor + marker +/− textual; empty "no changes"; labels.
#### Why this step (action + reasoning)
Consome F1; é o primitivo que os composites reusam.
#### Evidence
Blueprint (Corner 4 Q2; ADR D2). langfuse `DiffViewer.tsx:149-192` (DiffRow split).
#### Files to edit
`src/components/composites/diff-view/{diff-view.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `diffLines` + `cn`; sem outros composites.
#### Deep Dives
"no changes" honesto; linhas add/del com marker +/− (não só cor — a11y); split alinha old/new por row.
#### Tasks
1. RED: testes (rows renderizadas, add/del marcados, unified, empty, a11y). 2. GREEN. 3. REFACTOR. 4. WIRING: stories+axe.
#### TDD
- `test_renderiza_uma_row_por_diffrow`
- `test_linha_add_tem_marker_mais` — `[data-diff="add"]` presente com "+"
- `test_mode_unified_inline` — layout inline (não 2 colunas)
- `test_no_changes_empty_honesto`
- Negativo: `test_role_table_presente` — `getByRole("table")`
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/diff-view` → 0 failed (inclui axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 3: Composites de domínio
### T3.0 — PromptVersionDiff + DatasetItemDiff
#### Objective
`prompt-version-diff/` (normaliza template text/chat + config JSON → 2 DiffView) + `dataset-item-diff/` (input/output/metadata → 3 DiffView em accordion).
#### Why this step (action + reasoning)
Entrega o valor de domínio reusando o primitivo (DRY).
#### Evidence
Blueprint (Corner 4 Q3/Q4; ADR D3). langfuse `PromptVersionDiffDialog.tsx`, `DatasetItemDiffView.tsx`.
#### Files to edit
`src/components/composites/{prompt-version-diff,dataset-item-diff}/*`, `src/index.ts`.
#### Deep file dependency analysis
Importam `DiffView`; PromptVersionDiff tipa `{ template: string | ChatMessage[]; config?: object }` local; DatasetItemDiff `{ input, expectedOutput?, metadata? }` local.
#### Deep Dives
chat template (array de mensagens) → texto legível; config ausente → só o diff de conteúdo; item sem metadata → seção omitida honesta.
#### Tasks
1. RED: testes (2/3 DiffView renderizados, normalização, seções ausentes). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_prompt_version_diff_renderiza_conteudo_e_config` — 2 DiffView
- `test_prompt_chat_template_normalizado_para_texto`
- `test_dataset_item_diff_tres_secoes` — input/output/metadata
- Negativo: `test_metadata_ausente_omite_secao`
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/prompt-version-diff src/components/composites/dataset-item-diff` → 0 failed (axe)
- `python3 .claude/skills/implement/scripts/mini_review.py diff-viewing --phase 3` → PASS OR gates diretos verdes
#### DoD
Barrel + CHANGELOG.

## Phase 4: Registry + release
### T4.0 — Registry + full gates
#### Objective
Itens `diff` (lib) + `diff-view` + `prompt-version-diff` + `dataset-item-diff`; build+validate; full suite/typecheck/lint/format.
#### Why this step (action + reasoning)
DoD exige registry válido por componente.
#### Evidence
Precedente M8/M9/M11/M12.
#### Files to edit
`registry/{diff,diff-view,prompt-version-diff,dataset-item-diff}.json` → `pnpm registry:build`.
#### Deep file dependency analysis
diff-view dep: cn, diff, tailwind-preset; composites dep: cn, diff-view, code-block/badge, tailwind-preset.
#### Tasks
1. RED: `registry:validate` oráculo. 2. GREEN: descriptors+build. 3. Full gates.
#### TDD
- `pnpm registry:build && pnpm registry:validate` → 0
- `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check` → 0
#### Concurrency tests
(none)
#### Acceptance Criteria
- `registry:validate` → 0; full suite verde
#### DoD
Pronto p/ review + release.

## Phase 5: Adoção (avaliar) + north-star
### T5.0 — Reuso no lens (se houver superfície) + north-star
#### Objective
Avaliar reuso do `DiffView` no `trace-compare` do lens (diff de texto de I/O); se não houver superfície de prompt/dataset-diff (backend gated), o entregável é o componente 100% funcional em Ladle + north-star do DS.
#### Why this step (action + reasoning)
Honestidade: prompt/dataset-diff precisam de versionamento no backend (gated); DiffView é adotável onde já há comparação de texto.
#### Evidence
`trace-compare.tsx` (M8) já compara spans; DoD do M14.
#### Files to edit
(cross-repo, se aplicável) `dashboard/` onde houver diff de texto; senão só north-star audit no DS.
#### Deep file dependency analysis
DiffView adotável onde dois textos são comparados; PromptVersionDiff/DatasetItemDiff aguardam backend de versionamento.
#### Deep Dives
Sem superfície real → não forçar adoção decorativa (regra do owner); registrar honestamente.
#### Tasks
1. Avaliar trace-compare. 2. Adotar SE houver ganho real. 3. North-star audit.
#### TDD
- Se adotar: `cd dashboard && pnpm vitest run <alvo>` → 0 failed
- Sempre: north-star audit com números literais
#### Concurrency tests
(none)
#### Acceptance Criteria
- Componente 100% funcional (Ladle+axe); adoção registrada (real ou honestamente diferida)
#### DoD
North-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| diffLines puro | T1.0 |
| DiffView publicado | T2.0 |
| PromptVersionDiff + DatasetItemDiff publicados | T3.0 |
| Registry válido | T4.0 |
| Adoção avaliada + north-star | T5.0 |
| Zero dep nova | T1.0, T4.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T5.0).**

## Global Definition of Done
- [ ] `pnpm test:run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] CHANGELOG `[Unreleased]` com entradas
- [ ] `/code-quality` ∈ {PASS, PASS_WITH_CAVEATS} e `/review` READY_TO_MERGE antes do release

## Failure scenarios (when I/O external)
(none — no external I/O: DiffView recebe texto via props; composites normalizam dados já em memória)

## Critical paths (para mutation testing, se rodar)
`src/lib/diff/diff-lines.ts` — o LCS (eq/add/del, edges de vazio) é onde mutantes sobrevivem.

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: stories dos 3 componentes com tema (visual + axe).
2. `pnpm build` + `pnpm registry:build` limpos.
3. Wiring triad: caller (stories/adoção), integração (testes), observabilidade (`data-diff`).
