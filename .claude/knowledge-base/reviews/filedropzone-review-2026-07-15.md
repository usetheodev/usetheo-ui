# Review: filedropzone (M5)

**Date:** 2026-07-15
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (`.claude/agents/review-filedropzone-2026-07-15/`)
**Findings:** 32 total (BLOCKER: 0, HIGH: 2, MEDIUM: 6, LOW: 9, INFO: 15)
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER; os 2 HIGH e os 6 MEDIUM foram FIXADOS in-cycle (commit `fix(review)`) com regressão RED-GREEN; LOWs fixados em lote ou aceitos com nota.

> Consolidação manual (precedente M0); agentes persistiram YAMLs em `findings/`.

## HIGH — ambos FIXADOS

### F-dom-1 — quirk type-vazio no dragenter virava drag-reject falso em browser real
- **File:** `file-dropzone.tsx` (onDragEnter)
- Em drag REAL no Chrome, item com `type: ""` (ex.: .md) + `getAsFile() === null` (protected mode) caía no fallback de extensão contra nome vazio → `drag-reject` falso — contradizendo a própria story. Mascarado nos testes porque a fixture retornava File com nome.
- **Fix:** item com `type === ""` é sempre aceitável no dragenter (fidelidade à referência `utils/index.ts:73-75`); validação real no drop. Regressão `test_dragenter_with_empty_item_type_stays_drag_over` com fixture `emptyTypes` + `getAsFile: () => null` (RED antes do fix).

### F-xval-1 (≡ F-arch-1) — desvio do ADR D1 (split validate.ts) sem registro canônico
- O split foi forçado pelo hook `MAX_FILE_LINES=300` (o plano orçou contra o budget errado de 500) e estava documentado só em mensagem de commit.
- **Fix:** `knowledge-base/adrs/0001-m5-filedropzone-structure.md` formaliza o split (+ emenda do D2 para 2 states + a governança da supressão a11y). Followup #10 do kit: Baseline Context do /to-plan deve citar o piso de 300 do hook.

## MEDIUM — todos FIXADOS

| ID | Resumo | Fix |
|---|---|---|
| F-dom-2 | Regra coletiva PRÉ-hoc divergia da referência (pós-hoc sobre ACEITOS, preservando erros per-file) | `validateFiles` reescrita pós-hoc; regressão `test_validatefiles_collective_rule_posthoc_preserves_perfile_errors` (RED) |
| F-arch-2 (≡F-xval-2) | Override file-wide no biome.json divergia da convenção inline (topnav) | Override removido; `// biome-ignore` inline no atributo `role` |
| F-tests-1 | Caminho do picker sem pin de validação (mutante bypass passava) | `test_change_with_invalid_file_rejects_with_typed_code` |
| F-tests-2 | Metade `!multiple` da regra coletiva sem teste | `test_validatefiles_multiple_false_rejects_all` |
| F-tests-3 | Claim "double-fire COM teste" era meia-verdade | `test_double_dragenter_same_target_balanced_by_double_dragleave` |
| (F-xval-2 escopo biome.json) | Scope creep documentado | Coberto pelo ADR 0001-m5 |

## LOW

| ID | Resumo | Ação |
|---|---|---|
| F-arch-3 | Comentário prettier-ignore morto | FIXADO (removido) |
| F-arch-4/F-dom-5 | key por file.name duplica | FIXADO (key composta posicional) |
| F-tests-4 | Fixture sem emptyTypes | FIXADO (opção adicionada) |
| F-tests-5 | Disabled sem teste de drag/drop | FIXADO (`test_disabled_ignores_drag_and_drop`) |
| F-tests-6 | Callback oposto não assertado | FIXADO (spies duplos nos paths accepted/change) |
| F-tests-7 | Boundary minSize | FIXADO (`test_validatefiles_size_equal_to_min_accepts`) |
| F-tests-8 | Ordering do value-reset não verificado | FIXADO (captura no mock) |
| F-dom-4 | aria-label duplicada root+input | FIXADO (`aria-hidden` no input; tabIndex -1) |
| F-dom-3 | Push condicional vs incondicional da referência | ACEITO com nota (leave/drop são guard-free; comentado) |
| F-xval-3 | D2 dois useStates | COBERTO pelo ADR 0001-m5 |
| F-xval-4 | Drift progress files T1.2/T1.3 | FIXADO (checkpoint corrigido) |
| F-tests-9 | Nomes com "e" (herdados do plano) | ADVISORY p/ planos futuros |

## INFO (destaques)

- Wiring 9/9 símbolos pilar (a); registry/r NÃO stale (verificado por diff reproduzindo o transform); zero deps npm confirmado por grep; barrel paridade exata.
- Cross-validation: 6/6 tasks com traceabilidade exata de commit; contagens 14/32/33/34 batem o plano EXATAMENTE; plano congelado durante implement (git log).
- F-dom-7: input FORA do role=button é divergência estrutural SUPERIOR à referência (evita nested-interactive).
- F-dom-10: aria-live na região de rejeições segue como followup declarado do ADR D3 (candidato: `live-region-context.tsx` local).

## Quality gates summary (re-run pós-fixes)

- `pnpm test:run`: **874 passed / 0 failed** (41 no módulo)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 supressões file-wide)
- `pnpm registry:build && registry:validate`: PASS (68 itens; regenerado pós-fix — build-por-último)
- `/code-quality`: PASS_WITH_CAVEATS (89, caveat ambiental)

## Handoff decision

**READY_TO_MERGE** → `/release` (0.21.0 — minor).
