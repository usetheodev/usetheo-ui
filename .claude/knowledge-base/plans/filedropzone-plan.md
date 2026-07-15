---
slug: filedropzone
milestone_id: M5
created_at: 2026-07-15
goal: Ship o primitive FileDropzone dependency-free (drag-drop + picker, validação com erros tipados, a11y de teclado) com helpers puros testados, stories e registry.
---

# Plan: FileDropzone — upload drag-drop dependency-free (M5)

> **Version 1.1** (absorve EC-1/EC-2/EC-3 do edge-case review — 29→32 REDs; EC-4/5 documentados) — Implementa o `FileDropzone` primitive seguindo o blueprint do M5 (ADR D1: own com ~255-330 LoC, portando da referência react-dropzone os 3 pontos onde implementação ingênua erra — target counting de dragleave aninhado, type vazio durante o drag, tudo-ou-nada de maxFiles) + a11y ACIMA da referência (ADR D3 do blueprint: role=button + label obrigatória + rejeições em texto). Helpers puros `matchesAccept`/`validateFiles` exportados. Zero dependências novas.

## Goal

Enable os consumidores do `@usetheo/ui` a receber arquivos por drag-drop/picker com validação tipada acessível via `FileDropzone`, measured by `pnpm vitest run src/components/primitives/file-dropzone/` verde (≥ 32 testes, axe zero violations em idle/rejected/disabled) e `pnpm registry:validate` com a entry `file-dropzone` (68 itens).

## Context

ROADMAP § M5 (deps M0 ✅). Blueprint (`filedropzone`, 89): dep-vs-own decidido com números (ADR D1 — ~255-330 LoC vs 1079 + 2 deps; DoD exige dependency-free); fronteira seleção-vs-upload (ADR D2 — `onFilesAccepted`/`onFilesRejected`; rede é do consumidor, story compõe com `Progress`); a11y própria (ADR D3 — referência tem ZERO aria, evidência negativa). Fixtures de teste DnD portadas do spec da referência (`createDtWithFiles`). Caso real: ingest do theo-rag (accept de `mime-from-name.ts`).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/primitives/file-dropzone/file-dropzone.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/file-dropzone/file-dropzone.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/file-dropzone/file-dropzone.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/file-dropzone/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 179 | `749aa452` | Barrel (61 componentes pós-M4) | Aditivo only |
| `registry/file-dropzone.json` (NEW) / `registry/index.json` | 418 | `8b08bf6c` | Índice (67 itens) | Aditivo; ordem alfabética |
| `CHANGELOG.md` | 115 | `068eb11b` | `[Unreleased]` vazio pós-0.20.0 | Released intocadas |

Fontes de design (leitura, fora do repo — blueprint § Corners): react-dropzone clonado (mecânica/validação/testes, citações spot-checked) + theo-rag `mime-from-name.ts` (accept real).

### Current callers / dependents

- **Symbol:** `FileDropzone` / `matchesAccept` / `validateFiles` (NEW) — zero callers; pós-plano: barrel + stories + registry.
- **Symbol:** `cn` — consumido (read-only). `Progress` (usado APENAS na story de composição — DoD b2).

### Domain glossary

- **target counting** — array de `EventTarget`s: push no dragenter, remoção única no dragleave, desativa só com array vazio — resolve dragleave de filhos aninhados e double-fire do Firefox (blueprint Q1).
- **tudo-ou-nada de maxFiles** — estourou maxFiles/multiple → TODOS os arquivos viram rejeição `too-many-files` (regra coletiva pós-hoc da referência).
- **rejeição tipada** — `{file, errors: [{code, message}]}` com `code` de 4 literais kebab-case + extensão via `validator` custom (error-handling.md § 2).
- **fronteira upload** — o primitive seleciona e valida; transporte/progresso são do consumidor (story compõe `Progress`).

### Architecture boundaries affected

