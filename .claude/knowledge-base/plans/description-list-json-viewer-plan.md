---
slug: description-list-json-viewer
milestone_id: M2
created_at: 2026-07-15
goal: Ship os primitives DescriptionList (dl/dt/dd com layouts) e JsonViewer (tree colapsável dependency-free, circular-safe) com stories e registry.
---

# Plan: DescriptionList + JsonViewer — detail primitives (M2)

> **Version 1.1** (2026-07-15 — absorve SHOULD TEST EC-1/EC-2; contagem JV 14→16) — Implementa `DescriptionList` (semântica nativa `dl/dt/dd`, layouts horizontal/vertical, densidade) e `JsonViewer` (tree colapsável dependency-free com o inventário de edge cases do blueprint — incluindo circular-safe, que a referência SOTA não trata), com TDD completo, stories (incl. composição "detail panel" DL+JV com fixture real do studio), registry e CHANGELOG. Zero dependências novas. Consome o blueprint SHIPPABLE_WITH_CAVEATS 89 do M2.

## Goal

Enable os consumidores do `@usetheo/ui` a montar painéis de detalhe (metadados chave-valor + payloads JSON) com `DescriptionList` e `JsonViewer`, measured by `pnpm vitest run src/components/primitives/description-list/ src/components/primitives/json-viewer/` verde (≥ 23 testes, axe zero violations em ambos, negative de referência circular incluso) e `pnpm registry:validate` passando com as entries `description-list` e `json-viewer` (65 itens).

## Context

