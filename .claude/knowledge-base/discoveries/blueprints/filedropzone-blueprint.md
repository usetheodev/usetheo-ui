# Blueprint: FileDropzone — upload drag-drop dependency-free (M5)

> **Version 1.0** — 2026-07-15
> **Slug:** `filedropzone`
> **Plan:** `.claude/knowledge-base/discoveries/plans/filedropzone-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
> **Pesquisa:** react-dropzone clonado (LoC confirmados: index.tsx 774, utils 305, spec 3609+573); citações spot-checked em disco 2026-07-15.

## Context

ROADMAP § M5 (deps: M0 ✅). Alvo do DoD: `FileDropzone` primitive — drag-drop + file picker, validação (tipo/tamanho/quantidade) com erros tipados, estados idle/drag-over/rejected, teclado acessível, dependency-free; story de composição com `Progress`. Caso real: ingestão do theo-rag.

## Objective

Fixar a decisão dep-vs-own (ADR D2 abaixo, com números), a mecânica de drag correta, o shape de erros tipados, o contrato a11y, o shape de testes com fixtures DnD e a fronteira upload-vs-seleção.

## Coverage Corner 1 — Integration Tests

**Q4 — done.** Fixture principal a portar (`.claude/knowledge-base/references/react-dropzone/src/index.spec.tsx:3553-3567`): `createDtWithFiles(files, {emptyTypes})` — objeto plain `{dataTransfer: {files, items: [{kind:"file", type, getAsFile}], types:["Files"]}}` aceito pelo `fireEvent` do jsdom; `createFile` (`:3583-3591`) com `size` via `Object.defineProperty`; picker via `fireEvent.change(input, {target:{files}})` (`:2412-2416`) + spy em `HTMLInputElement.prototype.click` (`:1813`).

Comportamentos pinados a transferir (describes onDrag* `:1989` / onDrop `:2398` / onKeyDown `:1809` — seleção EC-1):

| Comportamento (linha na ref) | Lente |
|---|---|
| dragenter/over/leave/drop disparam callbacks (`:1990`) | happy |
| DataTransfer SEM files (só text/html) → nenhum callback (`:2063`) | negative |
| dragenter aceito → isDragActive+isDragAccept (`:2200`); mix → isDragReject tudo-ou-nada (`:2222`) | happy/negative |
| maxSize valida JÁ no dragenter (`:2248`) | edge |
| type vazio aceito durante o drag — quirk Chrome p/ .md (`:2268`) | edge |
| dragleave de nó arbitrário NÃO desativa (`:2324`); 2 enters exigem 2 leaves (`:2351`) | edge (o bug clássico) |
| change no input converge no MESMO caminho do drop (`:2399`) | happy |
| drop rejeitado popula rejections com `code: "file-invalid-type"` (`:2421`); estado de drag reseta pós-drop (`:2524`) | negative/edge |
| Space/Enter no root clicam o input; foco fora do root não; outras teclas não (`:1810,:1849,:1965`) | happy + 2 negatives |

Shape nosso: vitest+RTL+axe; negatives assertam `code` tipado específico (testing.md § 4.1); + data-slots, forwardRef, axe (idle/drag-over/rejected/disabled), barrel, story smoke — padrão M0-M4.

## Coverage Corner 2 — Dependencies

**Q5 — done.** Deps runtime da referência: exatamente 2 (`package.json:72-75`).

| Dep | Papel (verificado) | Nossa superfície |
|---|---|---|
| `attr-accept` | 1 call site (`utils/index.ts:88`) — match File × accept string (MIME exato / `type/*` / `.ext`) | ~25-35 LoC próprias |
| `file-selector` | `fromEvent` (`index.tsx:1,170`) — extração async de File[] de qualquer DropEvent incl. `FileSystemFileHandle` (FS Access API); tipo `FileWithPath` | dispensável: `Array.from(dataTransfer.files ?? input.files)` (~10-15 LoC); dragenter usa `dataTransfer.items` (kind==="file") |

Honestidade: o source do file-selector não está no clone (sem node_modules) — o directory-traversal via `webkitGetAsEntry` NÃO foi confirmado em disco; confirmada apenas a superfície consumida (evento → `Promise<File[]>`).

**Estimativa own (base: blocos lidos):** drag mechanics ~100-130 + validação/erros ~80-100 + accept ~25-35 + extração ~10-15 + teclado/picker ~40-50 = **~255-330 LoC** vs 1079 LoC + 2 deps da referência. **Zero dependências novas.**

## Coverage Corner 3 — Tools

**Q6 — done.** `Progress` local (`src/components/primitives/progress/progress.tsx:33-43`): `value/max/intent/height/indeterminate` — pronto para a story de composição (upload em andamento = estado do CONSUMIDOR).

**Stories:** 1. `IngestUpload` (caso theo-rag: accept real de `mime-from-name.ts`, maxSize, composição com `Progress` por arquivo aceito — DoD b2); 2. `Rejected` (drop inválido → lista de rejeições tipadas); 3. `Disabled`; 4. `MultiFile` (maxFiles + tudo-ou-nada). Registry: `registry/file-dropzone.json` no shape do M4 (`registry/stepper.json` — com `dependencies` por introspecção; esperado NENHUMA); `registry:build` por último. Matriz de testes manuais cross-browser (Safari/Firefox — risco #2) documentada na story `IngestUpload`.

## Coverage Corner 4 — Techniques

### Q1 — Mecânica de drag + picker (done)

- **Target counting** (o fix do bug clássico): array de `EventTarget`s (`index.tsx:239`); push no dragenter (`:337`); no dragleave filtra targets contidos no root, remove o atual UMA vez (Firefox double-fire — comentário `:420-421`) e só desativa com array vazio (`:418-429`); drop zera o array (`:504`) e reseta o estado (`:516`).
- dragover: `preventDefault()` obrigatório + `dropEffect="copy"` em try/catch (`:390-407`).
- dragenter valida DURANTE o drag (`:339-365`) → `isDragAccept/isDragReject`.
- Picker: input `type=file` **visually-hidden por CSS** (clip/1px — `:686-698`, nunca `display:none`), `input.value="" ; input.click()` (`:566-571` — value="" permite re-selecionar o mesmo arquivo), `onChange` converge no MESMO handler do drop (`:699`), `stopPropagation` no click do input (`:676-678` — evita loop de dialog).
- Fora do nosso recorte (fronteiras anotadas): `showOpenFilePicker`/FS Access (`:522-563`), `preventDropOnDocument` (`:241-262`, EC-3 — app shell do consumidor), `isDragGlobal` (`:264-308`).

### Q2 — Validação + erros tipados (done)

- `ErrorCode` enum de 4 literais kebab-case (`utils/index.ts:30-35`); `FileError {message, code: ErrorCode | string}` (`:19-22` — aberto p/ validator custom); `FileRejection {file, errors[]}` (`index.tsx:31-34`).
- Validadores em tupla `[ok, FileError|null]`: `fileAccepted` (`:86-90` — aceita `application/x-moz-file` e type vazio em DataTransferItem `:73-75`, quirk Chrome) e `fileMatchSize` (`:92-108`).
- `maxFiles/multiple` é regra COLETIVA pós-hoc: estourou → TODOS os aceitos viram rejeição `too-many-files` (`index.tsx:450-474`, `utils:61-64`).
- `acceptPropAsAcceptAttr` (`:255-270`): `Record<mime, ext[]>` → atributo accept do input (filtra não-MIME/não-ext).
- Mensagens contextuais pinadas no spec: "File is larger than 99 bytes" (`utils/index.spec.ts:28-31`), "File type must be one of .gif, .png" (`:288-297`) — exatamente o error-handling.md § 2.

### Q3 — A11y de teclado (done)

- Root: `tabIndex=0` quando habilitado (`index.tsx:657`), Space/Enter APENAS no próprio root (`isEqualNode` — `:575-588`) → `preventDefault` + abre picker; input com `tabIndex=-1` (`:701`); `isFocused` exposto p/ focus ring (`:591-596`).
- **Ausência honesta:** grep `aria-` em `index.tsx` → 0 hits; default `role="presentation"` (`:655`). A referência NÃO resolve semântica — nosso primitive deve ir além: `role="button"` + `aria-label` obrigatória (padrão da família: Stepper M4) + `aria-disabled` + instruções visíveis.

### Consumer requirements (paths absolutos — ADR D3)

- `/home/paulo/Projetos/usetheo/theo-data/theo-rag/packages/core/src/domain/loaders/mime-from-name.ts:9-20` — mapa canônico: txt/md/html/pdf/docx/pptx/xlsx/csv (+ ocr png/jpg em `ocr-loader.ts:1-2`; office em `office-loader.ts:1-3`). Fixture de accept da story vem daqui (audio/video existem como loaders mas fora do mapa — fronteira opcional).

## Cross-cutting Comparison

| Dimensão | react-dropzone (hook) | HTML5 puro ingênuo | **Nosso FileDropzone (proposta)** |
|---|---|---|---|
| Forma | hook headless + getProps | — | primitive estilizado (tokens/data-slot), controlado |
| Drag aninhado | target counting (correto) | quebra com filhos | **porta o target counting** |
| Validação | tipo+tamanho+coletiva, erros tipados | nenhuma | **porta o shape completo** |
| Deps | 2 runtime | 0 | **0** |
| FS Access/directory | sim | não | não (fronteira) |
| A11y semântica | role=presentation, 0 aria | — | **role=button + aria-label + estado em texto** |
| LoC | 1079 | ~40 (errado) | ~255-330 |

## ADRs

### D1 — Own (dependency-free), não dep — decisão com números

**Decision:** implementar próprio, portando da referência (MIT) a mecânica de target counting, o shape de validação/erros e os quirks de browser; sem `react-dropzone`/`attr-accept`/`file-selector`.

**Rationale:** a superfície do DoD (files individuais, drop+picker, sem directory/FS-API) exige ~255-330 LoC vs 1079 LoC + 2 deps + interop CJS da referência; o DoD do roadmap já exige dependency-free (registry copy-pasteable); o valor da dep está nos ramos que NÃO usamos. Risco #1 (reimplementar mal) mitigado: os 3 pontos onde ingênuo erra (dragleave aninhado, type vazio no drag, tudo-ou-nada de maxFiles) foram extraídos com citação e entram como testes.

**Alternatives considered:** (a) adotar react-dropzone — rejeitada: hook headless não combina com primitive de registry, 2 deps transitivas, 70% da superfície não usada; (b) adotar só attr-accept — rejeitada: 1 call site, ~30 LoC próprias cobrem; (c) HTML5 ingênuo sem estudo — rejeitada: erra o dragleave aninhado (spec `:2324/:2351` prova).

**Consequences:** directory upload/FS Access/paste ficam como fronteiras documentadas; upgrade futuro = novo milestone.

### D2 — Fronteira: seleção+validação; upload é do consumidor

**Decision:** o primitive entrega `onFilesAccepted(File[])` + `onFilesRejected(FileRejection[])`; rede/progresso são do consumidor (story compõe com `Progress`).

**Rationale:** paridade com a referência (que também não faz upload); SRP; o caso theo-rag tem pipeline próprio de ingest. **Alternatives:** embutir upload com fetch (rejeitada — acopla transporte/autenticação); expor só callback único (rejeitada — separar aceito/rejeitado força o consumidor a tratar o negative path).

### D3 — A11y acima da referência

**Decision:** `role="button"` + `label` prop obrigatória (aria-label) + `aria-disabled` + rejeições comunicadas em texto (região de erro), além do contrato de teclado portado.

**Rationale:** evidência negativa Q3 (zero aria na referência); lição da família (StatusDot/Stepper: estado em texto, não só cor); axe sweep do Ladle pega regressões. **Alternatives:** copiar role=presentation (rejeitada — dropzone É interativa); delegar tudo ao consumidor como a referência (rejeitada — primitive estilizado deve sair acessível por default).

## Recommendations for the project

1. API: `FileDropzone` com `label`, `accept?: Record<mime, ext[]>`, `maxSize?/minSize?/maxFiles?`, `multiple?`, `disabled?`, `onFilesAccepted`, `onFilesRejected`, `validator?`; data-slots `file-dropzone/-input/-instructions/-rejections`; `data-state="idle|drag-over|drag-reject|disabled"`.
2. Helpers puros exportados e testados isolados (padrão M3/M4): `matchesAccept(file, accept)`, `validateFiles(files, opts) → {accepted, rejections}` — o coração testável sem DOM.
3. Portar a fixture `createDtWithFiles` para os testes.
4. Erros: enum `FileDropzoneErrorCode` (4 literais kebab-case) + mensagens contextuais com números (error-handling.md § 2).
5. `input.value=""` antes de `click()`; input visually-hidden por CSS (nunca display:none); `stopPropagation` no click do input.
6. Story `IngestUpload` com accept do `mime-from-name.ts` + matriz manual Safari/Firefox (risco #2).

## Blocked questions

(nenhuma — 6/6 done)

## Halt-loop progress (audit trail)

| Q | Status | Evidência-chave |
|---|---|---|
| Q1 | done | `index.tsx:239,337,418-429,390-407,497-517,566-571,686-699` |
| Q2 | done | `utils/index.ts:19-22,30-35,86-108,255-270`; `index.tsx:31-34,450-474`; spec `:28-31,:282-297,:384-389` |
| Q3 | done | `index.tsx:575-588,655,657,701`; grep aria- → 0 hits (evidência negativa) |
| Q4 | done | `index.spec.tsx:3553-3567,3583-3591` + describes selecionados (EC-1) |
| Q5 | done | `package.json:72-75`; call sites `utils:88`, `index.tsx:1,170`; estimativas por bloco |
| Q6 | done | `progress.tsx:33-43`; modelo `registry/stepper.json` (M4) |

Spot-check independente (orquestrador, 2026-07-15): `index.tsx:239`, `utils/index.ts:31`, `index.spec.tsx:3553` — literais confirmados.

## Related

- Plan: `.claude/knowledge-base/discoveries/plans/filedropzone-plan.md` (v1.1)
- Edge-case review: `.claude/knowledge-base/reviews/filedropzone-edge-cases-2026-07-15.md`
- Blueprints irmãos: `.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` (padrão de promoção/porte)
- ROADMAP § M5