Nenhuma camada nova. O componente usa `useRef`/`useState` (contagem de targets e estado de drag são INTERNOS ao primitive — interativo por natureza, como Combobox M1); permanece sem "use client" (padrão da lib: consumidor adiciona em RSC). +3 exports.

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/filedropzone-blueprint.md` — mecânica (Corner 4 Q1), shape de erros (Q2), a11y (Q3), fixtures (Corner 1), números do ADR D1 (Corner 2).
- **Reference projects:** `.claude/knowledge-base/references/react-dropzone/src/index.tsx:239,337,418-429` (target counting — portado); `.claude/knowledge-base/references/react-dropzone/src/utils/index.ts:30-35,86-108` (ErrorCode/validadores — portados); `.claude/knowledge-base/references/react-dropzone/src/index.spec.tsx:3553-3567` (fixture createDtWithFiles — portada).
- **Fontes de design (consumer):** theo-rag `mime-from-name.ts` (path absoluto; ADR D3 da família).
- **Patterns skills:** (nenhuma — verificado: `skills/*-patterns/` vazio).

## Objective

- [ ] Helpers puros `matchesAccept(file, accept)` e `validateFiles(files, opts)` exportados com os 4 códigos de erro tipados e mensagens contextuais.
- [ ] `FileDropzone` com drag-drop (target counting), file picker (input visually-hidden, value-reset, mesma via do drop), teclado (Space/Enter no root), estados `data-state="idle|drag-over|drag-reject|disabled"`, região de rejeições em texto.
- [ ] ≥ 32 testes (helpers isolados + componente com fixtures DnD portadas; negatives assertam `code` específico) + axe idle/rejected/disabled.
- [ ] 4 stories (IngestUpload com accept real + composição Progress — DoD b2; Rejected; MultiFile; Disabled) + smoke.
- [ ] Barrel + `registry/file-dropzone.json`; validate 68 itens; CHANGELOG.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| (nenhuma além de react/cn) | — | — | HTML5 DnD nativo (blueprint ADR D1; DoD dependency-free) |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| (none) | — | — | react-dropzone/attr-accept/file-selector avaliados e rejeitados com números no blueprint ADR D1 (~255-330 LoC own vs 1079 + 2 deps; 70% da superfície não usada) | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — Helpers puros separados do componente no mesmo módulo

**Decision:** `matchesAccept`/`validateFiles` + tipos de erro vivem em `file-dropzone.tsx` como funções puras exportadas (padrão `linScale` M3 / `deriveSteps` M4), testadas sem DOM.

**Rationale:** o coração do componente é validação — pura, determinística, testável em ms (testing.md § 2 pirâmide); um arquivo mantém a convenção da lib e o registry copy-pasteable (1 file por item).

**Alternatives considered:** `validate.ts` separado (rejeitado — quebra o padrão 1-arquivo do registry sem ganho: total estimado ~350 LoC ≤ 500); classe Validator (rejeitada — KISS, funções bastam).

### D2 — Estado interno mínimo (refs + 1 state), sem "use client"

**Decision:** `useRef` para o array de targets e o input; um `useState` para `data-state`; nenhuma outra state. Sem diretiva "use client" (consumidor RSC adiciona, padrão da lib — followup #8 do kit cobre o strip do tsup).

**Rationale:** drag é interação intrinsecamente stateful — o estado é do PRIMITIVE (como Combobox M1), não do consumidor; arquivos aceitos/rejeitados SAEM por callback (controlado onde importa).

**Alternatives considered:** componente 100% controlado com onDragStateChange (rejeitado — força todo consumidor a reimplementar target counting, exatamente o bug que a referência existe para resolver); reducer como a referência (rejeitado — nossa superfície tem 1 estado visual, useState basta — KISS).

### D3 — A11y acima da referência (herda blueprint ADR D3)

**Decision:** `role="button"` + prop `label` obrigatória (aria-label) + `aria-disabled` quando disabled + região `data-slot="file-dropzone-rejections"` com erros em TEXTO.

**Rationale:** evidência negativa do blueprint (zero aria na referência); lição da família (estado em texto, não só cor); região de erro satisfaz error-handling.md § 2 na UI.

**Alternatives considered:** role=presentation como a referência (rejeitado — dropzone é interativa); aria-live na região de rejeições (rejeitado no M5 — assertivo demais sem caso real de SR testado; anotado como followup de verificação manual).

### D4 — Wiring triad herdado (precedente M0-M4)

**Decision:** (a) caller = barrel+stories+registry inline; (b) integration = testes de composição co-localizados; (c) métrica = data-slot assertado no DOM.

**Rationale:** mesma adaptação aprovada em 5 reviews consecutivos (READY_TO_MERGE M0-M4).

**Alternatives considered:** tests/integration/ dedicado (rejeitado — não existe na lib; followup #5); dispensar pilar (rejeitado — viola cycle-implement).

**Consequences:** check_wiring pillar b segue FAIL de ferramenta, coberto por este ADR.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Edge cases de DnD cross-browser (Safari/Firefox) não cobertos por jsdom (risco #2 do ROADMAP) | Medium | Quirks conhecidos portados COM teste (double-fire Firefox via target counting; type vazio Chrome); matriz de verificação manual documentada na story IngestUpload | Paulo |
| jsdom não implementa DataTransfer real — fixtures plain-object podem divergir do browser | Medium | Fixture portada da referência (battle-tested em produção massiva); mesma técnica dos 112 testes deles | Claude |
| `aria-live` ausente na região de rejeições pode atrasar anúncio a SR | Low | ADR D3: followup de verificação manual com SR real antes de adicionar | Claude |
| Directory drop silenciosamente ignorado (items kind=file com getAsFile null em dirs) | Low | Filtrar `getAsFile() === null`; fronteira documentada no JSDoc | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
Phase 1 (T1.1 helpers → T1.2 componente → T1.3 stories) → Phase 2 (T2.1 barrel → T2.2 registry; T2.3 changelog ∥) → Final Validation
```

## Phase 1: Primitive (TDD)

**Objective:** helpers + componente com 32 comportamentos pinados.

### T1.1 — Helpers puros de validação

#### Objective
`matchesAccept` + `validateFiles` + tipos (`FileDropzoneErrorCode`, `FileDropzoneError`, `FileRejection`) exportados.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** escreve os 14 REDs dos helpers, implementa as funções puras, refactor.
2. **Why now:** é o coração do componente e roda sem DOM — base da pirâmide (testing.md § 2); o shape vem do blueprint do M5 (`.claude/knowledge-base/discoveries/blueprints/filedropzone-blueprint.md` — Corner 4 Q2) com as mensagens contextuais pinadas. Cita D1.

#### Evidence
Blueprint Q2: `.claude/knowledge-base/references/react-dropzone/src/utils/index.ts:30-35` (enum), `:86-108` (tuplas), `index.tsx:450-474` (coletiva pós-hoc); mensagens pinadas em `.claude/knowledge-base/references/react-dropzone/src/utils/index.spec.ts:28-31,288-297`.

#### Files to edit
```
src/components/primitives/file-dropzone/file-dropzone.test.tsx — (NEW) RED primeiro
src/components/primitives/file-dropzone/file-dropzone.tsx — (NEW) só os helpers/tipos nesta task
src/components/primitives/file-dropzone/index.ts — (NEW)
```

#### Deep file dependency analysis
- Helpers importam nada (puros). Downstream: componente (T1.2), barrel, stories.

#### Deep Dives
- `matchesAccept(file, accept?)`: accept ausente/vazio → aceita tudo; match por MIME exato, wildcard `type/*`, extensão case-insensitive por sufixo do nome; type vazio (quirk Chrome durante drag) → aceita (valida de verdade no drop).
- `validateFiles(files, {accept, maxSize, minSize, maxFiles, multiple, validator})` → `{accepted: File[], rejections: FileRejection[]}`; por arquivo: tipo→tamanho→validator acumulando erros; coletiva: `!multiple && n>1` OU `maxFiles>=1 && n>maxFiles` → TODOS rejeitados com `too-many-files`.
- Mensagens com contexto numérico: `File is larger than {maxSize} bytes` etc.

#### Pseudo-code / Signatures
```pseudocode
type FileDropzoneErrorCode = "file-invalid-type" | "file-too-large" | "file-too-small" | "too-many-files"
interface FileDropzoneError { code: FileDropzoneErrorCode | string; message: string }
interface FileRejection { file: File; errors: FileDropzoneError[] }
export function matchesAccept(file: File, accept?: Record<string, string[]>): boolean
export function validateFiles(files: File[], opts): { accepted: File[]; rejections: FileRejection[] }
```

#### Tasks
1. RED (14); 2. GREEN; 3. REFACTOR.

#### TDD
```
RED: test_matchesaccept_empty_accept_accepts_all() — sem accept → true para qualquer file
RED: test_matchesaccept_exact_mime() — application/pdf casa com {"application/pdf":[".pdf"]}
RED: test_matchesaccept_wildcard_mime() — image/png casa com {"image/*":[]}
RED: test_matchesaccept_extension_case_insensitive() — REPORT.PDF casa por .pdf
RED: test_matchesaccept_empty_type_accepted_during_drag() — type "" → true (quirk Chrome)
RED: test_matchesaccept_rejects_wrong_type() — text/plain NÃO casa com accept de pdf (negative)
RED: test_validatefiles_accepts_valid_file() — arquivo válido → accepted, zero rejections
RED: test_validatefiles_too_large_typed_error() — size > maxSize → code "file-too-large" e message contém o limite em bytes (negative)
RED: test_validatefiles_too_small_typed_error() — size < minSize → code "file-too-small" (negative)
RED: test_validatefiles_invalid_type_typed_error() — code "file-invalid-type" e message lista os aceitos (negative)
RED: test_validatefiles_maxfiles_rejects_all() — 3 files com maxFiles 2 → TODOS rejeitados com "too-many-files" (tudo-ou-nada; edge coletivo)
RED: test_validatefiles_maxfiles_exact_boundary_accepts() — EC-1 edge: 2 files com maxFiles 2 → todos accepted
RED: test_validatefiles_size_equal_to_max_accepts() — EC-2 edge: size === maxSize → accepted (> estrito)
RED: test_validatefiles_custom_validator_accumulates() — validator custom soma erro com code próprio ao de tamanho (negative)
GREEN: implementar helpers
REFACTOR: constantes de mensagem centralizadas
VERIFY: pnpm vitest run src/components/primitives/file-dropzone/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/file-dropzone/` reporta 14 passed / 0 failed
- [ ] `pnpm lint` exit 0

#### DoD (Definition of Done)
- [ ] `pnpm vitest run src/components/primitives/file-dropzone/` exit 0; `pnpm typecheck` exit 0

### T1.2 — Componente FileDropzone

#### Objective
Drag-drop + picker + teclado + estados + região de rejeições, sobre os helpers do T1.1.

#### Why this step (action + reasoning)
1. **What:** escreve 18 REDs do componente (fixture `createDtWithFiles` portada), implementa com target counting, refactor tokens.
2. **Why now:** helpers prontos permitem que o componente seja só orquestração de eventos + render; os REDs portam os comportamentos que a produção da referência pina (blueprint do M5 — Corner 1). Cita D2/D3/D4.

#### Evidence
Blueprint Q1 (`.claude/knowledge-base/references/react-dropzone/src/index.tsx:239,337,418-429,390-407,566-571,686-699`), Q3 (`:575-588,655-657,701` + evidência negativa aria), Corner 1 (fixture `index.spec.tsx:3553-3567`).

#### Files to edit
```
src/components/primitives/file-dropzone/file-dropzone.test.tsx — +17 REDs
src/components/primitives/file-dropzone/file-dropzone.tsx — componente
src/components/primitives/file-dropzone/index.ts — exports
```

#### Deep file dependency analysis
- Componente importa `cn` + helpers do próprio módulo. Sem lucide (instruções em texto/children). Downstream: barrel/registry/stories.

#### Deep Dives
- Anatomia: `<div role="button" tabIndex={0} aria-label={label} data-slot="file-dropzone" data-state>` → instruções (`children` ou default) + `<input type=file>` visually-hidden (clip/1px, NUNCA display:none, tabIndex=-1) + região `data-slot="file-dropzone-rejections"` (lista `label do arquivo — message` por rejeição, `text-destructive`).
- Target counting: ref array; dragenter push + valida items p/ `drag-over` vs `drag-reject`; dragleave remove uma vez e desativa só vazio; drop zera, `preventDefault`, extrai `Array.from(dataTransfer.files)`, valida, callbacks.
- Picker: click no root → `input.value=""` + `input.click()`; `stopPropagation` no click do input; `onChange` converge na MESMA função de processamento do drop.
- Teclado: Space/Enter apenas quando `event.target === root` → preventDefault + picker. Disabled: sem tabIndex, `aria-disabled`, handlers inertes.
- dragover: `preventDefault()` + `dropEffect="copy"` (try/catch).

#### Tasks
1. RED (18); 2. GREEN; 3. REFACTOR tokens.

#### TDD
```
RED: test_renders_label_and_default_instructions() — aria-label = prop; instruções visíveis
RED: test_root_is_keyboard_focusable_button() — role button + tabIndex 0
RED: test_enter_and_space_open_picker() — keyDown Enter e " " no root → input.click() (spy)
RED: test_other_keys_do_not_open_picker() — "a"/Tab não clicam (negative)
RED: test_keydown_on_descendant_does_not_open_picker() — evento de filho ignorado (negative)
RED: test_disabled_removes_tab_stop_and_blocks_picker() — sem tabIndex 0, aria-disabled true, click não abre (negative)
RED: test_input_is_visually_hidden_not_display_none() — input tabIndex -1, style sem display:none
RED: test_click_opens_picker_with_value_reset() — click no root → value="" antes de click()
RED: test_change_event_flows_like_drop() — fireEvent.change com files → onFilesAccepted
RED: test_drop_accepted_calls_on_files_accepted() — drop válido → callback com File[]
RED: test_drop_rejected_calls_on_files_rejected_with_typed_code() — drop pdf em accept png → rejections[0].errors[0].code === "file-invalid-type" E região de rejeições mostra a message (negative)
RED: test_dragenter_sets_drag_over_state() — data-state "drag-over"
RED: test_dragenter_with_invalid_type_sets_drag_reject() — valida DURANTE o drag → "drag-reject"
RED: test_nested_dragleave_keeps_active() — 2 dragenters (root+filho) + 1 dragleave → continua drag-over (o bug clássico; edge)
RED: test_non_file_drag_is_ignored() — DataTransfer types ["text/plain"] → estado idle, sem callbacks (negative)
RED: test_empty_file_list_triggers_no_callbacks() — EC-3 negative: change/drop com zero files → nenhum callback
RED: test_all_parts_have_data_slot_and_forwards_ref() — file-dropzone/-input/-instructions(-rejections quando houver); ref no root
RED: test_axe_no_violations() — axe(idle + rejected com região + disabled) zero violations
GREEN: implementar componente
REFACTOR: tokens (text-body-sm/text-label; border-dashed; data-state variants)
VERIFY: pnpm vitest run src/components/primitives/file-dropzone/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/file-dropzone/` reporta 32 passed / 0 failed
- [ ] `wc -l` ≤ 500 em `file-dropzone.tsx`; `pnpm lint` exit 0
- [ ] `grep -c '"use client"' src/components/primitives/file-dropzone/file-dropzone.tsx` == 0
- [ ] `grep -c "from \"lucide-react\"\|from 'lucide-react'" src/components/primitives/file-dropzone/file-dropzone.tsx` == 0 (zero deps de ícone — instruções em texto)

#### DoD
- [ ] `pnpm vitest run src/components/primitives/file-dropzone/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T1.3 — Stories

#### Objective
4 stories (IngestUpload com accept real do theo-rag + composição `Progress`; Rejected; MultiFile; Disabled) + smoke.

#### Why this step (action + reasoning)
1. **What:** stories CSF + smoke; IngestUpload inclui a matriz manual Safari/Firefox como doc (risco #2).
2. **Why now:** pilar (a) do D4; IngestUpload é a evidência do DoD b2 (composição com Progress). Cita blueprint Corner 3.

#### Evidence
Blueprint do M5 — Corner 3 (`.claude/knowledge-base/discoveries/blueprints/filedropzone-blueprint.md`); `src/components/primitives/progress/progress.tsx:33-43` (API value/max/intent); accept real: theo-rag `mime-from-name.ts` (path absoluto no blueprint).

#### Files to edit
```
src/components/primitives/file-dropzone/file-dropzone.stories.tsx — (NEW)
src/components/primitives/file-dropzone/file-dropzone.test.tsx — +1 smoke
```

#### Deep file dependency analysis
- Stories importam o componente + `Progress` (só aqui); estado local de demo determinístico (sem rede real).

#### Deep Dives
- Axe sweep do Ladle cobre as 4 stories automaticamente.

#### Tasks
1. 4 stories; 2. smoke.

#### TDD
```
RED: test_ingest_upload_story_renders_dropzone_with_progress() — story IngestUpload renderiza [data-slot=file-dropzone] e o Progress composto
VERIFY: pnpm vitest run src/components/primitives/file-dropzone/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 4 stories
- [ ] `pnpm vitest run src/test/ladle-axe.test.tsx` exit 0

#### DoD
- [ ] `pnpm vitest run src/components/primitives/file-dropzone/` reporta 33 passed / 0 failed

## Phase 2: Export, registry e docs

**Objective:** superfície pública + registry + CHANGELOG.

### T2.1 — Barrel

#### Objective
Exports (`FileDropzone`, helpers, tipos) + smoke identidade.

#### Why this step (action + reasoning)
1. **What:** RED smoke via barrel → export aditivo. 2. **Why now:** padrão M0-M4; pré-req do registry.

#### Evidence
`src/index.ts` (179 LoC, `749aa452` — Baseline); bloco Stepper (M4) como modelo.

#### Files to edit
```
src/index.ts — aditivo
src/components/primitives/file-dropzone/file-dropzone.test.tsx — +1 smoke barrel
```

#### Deep file dependency analysis
- Barrel aditivo only (invariant).

#### Deep Dives
(nenhum)

#### Tasks
1. RED; 2. GREEN.

#### TDD
```
RED: test_barrel_exports_file_dropzone() — identidade via "../../../index.js" (FileDropzone, matchesAccept, validateFiles)
VERIFY: pnpm test:run && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `git diff src/index.ts` só adições

#### DoD
- [ ] `pnpm test:run` exit 0

### T2.2 — Registry

#### Objective
`registry/file-dropzone.json` + entry; validate 68 itens.

#### Why this step (action + reasoning)
1. **What:** entry no index (RED validate) → descriptor → build+validate; **build é o ÚLTIMO passo antes do commit final** (disciplina M1-M4). 2. **Why now:** DoD padrão.

#### Evidence
Blueprint do M5 — Corner 3; `registry/stepper.json` (M4) como modelo; introspecção real (esperado: sem `dependencies` npm — sem lucide).

#### Files to edit
```
registry/file-dropzone.json — (NEW)
registry/index.json — +1 entry
```

#### Deep file dependency analysis
- Aditivo; consumido por build/validate.

#### Deep Dives
(nenhum)

#### Tasks
1. Entry (RED); 2. descriptor; 3. build+validate.

#### TDD
```
RED: test_registry_validate_fails_without_descriptor() — entry sem descriptor → `pnpm registry:validate` exit != 0
GREEN: `pnpm registry:build && pnpm registry:validate` exit 0 (68 itens)
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm registry:validate` exit 0 reportando 68 itens

#### DoD
- [ ] `git diff --stat registry/` só adições + regenerações do build

### T2.3 — CHANGELOG

#### Objective
Entry `[Unreleased] § Added`.

#### Why this step (action + reasoning)
1. **What:** entry consumer-facing (Rule 6). 2. **Why now:** ∥ T2.2.

#### Evidence
CHANGELOG (115 LoC, Unreleased vazio pós-0.20.0 — Baseline).

#### Files to edit
```
CHANGELOG.md — § Added
```

#### Deep file dependency analysis
- Aditivo em Unreleased.

#### Deep Dives
(nenhum)

#### Tasks
1. Entry.

#### TDD
```
RED: test_changelog_mentions_file_dropzone() — `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém FileDropzone (gate documental)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém FileDropzone sob § Added

#### DoD
- [ ] `pnpm test:run` exit 0

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | Drag-drop + file picker com validação tipo/tamanho/quantidade e erros tipados (M5 DoD b1) | T1.1, T1.2 | Helpers puros (14 testes) + componente (18 testes); códigos kebab-case tipados |
| 2 | Estados idle/drag-over/rejected + teclado acessível (M5 DoD b1) | T1.2 | data-state + target counting + Space/Enter; axe 3 estados |
| 3 | Dependency-free HTML5 nativo (M5 DoD b1; blueprint ADR D1) | T1.1-T2.2 | Zero imports externos (AC pina zero lucide); package.json intocado |
| 4 | Composição com Progress para upload em andamento (M5 DoD b2) | T1.3 | Story IngestUpload (accept real theo-rag + Progress) |
| 5 | DoD padrão da lib (testes+axe, stories, registry) (M5 DoD b3) | T1.1-T2.2 | 34 testes, 4 stories, registry 68 |
| 6 | Matriz manual cross-browser (risco #2) | T1.3 | Documentada na story IngestUpload |
| 7 | CHANGELOG (Rule 6) | T2.3 | Entry § Added |

**Coverage: 7/7 gaps covered (100%)**

## Global Definition of Done

- [ ] `pnpm test:run` exit 0 (+34 novos + 4 sweep; regressão 829 intacta)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] File-size ≤ 500 LoC por arquivo-fonte
- [ ] `CHANGELOG.md` atualizado (Rule 6)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0 (68 itens) — build como último passo
- [ ] Runtime-metric proof — data-slots assertados (D4)
- [ ] `pnpm build` com FileDropzone no dist (`grep -c "FileDropzone" dist/index.js` ≥ 1)
- [ ] Plan archived pós-merge

## Failure scenarios (when I/O external)

(none — no external I/O touched)

## Final Phase: Integration Validation (MANDATORY)

### Execution

```
pnpm test:run
pnpm typecheck
pnpm lint
pnpm registry:build && pnpm registry:validate
pnpm build
```

### Acceptance Criteria

- [ ] `pnpm test:run` exit 0 (regressão + novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:validate` exit 0 (68 itens)
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado

### If Validation Fails

1. Plano vs pré-existente; 2. Fix; 3. Re-run; 4. Documentar.