ROADMAP § M2 (deps: M0 ✅ v0.16.0; M1 READY_TO_MERGE — PR #2 no gate humano; **implementação deste plano só inicia após o merge**, pois commits em develop entram no PR aberto). Blueprint (`description-list-json-viewer`, 89): JsonViewer com `collapsed: boolean|number`, lazy-render de subtrees fechadas, WeakSet contra circular (referência react-json-view NÃO trata — verificado), truncamento 60 com expand, BigInt com sufixo `n`; DescriptionList 100% semântico com layout por grid; copy-por-nó via `CopyButton` local (item de registry `copy-button` confirmado). Consumidor real: event inspector do studio (`<details>` + `JSON.stringify` hoje).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/primitives/description-list/description-list.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/description-list/description-list.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/description-list/description-list.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/description-list/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/json-viewer/json-viewer.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/json-viewer/json-viewer.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/json-viewer/json-viewer.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/json-viewer/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 158 | `df7d1d6c` | Barrel público (57 componentes pós-M1) | Aditivo only |
| `registry/description-list.json` (NEW) / `registry/json-viewer.json` (NEW) | 0 | — | (a criar) | — |
| `registry/index.json` | 394 | `02d9e54f` | Índice (63 itens) | Entries existentes intactas; ordem alfabética |
| `CHANGELOG.md` | 75 | `321886c1` | `[Unreleased]` vazio pós-0.17.0 | Released intocadas |

### Current callers / dependents

- **Symbol:** `DescriptionList` / `JsonViewer` (NEW) — zero callers; pós-plano: barrel + stories + registry (D3 wiring herdado).
- **Symbol:** `CopyButton` (`src/components/primitives/copy-button/copy-button.tsx:28` — `CopyButtonProps`) — CONSUMIDO (não modificado) pelo JsonViewer; registry item `registry/copy-button.json` existe (vira registryDependency).
- **Symbol:** `cn` — consumido pelos dois.

### Domain glossary

- **collapse lazy** — subtree fechada não renderiza (guard de performance do JsonViewer; blueprint D1).
- **circular-safe** — WeakSet de ancestrais na recursão; nó repetido renderiza "[Circular]" (negative obrigatório).
- **layout horizontal (DL)** — grid com coluna fixa para `dt` e `dd` ao lado; vertical = empilhado.
- **data-slot** — convenção de observabilidade (wiring pilar c).

### Architecture boundaries affected

Nenhuma fronteira DIP (apresentação pura, sem I/O). +2 exports (architecture.md § 3). Zero deps novas.

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/description-list-json-viewer-blueprint.md` — collapse model (§ Q1), edge cases (§ Q2 — circular NÃO tratado na referência), DL API (§ Q3), testes (§ Corner 1), registry (§ Corner 3), ADRs D1-D3. Fonte primária.
- **Patterns skills:** (nenhuma — verificado).
- **Reference projects:** `.claude/knowledge-base/references/react-json-view/core/src/index.tsx:65-79` (collapsed/shorten props); `.claude/knowledge-base/references/react-json-view/core/src/types/index.tsx:7-12,62,84,224` (BigInt/truncation); `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/field.tsx:81-141` (vocabulário).
- **Prior art interno:** M0/M1 (pipeline, adapters, lições de review); `CopyButton` (clipboard+aria-live prontos).
- **External literature:** MDN `<dl>` semantics (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dl).

## Objective

- [ ] `DescriptionList` + subs (`Item/Term/Detail`) com layouts e densidade; 10 comportamentos testados.
- [ ] `JsonViewer` com collapse boolean|number, lazy subtree, circular-safe, truncamento 60+expand, tipos (BigInt `n`, null, undefined, fn, Date), copy-por-nó via CopyButton; 16 comportamentos testados.
- [ ] Stories: DL (3) + JsonViewer (3, incl. fixture de evento do studio e composição "detail panel" DL+JV) com axe em teste.
- [ ] Barrel aditivo + `registry/{description-list,json-viewer}.json` + entries; build+validate 65 itens.
- [ ] CHANGELOG `[Unreleased] § Added`.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `lucide-react` | `^0.471.0` | npm | ChevronRight (toggle de nó) — pin do lucide herdado do plano M0 (bump 1.x é follow-up) |
| (interno) `CopyButton` | — | — | copy-por-nó (blueprint D3); registry item existente |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| (none) | — | — | Avaliado e rejeitado: react-json-view como dep (registry copy-pasteable + roadmap trava dependency-free; referência é blueprint de design — plan-blueprint D2) | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — JsonViewer: collapse lazy com estado por caminho e recursão circular-safe

**Decision:** árvore recursiva de nós; subtree fechada NÃO renderiza; estado `Set<string>` de paths expandidos (init derivado de `collapsed: boolean|number`); recursão carrega `WeakSet` de ancestrais → "[Circular]"; strings > `shortenTextAfterLength` (60) truncadas com expand por clique; BigInt com sufixo `n`; undefined/função renderizados literais.

**Rationale:** blueprint D1 + Q1/Q2 (referência dá o mapa; não trata circular — nós DEVEMOS, testing.md § 4.1 negative). Lazy-render é o guard de performance (KISS, sem virtualização — M6 se houver demanda).

**Alternatives considered:** adotar react-json-view (rejeitado — roadmap/registry); eager render + windowing (rejeitado — complexidade sem demanda); controlled expansion API (rejeitado — YAGNI).

**Consequences:** payload gigante totalmente expandido é do consumidor — **documentado no JSDoc** (lição BLOCKER do review M1: consequência de ADR vive no código).

### D2 — DescriptionList semântico com layout por grid

**Decision:** `dl` root com `layout: "vertical"|"horizontal"` e `dense?: boolean`; subs `Item` (div de grupo), `Term` (dt), `Detail` (dd); tokens-only.

**Rationale:** blueprint D2 — parsimony rungs 2-3 (plataforma dá semântica/a11y); vocabulário shadcn field/item só para nomes.

**Alternatives considered:** API data-driven `items[]` (rejeitada como primária — lição M0); div-based (rejeitada — perde semântica).

**Consequences:** axe valida pareamento dt/dd (dlitem rule) — teste pina.

### D3 — Wiring triad herdado (M0 D4 / M1 D3)

**Decision:** (a) barrel+stories+registry; (b) testes co-localizados; (c) data-slot assertado.

**Rationale/Alternatives/Consequences:** idênticos aos ADRs aprovados nos reviews M0/M1 (precedente 2×).

### D4 — Implementação gated no merge do PR #2

**Decision:** os commits de código deste plano só começam após o merge do PR #2 (develop→main aberto): novos commits em develop entrariam AUTOMATICAMENTE no PR da release 0.17.0, corrompendo a rastreabilidade single-flip.

**Rationale:** cycle-release § Hard gates (single-flip; release↔milestone 1:1). Artefatos `.claude/` (este plano, gates) são trilha de auditoria, não código do pacote — inofensivos no diff do PR.

**Alternatives considered:** branch de feature para M2 (rejeitado — viola single-trunk develop das regras git); esperar sem planejar (rejeitado — desperdício).

**Consequences:** o halt-loop do implement verifica `gh pr view 2 --json state == MERGED` como pre-condition extra.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| JsonViewer recursivo sem virtualização degrada com payloads gigantes expandidos | Medium | Collapse lazy por default (`collapsed=1` sugerido nas stories); JSDoc documenta (D1); M6 é o slot de virtualização | Claude |
| Estado por path (`Set<string>`) colide se keys tiverem separador igual ao delimitador | Low | Delimitador não-imprimível (` `) no path; edge test com keys contendo "." | Claude |
| dt/dd pareamento quebrado por Item custom children | Low | Teste axe pina; JSDoc mostra composição correta | Claude |
| PR #2 demorar trava o início da implementação | Medium | D4: pre-condition explícita; discovery+plan pré-staged (este documento) | Paulo |

## Unresolved Questions

(none — every decision is resolved at plan time; blueprint 89 fixou design e o gate D4 fixa o timing)

## Dependency Graph

```
[GATE D4: PR #2 MERGED + M1 flip]
        │
Phase 1 (T1.1 DL+testes → T1.2 DL stories) ─┐
Phase 2 (T2.1 JV+testes → T2.2 JV stories+composição) ─┤ (1 ∥ 2)
                                                        ▼
Phase 3 (T3.1 barrel → T3.2 registry; T3.3 changelog ∥ T3.2)
                                                        ▼
                                        Final Phase (Integration Validation)
```

## Phase 1: DescriptionList (TDD)

**Objective:** DL semântico com layouts, 10 comportamentos pinados.

### T1.1 — DescriptionList primitive com TDD completo

#### Objective
`description-list.tsx` (+ index) com subs Item/Term/Detail.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** RED (10 testes) → GREEN mínimo → REFACTOR tokens.
2. **Why now:** componente simples primeiro (paraleliza mentalmente com o denso JV); design fechado no blueprint Q3/D2. Cita ADRs D2/D3.

#### Evidence
blueprint do M2 (§ Q3/D2 — `.claude/knowledge-base/discoveries/blueprints/description-list-json-viewer-blueprint.md`) (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/field.tsx:81-141` vocabulário); convenção subs: `src/components/primitives/breadcrumb/breadcrumb.tsx` (factory `sub()` M0).

#### Files to edit
```
src/components/primitives/description-list/description-list.test.tsx — (NEW) RED primeiro
src/components/primitives/description-list/description-list.tsx — (NEW)
src/components/primitives/description-list/index.ts — (NEW)
```

#### Deep file dependency analysis
- `description-list.tsx` (NEW): importa só `cn`. Downstream: barrel, registry, stories, composição do T2.2.
- Teste: helpers de fixture (lição M0 — quality hook).

#### Deep Dives
- Root `dl`: `layout` vertical (stack, `gap`) | horizontal (grid `[grid-template-columns:max-content_1fr]`, dt na col 1); `dense` reduz paddings/gaps.
- Item: `div` com display contents no horizontal? NÃO — grid direto no dl com Item como contents wrapper (`display: contents`) para manter dt/dd filhos do grid. Invariant: DOM final tem `dl > div > dt+dd` (válido HTML5: div permitido em dl para agrupar).
- Term: `dt` tokens `text-body-sm text-muted-foreground`; Detail: `dd` `text-body-sm text-foreground` com `font-mono` opcional? NÃO (YAGNI — consumidor põe CodeBlock/JsonViewer no Detail).
- Edge: dl vazio válido; Item com múltiplos dd (HTML permite) — suportado por composição.

#### Pseudo-code / Signatures
```pseudocode
DescriptionList({layout="vertical", dense, className, ...}) -> dl[data-slot=description-list][data-layout]
DescriptionList.Item -> div[data-slot=description-list-item] (display:contents no horizontal via CSS do root)
DescriptionList.Term -> dt ; DescriptionList.Detail -> dd
# Example
<DescriptionList layout="horizontal">
  <DescriptionList.Item><DescriptionList.Term>Status</DescriptionList.Term><DescriptionList.Detail><Badge>live</Badge></DescriptionList.Detail></DescriptionList.Item>
</DescriptionList>
```

#### Tasks
1. RED (10); 2. GREEN; 3. REFACTOR; 4. index.ts.

#### TDD
```
RED: test_renders_semantic_dl_dt_dd() — DOM contém dl > (div) > dt + dd pareados
RED: test_n_items_render_n_terms_and_details() — 3 itens → 3 dt e 3 dd
RED: test_vertical_layout_default() — data-layout="vertical" no dl
RED: test_horizontal_layout_grid() — layout="horizontal" → data-layout + classe de grid presente
RED: test_dense_reduces_spacing() — dense → data-dense no root (tokens compactos)
RED: test_item_allows_multiple_details() — 1 Term + 2 Detail no mesmo Item renderiza 2 dd (HTML válido)
RED: test_empty_list_renders_valid_dl() — edge: dl sem filhos, sem crash
RED: test_all_subs_have_data_slot() — description-list/-item/-term/-detail
RED: test_root_forwards_ref() — ref chega ao dl
RED: test_axe_no_violations_both_layouts() — axe(vertical + horizontal) zero violations
GREEN: implementar description-list.tsx mínimo
REFACTOR: tokens; factory sub() se o quality hook exigir
VERIFY: pnpm vitest run src/components/primitives/description-list/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/description-list/` reporta 10 passed / 0 failed
- [ ] `pnpm lint` exit 0; `wc -l` ≤ 500 em `description-list.tsx`
- [ ] Zero imports além de `cn` (`grep -c "^import" description-list.tsx` ≤ 3)

#### DoD (Definition of Done)
- [ ] `pnpm vitest run src/components/primitives/description-list/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T1.2 — DescriptionList stories

#### Objective
3 stories (vertical, horizontal, dense com Badge/Timestamp compostos) + smoke.

#### Why this step (action + reasoning)
1. **What:** stories CSF + smoke test da Default.
2. **Why now:** pilar (a) do D3; demonstra composição com primitives existentes (Badge/Timestamp — reuso).

#### Evidence
Convenção: `src/components/primitives/slider/slider.stories.tsx` (M1). Caso: metadados de memória (theo-memory) do blueprint § Consumer.

#### Files to edit
```
src/components/primitives/description-list/description-list.stories.tsx — (NEW)
src/components/primitives/description-list/description-list.test.tsx — +1 smoke
```

#### Deep file dependency analysis
- Stories importam DL + Badge/Timestamp (composição intra-lib permitida em stories).

#### Deep Dives
(nenhum)

#### Tasks
1. 3 stories; 2. smoke.

#### TDD
```
RED: test_default_story_renders() — story Default renderiza dl com ≥ 1 dt
VERIFY: pnpm vitest run src/components/primitives/description-list/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 3 stories

#### DoD
- [ ] `pnpm vitest run src/components/primitives/description-list/` reporta 11 passed / 0 failed

## Phase 2: JsonViewer (TDD)

**Objective:** viewer colapsável circular-safe com 14 comportamentos pinados.

### T2.1 — JsonViewer primitive com TDD completo

#### Objective
`json-viewer.tsx` (+ index): árvore recursiva com collapse lazy, tipos, truncamento, copy.

#### Why this step (action + reasoning)
1. **What:** RED (14) → GREEN → REFACTOR (extração de Node interno).
2. **Why now:** componente denso do M2; design 100% no blueprint (Q1/Q2/D1). Cita D1/D3.

#### Evidence
blueprint do M2 (§ Q1 — `.claude/knowledge-base/discoveries/blueprints/description-list-json-viewer-blueprint.md`) (`.claude/knowledge-base/references/react-json-view/core/src/index.tsx:65-79`), § Q2 (`core/src/types/index.tsx:7-12,62,84` + circular AUSENTE — verificado), D1/D3. CopyButton: `src/components/primitives/copy-button/copy-button.tsx:28`.

#### Files to edit
```
src/components/primitives/json-viewer/json-viewer.test.tsx — (NEW) RED primeiro
src/components/primitives/json-viewer/json-viewer.tsx — (NEW)
src/components/primitives/json-viewer/index.ts — (NEW)
```

#### Deep file dependency analysis
- `json-viewer.tsx` (NEW): importa `cn`, `ChevronRight` (lucide), `CopyButton` (local). Downstream: barrel/registry/stories/composição.

#### Deep Dives
- **Node recursivo:** `renderValue(value, path, depth, ancestors: WeakSet)`; objeto/array → toggle button (ChevronRight rotate) + children quando expandido; `ancestors.has(value)` → span "[Circular]".
- **Estado:** `expandedOverrides: Map<string, boolean>` + default por `collapsed` (true→nada expandido; number N→expande depth < N; false/undefined→tudo expandido). Path delimiter ` ` (risco de colisão de keys — Drawback 2).
- **Tipos:** string (aspas, truncada > 60 com "…" clicável → expande), number, boolean, null, undefined, BigInt (`123n`), function (`ƒ`), symbol (`Symbol()`); array `[n]`/objeto `{n}` badge de contagem quando fechado.
- **Copy:** `CopyButton` (variant ghost, hover) em nós objeto/array + raiz — `JSON.stringify` do subtree (BigInt→string no replacer; circular→"[Circular]" no replacer também! senão stringify lança — negative test).
- **A11y:** toggles são `<button aria-expanded aria-label="Toggle {key}">`; árvore em `ul/li` com `role` default de lista; mono font (`font-mono text-code-sm`).
- Edge: `{}`/`[]` (sem toggle — folha); root primitivo (`JsonViewer value={42}`); key com "." (delimiter test).
- Negative: circular na RENDER e no COPY (replacer).

#### Pseudo-code / Signatures
```pseudocode
interface JsonViewerProps { value: unknown; collapsed?: boolean | number;
  shortenTextAfterLength?: number; enableCopy?: boolean; className?: string }
isExpanded(path,depth) = overrides.get(path) ?? defaultFor(depth, collapsed)
safeStringify(v): JSON.stringify(v, replacer com WeakSet→"[Circular]" e BigInt→`${v}n`)
# Example: <JsonViewer value={eventPayload} collapsed={1}/>
```

#### Tasks
1. RED (14); 2. GREEN; 3. REFACTOR.

#### TDD
```
RED: test_renders_primitive_types_literally() — string/number/boolean/null visíveis (it.each — ideia da referência types/index.test.tsx:113)
RED: test_bigint_rendered_with_n_suffix() — BigInt(10) → "10n"
RED: test_undefined_and_function_render_without_crash() — literal "undefined" / "ƒ"
RED: test_collapsed_true_hides_children() — collapsed → children de objeto NÃO estão no DOM (lazy)
RED: test_collapsed_depth_number() — collapsed=1: raiz expandida, nível 2 fechado
RED: test_toggle_click_expands_and_collapses() — click no button → children aparecem; aria-expanded alterna
RED: test_long_string_truncated_with_expand() — string 100 chars → 60 + "…"; click revela completa
RED: test_circular_reference_renders_marker() — negative: objeto circular → "[Circular]" no DOM, sem stack overflow
RED: test_copy_button_copies_safe_json() — negative: copy de subtree circular → clipboard recebe JSON com "[Circular]" (replacer), sem throw
RED: test_empty_object_and_array_are_leaves() — {} e [] sem toggle (edge)
RED: test_primitive_root_renders() — value={42} (edge)
RED: test_key_containing_delimiter_char() — key com "." não colide paths (edge Drawback 2)
RED: test_date_renders_as_iso_string() — EC-1: new Date(0) renderiza determinístico (string ISO via toJSON no copy; render literal pinado)
RED: test_empty_string_key_renders() — EC-2: {"": 1} renderiza sem crash e sem colidir com o root
RED: test_all_parts_have_data_slot() — json-viewer/-node/-toggle/-key/-value/-copy
RED: test_axe_no_violations_expanded_tree() — axe(árvore aberta com todos os tipos)
GREEN: implementar json-viewer.tsx mínimo
REFACTOR: extrair Node/TypeValue internos; tokens
VERIFY: pnpm vitest run src/components/primitives/json-viewer/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/json-viewer/` reporta 16 passed / 0 failed
- [ ] `pnpm lint` exit 0; `wc -l` ≤ 500 em `json-viewer.tsx`
- [ ] `grep -c "react-json-view" src/components/primitives/json-viewer/json-viewer.tsx` == 0 (zero cópia; D2 do discovery)

#### DoD
- [ ] `pnpm vitest run src/components/primitives/json-viewer/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T2.2 — JsonViewer stories + composição "detail panel"

#### Objective
3 stories (event payload do studio como fixture, collapsed depth, DetailPanel = DL+JV) + smoke + axe da composição.

#### Why this step (action + reasoning)
1. **What:** stories + teste axe da composição DetailPanel.
2. **Why now:** evidência executável do caso consumidor (blueprint § Consumer; DoD M2 "estados onde aplicável"); composição é o pilar (a) agregado do M2.

#### Evidence
Fixture: shape do event inspector (`/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/pages/events/index.tsx:92-99`); composição: lição QueryPlayground M1.

#### Files to edit
```
src/components/primitives/json-viewer/json-viewer.stories.tsx — (NEW)
src/components/primitives/json-viewer/json-viewer.test.tsx — +2 (smoke + composição axe)
```

#### Deep file dependency analysis
- Stories importam JV + DescriptionList (T1.1) + Badge — composição intra-lib.

#### Deep Dives
- Story DetailPanel: DL horizontal (id, status Badge, timestamp) + Detail com JsonViewer (payload collapsed=1) — o painel de detalhe de memória do theo-memory em miniatura.

#### Tasks
1. 3 stories; 2. smoke + axe da composição.

#### TDD
```
RED: test_event_payload_story_renders() — story EventPayload renderiza key "type" do fixture
RED: test_detail_panel_composition_axe() — DetailPanel: dl presente + json-viewer presente + axe zero violations
VERIFY: pnpm vitest run src/components/primitives/json-viewer/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/json-viewer/` reporta 16 passed / 0 failed

#### DoD
- [ ] `pnpm vitest run src/components/primitives/description-list/ src/components/primitives/json-viewer/` reporta 27 passed / 0 failed

## Phase 3: Export, registry e docs

**Objective:** superfície pública + registry + CHANGELOG.

### T3.1 — Exports no barrel

#### Objective
Exportar os dois (+ types) em `src/index.ts` com smokes.

#### Why this step (action + reasoning)
1. **What:** +2 blocos aditivos (alfabético local) + smokes de identidade via barrel (RED antes do export).
2. **Why now:** pré-req do registry; padrão M0/M1.

#### Evidence
`src/index.ts:6-21` (blocos Breadcrumb/Combobox/Slider do M0/M1).

#### Files to edit
```
src/index.ts — aditivo
src/components/primitives/description-list/description-list.test.tsx — +1 smoke barrel
src/components/primitives/json-viewer/json-viewer.test.tsx — +1 smoke barrel
```

#### Deep file dependency analysis
- Barrel (158 LoC, Baseline): aditivo only.

#### Deep Dives
(nenhum)

#### Tasks
1. Smokes RED; 2. exports GREEN.

#### TDD
```
RED: test_barrel_exports_description_list() — identidade via "../../../index.js"
RED: test_barrel_exports_json_viewer() — idem
VERIFY: pnpm test:run && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `git diff src/index.ts` só adições

#### DoD
- [ ] `pnpm test:run` exit 0 (suite inteira)

### T3.2 — Registry entries + build + validate

#### Objective
2 descriptors + entries no index; `registry/r/*` válidos (65 itens).

#### Why this step (action + reasoning)
1. **What:** entries no index (RED validate) → descriptors (drafts do blueprint § Corner 3) → build+validate.
2. **Why now:** DoD padrão; lições M0/M1 (introspecção de imports: json-viewer declara lucide-react + registryDeps cn/copy-button/tailwind-preset).

#### Evidence
blueprint do M2 (§ Corner 3 — `.claude/knowledge-base/discoveries/blueprints/description-list-json-viewer-blueprint.md`); modelos `registry/combobox.json` (M1); `registry/copy-button.json` existente.

#### Files to edit
```
registry/description-list.json — (NEW)
registry/json-viewer.json — (NEW)
registry/index.json — +2 entries
```

#### Deep file dependency analysis
- Consumidos por build/validate; index aditivo.

#### Deep Dives
(drafts prontos no blueprint)

#### Tasks
1. Entries (RED); 2. descriptors; 3. build+validate.

#### TDD
```
RED: test_registry_validate_fails_without_descriptors() — entries sem descriptors → `pnpm registry:validate` exit != 0
GREEN: `pnpm registry:build && pnpm registry:validate` exit 0 (65 itens)
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm registry:validate` exit 0 com 65 itens

#### DoD
- [ ] `git diff --stat registry/` mostra apenas adições + regenerações do `registry:build` (documentadas no PR se ocorrerem)

### T3.3 — CHANGELOG

#### Objective
Entries `[Unreleased] § Added`.

#### Why this step (action + reasoning)
1. **What:** 2 entries consumer-facing.
2. **Why now:** Unbreakable Rule 6; ∥ T3.2.

#### Evidence
CHANGELOG (75 LoC, `[Unreleased]` vazio — Baseline).

#### Files to edit
```
CHANGELOG.md — [Unreleased] § Added
```

#### Deep file dependency analysis
- Aditivo em Unreleased.

#### Deep Dives
(nenhum)

#### Tasks
1. Entries.

#### TDD
```
RED: test_changelog_mentions_new_components() — `grep -A25 "\[Unreleased\]" CHANGELOG.md` contém DescriptionList e JsonViewer (gate documental)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -A25 "\[Unreleased\]" CHANGELOG.md` contém os dois componentes sob § Added

#### DoD
- [ ] `pnpm test:run` exit 0 (suite inteira)

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | DescriptionList term/detail com layouts e densidade (ROADMAP M2 DoD b1) | T1.1, T1.2 | dl/dt/dd + grid + dense, 11 testes |
| 2 | JsonViewer dependency-free colapsável com profundidade, copy por nó, truncamento, circular-safe (DoD b2) | T2.1 | 14 comportamentos incl. negatives de circular (render + copy) |
| 3 | Event inspector do studio coberto por story equivalente; payloads reais (DoD b3) | T2.2 | Fixture de evento + composição DetailPanel com axe |
| 4 | DoD padrão (testes+axe, story, registry) — grill Q3 | T1.x-T3.2 | 29 testes, 6 stories, 2 registry items |
| 5 | Export mínimo aditivo (architecture.md § 3) | T3.1 | Barrel + smokes |
| 6 | Zero dep nova (roadmap; blueprint Corner 2) | T2.1, T3.2 | AC do T2.1 (zero cópia da referência) + descriptors do T3.2 declaram apenas deps existentes; package.json intocado |
| 7 | CHANGELOG (Rule 6) | T3.3 | Entries § Added |
| 8 | Timing seguro da release (single-flip) | T1.1 | Pre-condition do halt-loop no T1.1 (ADR D4): `gh pr view 2 --json state` == MERGED antes do primeiro RED |

**Coverage: 8/8 gaps covered (100%)**

## Global Definition of Done

- [ ] All phases completed (início gated por D4)
- [ ] `pnpm test:run` exit 0 (+29 novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] File-size ≤ 500 LoC por arquivo-fonte (`rules/architecture.md`; gerados isentos per gate corrigido no M1)
- [ ] `CHANGELOG.md` atualizado (Rule 6)
- [ ] Backward compat (exports existentes intactos)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0 (65 itens)
- [ ] Runtime-metric proof — data-slots assertados (D3)
- [ ] `pnpm build` com os dois no dist (`grep -c "DescriptionList\|JsonViewer" dist/index.js` ≥ 2)
- [ ] Plan archived: `mv` para `plans/completed/` após merge do PR de release (`gh pr view` MERGED)

## Failure scenarios (when I/O external)

(none — no external I/O touched)

## Final Phase: Integration Validation (MANDATORY)

**Objective:** cadeia completa verde.

### Execution

```
pnpm test:run
pnpm typecheck
pnpm lint
pnpm registry:build && pnpm registry:validate
pnpm build
```

### Acceptance Criteria

- [ ] `pnpm test:run` exit 0 (regressão dos 57 componentes + novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:validate` exit 0 reportando 65 itens
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado — nada a exercitar

### If Validation Fails

1. Plano vs pré-existente; 2. Fix; 3. Re-run; 4. Documentar pré-existentes.
