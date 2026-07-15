---
slug: slider-combobox-playground
milestone_id: M1
created_at: 2026-07-14
goal: Ship os primitives Slider (Radix + marks) e Combobox (cmdk, listbox inline) com testes/story/registry e a story "query playground" que fecha o DoD do M1.
---

# Plan: Slider + Combobox — playground primitives (M1)

> **Version 1.2** (2026-07-14 — v1.2: RED #1 do T2.1 ajustado ao ground truth do cmdk [attrs hardcoded pós-spread]; contrato APG mantido via adapter de atributos) — ex-v1.1 (absorve EC-1 MUST FIX + EC-2/EC-3/EC-4 SHOULD TEST no TDD; contagens 13→15 e 13→16) — Implementa os dois primitives de entrada dos playgrounds (Slider com range/step/marks/label acessível; Combobox cmdk-based com filtro sync/async, empty/loading e keyboard nav), com TDD completo, stories, entries de registry e a story de composição "query playground" (axe-validada) que satisfaz o DoD bullet 3 do M1 sem dependência cross-repo.

## Goal

Enable os consumidores do `@usetheo/ui` a montar formulários de query (recall/retrieval) com `Slider` e `Combobox` acessíveis, measured by `pnpm vitest run src/components/primitives/slider/ src/components/primitives/combobox/` verde (≥ 26 testes, axe zero violations em ambos) e `pnpm registry:validate` passando com as entries `slider` e `combobox`.

## Context

ROADMAP § M1 (deps M0 ✅ v0.16.0). Blueprint da descoberta (`slider-combobox-playground`, SHIPPABLE_WITH_CAVEATS 89) fixou: anatomia do Slider shipped do shadcn + marks no shape do Mantine (ausentes no shadcn, exigidos pelo DoD); Combobox composicional sobre cmdk (provado no `CommandPalette` local) com listbox inline sem Popover (a lib não tem Popover; DoD trava zero dep nova — blueprint ADR D2); contrato ARIA do combobox pinado pelos testes do base-ui; `@radix-ui/react-slider@1.4.3` como única dep nova do M1. O DoD bullet 3 aceita "story de composição 'query playground' validada com axe" — caminho escolhido (sem gate cross-repo; a adoção real no studio soma-se ao T3.1 do M0 quando o npm publish destravar).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha + date) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/primitives/slider/slider.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/slider/slider.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/slider/slider.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/slider/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/combobox/combobox.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/combobox/combobox.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/combobox/combobox.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/combobox/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 146 | `107eecb7` (2026-07-14) | Barrel público (55 componentes pós-M0) | Exports existentes inalterados (aditivo only) |
| `registry/slider.json` (NEW) / `registry/combobox.json` (NEW) | 0 | — | (a criar) | — |
| `registry/index.json` | 382 | `bd3fe0e4` (2026-07-14) | Índice do registry | Entries existentes inalteradas |
| `package.json` | — | `3cf456b7` (2026-07-14) | v0.16.0 | Única adição: `@radix-ui/react-slider` (ADR D5) |
| `CHANGELOG.md` | 61 | `3cf456b7` (2026-07-14) | `[Unreleased]` vazio | Versões released intactas |

### Current callers / dependents

- **Symbol:** `Slider` (NEW), `Combobox` (NEW) — zero callers hoje; callers pós-plano: stories + story "query playground" (T3.3) + futuro studio playground.
- **Symbol:** `CommandPalette` (`src/components/composites/command-palette/command-palette.tsx`, 155 LoC) — NÃO modificado; é prior art (cmdk mechanics :86-148).
- **Symbol:** `Select` (`src/components/primitives/select/select.tsx`, 217 LoC) — NÃO modificado; referência de convenção de trigger/popup local.

### Domain glossary

- **marks** — pontos rotulados sobre o track do slider (`{value, label?}[]`), clicáveis; shape do Mantine.
- **listbox inline** — lista de opções ancorada por posicionamento absoluto sob o input (sem portal); padrão APG combobox.
- **shouldFilter/filter** — mecânica de filtragem do cmdk (interna por default; custom/async via prop).
- (demais termos: ver glossário do plano M0 — data-slot, registry item, asChild.)

### Architecture boundaries affected

Nenhuma fronteira DIP cruzada (componentes de apresentação; sem I/O). Superfície pública +2 namespaces (`Slider`, `Combobox`) — `architecture.md § 3`. Dep nova de infraestrutura de UI (`@radix-ui/react-slider`) segue o padrão das 12 já instaladas.

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/slider-combobox-playground-blueprint.md` — anatomia (§ Corner 4/Q1), shape+receita combobox (§ Q2/Q3), contratos de teste (§ Corner 1/Q4-Q5), deps (§ Corner 2/Q6), registry drafts (§ Corner 3/Q7), ADRs D1-D3. Fonte primária.
- **Patterns skills:** (nenhuma `*-patterns` instalada — verificado 2026-07-14).
- **Reference projects:** `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx:16-60`; `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Slider/Slider/Slider.test.tsx:46-87`; `.claude/knowledge-base/references/base-ui/packages/react/src/combobox/input/ComboboxInput.test.tsx:146-155`.
- **Internal prior art:** `src/components/composites/command-palette/command-palette.tsx:86-148` (cmdk); plano/implementação do M0 (pipeline provado).
- **External literature:** WAI-ARIA APG Combobox pattern (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) e Slider pattern (https://www.w3.org/WAI/ARIA/apg/patterns/slider/).

## Objective

- [ ] `Slider` (single + range via array, step, marks clicáveis, aria-label, disabled, orientação) com 13+ testes.
- [ ] `Combobox` (Input/Content/Item/Empty/Loading/Group; filtro sync/async; keyboard nav; ARIA combobox/expanded/controls) com 13+ testes.
- [ ] Stories de cada primitive + story de composição "query playground" com axe (DoD bullet 3).
- [ ] Exports no barrel; `registry/slider.json` + `registry/combobox.json`; build+validate verdes.
- [ ] `@radix-ui/react-slider@^1.4.3` adicionada (única dep nova; deps-audit limpo).
- [ ] CHANGELOG `[Unreleased] § Added`.

## ADRs

### D1 — Slider: wrapper único sobre @radix-ui/react-slider com marks próprios

**Decision:** componente único (paridade shadcn shipped) `Slider` com `marks?: {value: number; label?: ReactNode}[]` renderizados sobre o track (posicionamento percentual) e clicáveis (seta value).

**Rationale:** blueprint D1 — anatomia shipped battle-tested; marks é DoD e o shape do Mantine é o consagrado; Radix resolve a a11y difícil (drag/keyboard/touch/RTL) — Rule 9.

**Alternatives considered:** subs compostos estilo base-ui (verboso sem demanda — YAGNI); sem marks (viola DoD); hand-rolled slider (a11y proibitiva).

**Consequences:** marks têm testes próprios (não são Radix); range vem grátis (value array).

### D2 — Combobox: cmdk + listbox inline (sem Popover/portal)

**Decision:** `Combobox` composicional sobre cmdk; `Combobox.Content` = wrapper `relative` no root + lista `absolute top-full z-50` mostrada por estado `open`; foco permanece no input (APG).

**Rationale:** blueprint D2 — DoD trava zero dep nova; lib sem Popover; inline atende APG e o consumidor real (playground). KISS/YAGNI: portal/collision sem demanda.

**Alternatives considered:** `@radix-ui/react-popover` (segunda dep nova — viola DoD); Dialog reuse (modal, UX errada); `@base-ui/react` (família nova — rejeitada na descoberta EC-4).

**Consequences:** LIMITAÇÃO documentada (JSDoc + story): clipping sob `overflow:hidden`; trigger de reavaliação registrado (consumidor real bloqueado OU multiselect futuro).

### D3 — Contrato ARIA do Combobox pinado por teste

**Decision:** testes pinam no input: fechado → sem `role="combobox"`/`aria-expanded`; aberto → `role="combobox"` + `aria-expanded="true"` + `aria-controls` apontando o listbox.

**Rationale:** blueprint D3 — mesmo oráculo dos testes do base-ui (`ComboboxInput.test.tsx:146-155`); cmdk dá a mecânica, nós garantimos a semântica.

**Alternatives considered:** confiar no cmdk sem pinar (regressão silenciosa); aria-activedescendant completo (interno ao cmdk; pinado indiretamente via item ativo `aria-selected`).

**Consequences:** 2 testes estruturais de a11y além do axe por componente.

### D4 — Wiring triad adaptado a biblioteca de UI (herdado do M0)

**Decision:** mesmo mapeamento do plano M0 D4: (a) caller = stories + barrel; (b) integration = testes de composição co-localizados; (c) runtime metric = `data-slot` assertado no DOM.

**Rationale:** precedente aprovado no M0 (review READY_TO_MERGE); mesma classe de artefato.

**Alternatives considered:** exigir consumo cross-repo no próprio M1 (acopla ao publish do npm — rejeitado; DoD aceita story de composição).

**Consequences:** `check_wiring` pillar (b) via ADR (followup do kit F-wire-1 segue aberto).

### D5 — Dependência nova única: @radix-ui/react-slider@^1.4.3 (granular)

**Decision:** adicionar `@radix-ui/react-slider@^1.4.3` (latest, verificada no registry 2026-07-14) como 13º pacote granular @radix-ui.

**Rationale:** convenção local é granular (12 pacotes, `package.json:42-54`), não o unificado `radix-ui` que o shadcn usa; Rule 9 (não reinventar slider a11y).

**Alternatives considered:** pacote unificado `radix-ui` (divergiria dos 12 granulares); base-ui slider (família nova).

**Consequences:** deps-audit roda CVE check na versão pinada; bundle delta esperado pequeno (tree-shaken).

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `cmdk` | `^1.1.1` | npm | Mecânica do Combobox (filtro/list/empty) — provada no CommandPalette (package.json:57) |
| `lucide-react` | `^0.471.0` | npm | Ícones (ChevronsUpDown/Check no Combobox) — ADR D5 do M0 mantém 0.x |
| `@radix-ui/react-slot` | `^1.1.2` | npm | (se necessário em subs) já instalada |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| `@radix-ui/react-slider` (NEW) | `^1.4.3` | npm | Avaliados: base-ui slider (família nova inteira — rejeitada), hand-rolled (a11y drag/keyboard/touch/RTL proibitiva — rejeitada), pacote unificado radix-ui (diverge da convenção granular local — rejeitado) | Mesma família das 12 deps @radix-ui instaladas; resolve exatamente a a11y do slider (ADR D5) |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Listbox inline clipa sob `overflow:hidden` (sem portal) | Medium | JSDoc + story documentam; trigger de reavaliação no ADR D2; consumidor imediato (playground) não clipa | Claude |
| Marks próprios (não-Radix) podem desalinhar com o track em edge de step/percent | Medium | Testes de posição percentual (min/max/meio) + story visual com marks densos | Claude |
| Combobox cmdk diverge do SOTA shadcn (base-ui) — manutenção futura sem upstream de referência | Low | ADR D2 com trigger de reavaliação; shape da API espelha o shipped (migração futura mapeável) | Paulo |
| Dep nova aumenta superfície de supply chain | Low | deps-audit (CVE) no gate; versão pinada ^1.4.3; família já auditada | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time; blueprint D1-D3 + ADRs acima cobrem as aberturas da descoberta)

## Dependency Graph

```
Phase 1 (T1.1 Slider+tests → T1.2 story) ─┐
                                           ├─▶ Phase 3 (T3.1 barrel → T3.2 registry → T3.3 changelog + query-playground story)
Phase 2 (T2.1 Combobox+tests → T2.2 story)─┘                    │
   (Phase 1 ∥ Phase 2 — independentes)                          ▼
                                                    Final Phase (Integration Validation)
```

---

## Phase 1: Slider (TDD)

**Objective:** Slider com range/step/marks/a11y pinados por teste.

### T1.1 — Slider primitive com TDD completo

#### Objective
Criar `src/components/primitives/slider/slider.tsx` (wrapper Radix + marks) com 13 testes.

#### Why this step (action + reasoning)
1. **What:** escreve `slider.test.tsx` (RED, 13 comportamentos da tabela do blueprint Corner 1), instala a dep (D5), implementa o wrapper mínimo (GREEN), refactor tokens.
2. **Why now:** fundação da Phase 1; anatomia 100% decidida (blueprint Q1 + D1); marks é o único código de lógica própria — nasce sob teste. Cita ADRs D1/D5 e Baseline rows NEW.

#### Evidence
Anatomia: `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx:16-60`. Assertions: `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Slider/Slider/Slider.test.tsx:46-87,115-117`. Convenção axe: `src/components/primitives/pagination/pagination.test.tsx:3`.

#### Files to edit
```
src/components/primitives/slider/slider.test.tsx — (NEW) RED primeiro
src/components/primitives/slider/slider.tsx — (NEW) wrapper + marks
src/components/primitives/slider/index.ts — (NEW) re-export
package.json — +1 dep @radix-ui/react-slider (ADR D5)
```

#### Deep file dependency analysis
- `slider.tsx` (NEW): importa `@radix-ui/react-slider` (dep nova D5), `cn`. Downstream: barrel (T3.1), registry (T3.2), stories.
- `slider.test.tsx` (NEW): RTL + vitest-axe (convenção pagination). `package.json`: só a linha da dep (invariant Baseline).

#### Deep Dives
- Estrutura: `Root > Track > Range + Thumb×N` (N = value array length; single = length 1); marks absolutamente posicionados: `left: ((mark.value - min) / (max - min)) * 100%`; click em mark → `onValueChange([mark.value])` (single) — em range, mark click é no-op (documentado).
- Invariants: `data-slot="slider*"` em todas as partes; forwardRef + displayName (convenção lib); tokens-only.
- Edge: min === max (divisão por zero → marks a 0%; Radix clamp); step decimal (0.05); marks fora de [min,max] → não renderiza (filter) + dev warning? não — filter silencioso documentado no JSDoc (KISS).
- Negative: value fora do range → Radix clampa (pinar comportamento).

#### Pseudo-code / Signatures
```pseudocode
interface SliderMark { value: number; label?: ReactNode }
interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> { marks?: SliderMark[] }
Slider({marks, min=0, max=100, ...}) ->
  <Root data-slot=slider min max ...>
    <Track data-slot=slider-track><Range data-slot=slider-range/></Track>
    thumbs.map(<Thumb data-slot=slider-thumb/>)
    marks?.filter(m => m.value>=min && m.value<=max).map(
      <button data-slot=slider-mark style={left:pct} onClick={setValue([m.value])} aria-label=...>)
  </Root>
# Example: <Slider aria-label="Top K" min={1} max={100} defaultValue={[5]} marks={[{value:1},{value:50},{value:100}]}/>
```

#### Tasks
1. `pnpm add @radix-ui/react-slider@^1.4.3`; 2. RED (13 testes, rodar e falhar); 3. GREEN mínimo; 4. REFACTOR tokens/classes.

#### TDD
```
RED: test_renders_single_thumb_slider() — role="slider" presente, 1 thumb (data-slot count)
RED: test_renders_range_with_two_thumbs() — value=[20,80] → 2 thumbs
RED: test_arrow_keys_change_value() — foco no thumb + ArrowRight/Left → onValueChange ±step (Mantine :46-53)
RED: test_value_clamped_to_max() — value acima do max → aria-valuenow == max (Mantine :74-80)
RED: test_value_clamped_to_min() — abaixo do min → aria-valuenow == min (Mantine :81-87)
RED: test_step_respected_on_keyboard() — step=10 → Arrow muda em 10
RED: test_decimal_step_supported() — min=0 max=1 step=0.05 → ArrowRight de 0.5 → 0.55
RED: test_marks_rendered_at_percent_positions() — marks [0,50,100] → 3 data-slot=slider-mark; style left 0%/50%/100%
RED: test_mark_click_sets_value_single() — click no mark 50 → onValueChange([50])
RED: test_marks_outside_range_not_rendered() — mark 150 com max=100 → não renderiza (edge)
RED: test_aria_attributes_present() — aria-valuemin/max/now no thumb; aria-label propagado
RED: test_all_parts_have_data_slot() — slider/track/range/thumb/mark (D4 pilar c)
RED: test_marks_with_min_equal_max_render_at_zero() — EC-1: min===max → marks a left:0% (guard range||1), sem NaN no style
RED: test_mark_click_ignored_when_disabled() — EC-2 negative: disabled → click no mark não chama onValueChange
RED: test_axe_no_violations_slider() — axe em single+range+marks
GREEN: implementar slider.tsx mínimo
REFACTOR: tokens; nenhum comportamento novo
VERIFY: pnpm vitest run src/components/primitives/slider/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/slider/` reporta 15 passed / 0 failed
- [ ] `axe()` retorna `violations.length === 0`
- [ ] `pnpm lint` exit 0 e `pnpm typecheck` exit 0
- [ ] `wc -l src/components/primitives/slider/slider.tsx` ≤ 500
- [ ] `git diff package.json` contém apenas a linha `@radix-ui/react-slider`

#### DoD
- [ ] Suite do slider verde; `pnpm typecheck && pnpm lint` exit 0

### T1.2 — Story do Slider

#### Objective
`slider.stories.tsx` com single, range, marks (topK/threshold shapes), disabled, vertical.

#### Why this step (action + reasoning)
1. **What:** 5 stories CSF Ladle + smoke test da Default no test file.
2. **Why now:** pilar (a) do D4; documenta os casos do consumidor (blueprint Consumer requirements).

#### Evidence
Formato: `src/components/primitives/button/button.stories.tsx:1-8` (Ladle). Casos: blueprint § Consumer requirements (topK 1-100; threshold 0-1 step 0.05).

#### Files to edit
```
src/components/primitives/slider/slider.stories.tsx — (NEW)
src/components/primitives/slider/slider.test.tsx — +1 smoke test da story Default
```

#### Deep file dependency analysis
- Stories importam o componente local; type-checked; sem downstream de build.

#### Deep Dives
(nenhum — composição)

#### Tasks
1. 5 stories; 2. smoke test.

#### TDD
```
RED: test_default_story_renders() — render(<Default/>) → role slider presente
VERIFY: pnpm vitest run src/components/primitives/slider/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 5 stories
- [ ] `pnpm vitest run src/components/primitives/slider/` reporta 16 passed

#### DoD
- [ ] typecheck + lint + suite verdes

---

## Phase 2: Combobox (TDD)

**Objective:** Combobox cmdk-based com estados e ARIA pinados.

### T2.1 — Combobox primitive com TDD completo

#### Objective
Criar `src/components/primitives/combobox/combobox.tsx` (root+Input+Content+Item+Empty+Loading+Group) com 13 testes.

#### Why this step (action + reasoning)
1. **What:** RED (13 comportamentos: abertura, filtro, seleção, estados, ARIA D3, edge/negative), GREEN sobre cmdk, REFACTOR.
2. **Why now:** independente da Phase 1 (paralelizável); design fechado no blueprint (Q2 shape + Q3 receita + D2/D3). Toda lógica própria (open state, aria wiring, inline listbox) nasce sob teste.

#### Evidence
Shape: `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/combobox.tsx:16-293`. Receita local: `src/components/composites/command-palette/command-palette.tsx:86-148`. Oráculo ARIA: `.claude/knowledge-base/references/base-ui/packages/react/src/combobox/input/ComboboxInput.test.tsx:146-155`.

#### Files to edit
```
src/components/primitives/combobox/combobox.test.tsx — (NEW) RED primeiro
src/components/primitives/combobox/combobox.tsx — (NEW)
src/components/primitives/combobox/index.ts — (NEW)
```

#### Deep file dependency analysis
- `combobox.tsx` (NEW): importa `cmdk` (instalada), `cn`, lucide (`ChevronsUpDown`, `Check`), context React para open/value. Downstream: barrel, registry, stories, story query-playground (T3.3).

#### Deep Dives
- Root: context {open, setOpen, value, onValueChange}; controlado/uncontrolled (open/defaultOpen).
- `Combobox.Input`: `Command.Input` estilizado como o Input da lib; abre no focus/typing; `role="combobox"`/`aria-expanded`/`aria-controls` condicionais (D3); Escape fecha; blur fora fecha (mousedown-outside listener no root — único efeito).
- `Combobox.Content`: `absolute top-full mt-1 w-full z-50` dentro do root `relative`; renderiza `Command.List`; id ligado ao aria-controls.
- `Combobox.Loading`: slot condicional (prop `loading` no Content ou sub dedicado) — spinner + aria-busy.
- Async: consumidor passa `shouldFilter={false}` + itens já filtrados (padrão cmdk) — pinado em teste.
- Edge: lista vazia → `Command.Empty`; negative: `onSelect` de item removido entre render e click → no-op sem crash.
- Invariants: data-slot="combobox*" em tudo; forwardRef+displayName; tokens-only; foco NUNCA sai do input (APG).

#### Pseudo-code / Signatures
```pseudocode
Combobox({value, onValueChange, open, defaultOpen, children}) -> div.relative[data-slot=combobox] + Provider
Combobox.Input(props) -> Command.Input role=combobox aria-expanded={open} aria-controls={open?listId:undefined}
Combobox.Content({loading, children}) -> open && <div id={listId} data-slot=combobox-content class="absolute top-full ...">
  {loading ? <Loading/> : <Command.List>{children}</Command.List>}
Combobox.Item({value, children, onSelect}) -> Command.Item (fecha + seta value no select)
# Example: <Combobox value={v} onValueChange={setV}><Combobox.Input placeholder="Collection…"/><Combobox.Content><Combobox.Empty>No results</Combobox.Empty>{items.map(<Combobox.Item/>)}</Combobox.Content></Combobox>
```

#### Tasks
1. RED (13 testes); 2. GREEN mínimo (um `Command` root por composição); 3. REFACTOR.

#### TDD
```
RED: test_closed_by_default_aria_expanded_false() — fechado: aria-expanded="false" e SEM aria-controls (v1.2: cmdk hardcoda role/aria-expanded APÓS o spread dos props — node_modules/cmdk/dist/index.mjs, Input: `...u,"role":"combobox","aria-expanded":!0` — role permanece [APG-ok]; expanded/controls corrigidos por adapter de atributos via ref no nosso Input)
RED: test_opens_on_focus_and_sets_aria() — focus → role="combobox", aria-expanded=true, aria-controls aponta o listbox (base-ui :154-155)
RED: test_typing_filters_items() — digitar "re" → só itens matching visíveis (cmdk shouldFilter)
RED: test_select_via_click_sets_value_and_closes() — click no item → onValueChange(value) + fechado
RED: test_select_via_keyboard_enter() — ArrowDown + Enter seleciona
RED: test_escape_closes_listbox() — Escape → fechado, foco permanece no input
RED: test_empty_state_rendered_when_no_match() — filtro sem match → Combobox.Empty visível
RED: test_loading_state_shows_indicator() — loading → data-slot=combobox-loading + aria-busy; itens ocultos
RED: test_async_mode_should_filter_false() — shouldFilter=false → itens não são filtrados pelo cmdk (consumidor filtra)
RED: test_outside_mousedown_closes() — mousedown fora → fecha (edge de foco)
RED: test_select_of_stale_item_is_noop() — negative: onSelect com value ausente da lista atual → sem crash, value inalterado
RED: test_all_subs_have_data_slot() — combobox/input/content/item/empty/loading (D4 pilar c)
RED: test_loading_suppresses_empty_state() — EC-3: loading + 0 itens → loading visível, Empty ausente
RED: test_unmount_removes_outside_listener() — EC-4 negative: unmount aberto remove listener global (spy), sem leak
RED: test_axe_no_violations_combobox() — axe aberto com itens + empty
GREEN: implementar combobox.tsx mínimo
REFACTOR: tokens; extração de context hook
VERIFY: pnpm vitest run src/components/primitives/combobox/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/combobox/` reporta 16 passed / 0 failed
- [ ] `axe()` retorna `violations.length === 0`
- [ ] `pnpm lint` exit 0 e `pnpm typecheck` exit 0
- [ ] `wc -l src/components/primitives/combobox/combobox.tsx` ≤ 500
- [ ] Zero dependência nova no `git diff package.json` desta task

#### DoD
- [ ] Suite do combobox verde; typecheck+lint exit 0

### T2.2 — Story do Combobox

#### Objective
`combobox.stories.tsx`: básica, com grupos, empty, loading/async, e a nota da limitação de clipping (D2).

#### Why this step (action + reasoning)
1. **What:** 4 stories + smoke test.
2. **Why now:** pilar (a) D4 + documentação executável da limitação D2 (transparência da restrição inline).

#### Evidence
Padrões de uso: blueprint § Q2 (`examples/radix/combobox-basic.tsx:21-36` como shape de composição).

#### Files to edit
```
src/components/primitives/combobox/combobox.stories.tsx — (NEW)
src/components/primitives/combobox/combobox.test.tsx — +1 smoke da Default
```

#### Deep file dependency analysis
(idem stories da lib — sem downstream)

#### Deep Dives
(nenhum)

#### Tasks
1. 4 stories (JSDoc com limitação de clipping); 2. smoke.

#### TDD
```
RED: test_default_story_renders() — render(<Default/>) → input presente
VERIFY: pnpm vitest run src/components/primitives/combobox/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0; suite reporta 14 passed
- [ ] JSDoc da story menciona a limitação `overflow:hidden` (grep "overflow" na story)

#### DoD
- [ ] typecheck + lint + suite verdes

---

## Phase 3: Export, registry, changelog e query-playground

**Objective:** publicação na superfície do pacote + prova de composição do DoD.

### T3.1 — Exports no barrel

#### Objective
Exportar `Slider` (+ types) e `Combobox` (+ types) em `src/index.ts` (aditivo, ordem alfabética local).

#### Why this step (action + reasoning)
1. **What:** +4 linhas de export; smoke tests via barrel nos dois test files.
2. **Why now:** pré-requisito do registry (T3.2) e do pilar (a); Baseline row garante aditividade.

#### Evidence
Padrão: `src/index.ts:6-9` (export do Breadcrumb no M0).

#### Files to edit
```
src/index.ts — +exports (aditivo)
src/components/primitives/slider/slider.test.tsx — +1 barrel smoke
src/components/primitives/combobox/combobox.test.tsx — +1 barrel smoke
```

#### Deep file dependency analysis
- `src/index.ts` (146 LoC): aditivo only; downstream = consumidores + registry:build.

#### Deep Dives
(nenhum — mecânico)

#### Tasks
1. Exports; 2. smokes RED→GREEN.

#### TDD
```
RED: test_barrel_exports_slider() — import { Slider } via barrel === local
RED: test_barrel_exports_combobox() — import { Combobox } via barrel === local
GREEN: exports adicionados
VERIFY: pnpm typecheck && pnpm test:run
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `git diff src/index.ts` só adições
- [ ] Suites reportam os smokes verdes

#### DoD
- [ ] `pnpm test:run` exit 0

### T3.2 — Registry entries + build + validate

#### Objective
`registry/slider.json` + `registry/combobox.json` + entries no `registry/index.json`; artefatos `r/` gerados e válidos.

#### Why this step (action + reasoning)
1. **What:** cria os dois descriptors (drafts do blueprint Corner 3, ajustados à introspecção do validate local), entries no índice, roda build+validate (RED = validate com entry sem descriptor, como no M0).
2. **Why now:** DoD padrão por componente; depende de T3.1.

#### Evidence
Drafts: blueprint § Coverage Corner 3. Lição M0 T2.2: `validate-registry.ts` exige deps por introspecção de imports (lucide/cmdk/safe-href quando importados).

#### Files to edit
```
registry/slider.json — (NEW)
registry/combobox.json — (NEW)
registry/index.json — +2 entries
```

#### Deep file dependency analysis
- Descriptors consumidos por `scripts/build-registry.ts`/`validate-registry.ts`; `registry/index.json` (382 LoC) aditivo.

#### Deep Dives
- slider deps: `["@radix-ui/react-slider"]`; combobox deps: `["cmdk","lucide-react"]` (conferir introspecção na execução).

#### Tasks
1. Entries no index (RED validate); 2. descriptors (GREEN); 3. build+validate.

#### TDD
```
RED: test_registry_validate_fails_without_descriptors() — entries no index sem descriptors → `pnpm registry:validate` exit != 0
GREEN: descriptors criados; `pnpm registry:build && pnpm registry:validate` exit 0
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `registry/r/slider.json` e `registry/r/combobox.json` gerados com fonte inline
- [ ] `pnpm registry:validate` exit 0 (63 itens)

#### DoD
- [ ] build + validate verdes; diff em registry/ aditivo (regeneração determinística de r/ documentada se ocorrer — lição M0)

### T3.3 — CHANGELOG + story de composição "query playground" (DoD bullet 3)

#### Objective
Story `query-playground` (Slider topK + Slider threshold + Combobox de coleção) validada com axe em teste, + CHANGELOG.

#### Why this step (action + reasoning)
1. **What:** story de composição em `src/components/primitives/combobox/combobox.stories.tsx` (ou arquivo de composição próprio) montando o formulário de query do blueprint Consumer requirements; teste com axe sobre a composição; entries no CHANGELOG.
2. **Why now:** satisfaz o DoD bullet 3 do M1 pela via "story de composição 'query playground' validada com axe" (ROADMAP), sem gate cross-repo. Cita blueprint Consumer requirements + Unbreakable Rule 6.

#### Evidence
DoD bullet 3 (ROADMAP § M1); shapes: blueprint § Consumer requirements (topK 1-100; threshold 0-1 step 0.05; combobox de coleções).

#### Files to edit
```
src/components/primitives/combobox/combobox.stories.tsx — +story QueryPlayground (composição com Slider)
src/components/primitives/combobox/combobox.test.tsx — +test axe da composição
CHANGELOG.md — [Unreleased] § Added (2 entries)
```

#### Deep file dependency analysis
- Story importa `Slider` do módulo irmão (composição intra-lib legítima em stories); CHANGELOG aditivo.

#### Deep Dives
- Composição: fieldset "Query" com labels visíveis ligados (htmlFor) aos controles — o axe valida labels.

#### Tasks
1. Story QueryPlayground; 2. teste axe da composição; 3. CHANGELOG.

#### TDD
```
RED: test_query_playground_composition_axe_clean() — render da composição (2 sliders + combobox aberto) → axe zero violations + valores default corretos
GREEN: story + fixes de label se o axe reclamar
VERIFY: pnpm vitest run src/components/primitives/combobox/ && pnpm test:run
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/combobox/` inclui o teste da composição verde (axe zero violations)
- [ ] `CHANGELOG.md` contém as entries sob `## [Unreleased]` § Added (`grep -A8 Unreleased CHANGELOG.md`)

#### DoD
- [ ] Suite completa verde; CHANGELOG atualizado

---

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | Slider com range, step, marks, label acessível (M1 DoD b1) | T1.1, T1.2 | Wrapper Radix + marks Mantine-shape, 13 testes + stories |
| 2 | Combobox cmdk zero-dep-nova com async, empty/loading, keyboard (M1 DoD b2) | T2.1, T2.2 | Composicional cmdk + listbox inline (D2), 13 testes + stories |
| 3 | Uso em tela real OU story "query playground" axe-validada (M1 DoD b3) | T3.3 | Story de composição + teste axe |
| 4 | DoD padrão: registry validando (grill Q3) | T3.2 | Descriptors + build + validate |
| 5 | Export público mínimo aditivo (architecture.md § 3) | T3.1 | +2 namespaces no barrel |
| 6 | Única dep nova auditada com Rule 9 (restrições/grill Q5) | T1.1, § Dependencies | @radix-ui/react-slider ^1.4.3 + deps-audit |
| 7 | Contrato ARIA combobox + negative/edge cases (testing.md § 4.1; blueprint D3) | T2.1 | Testes D3 + stale-item/empty/outside-click |
| 8 | CHANGELOG (Rule 6) | T3.3 | Entries em [Unreleased] |

**Coverage: 8/8 gaps covered (100%)**

## Global Definition of Done

- [ ] All phases completed
- [ ] `pnpm test:run` exit 0 (suite completa)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `wc -l` ≤ 500 em todo arquivo alterado (`rules/architecture.md`)
- [ ] `CHANGELOG.md` atualizado under `[Unreleased]` (Unbreakable Rule 6)
- [ ] Backward compatibility: exports existentes intactos (`git diff src/index.ts` aditivo)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0
- [ ] Runtime-metric proof — `data-slot` de todos os subs assertados em teste (D4)
- [ ] Plan archived após merge do PR de release

## Failure scenarios (when I/O external)

(none — no external I/O touched)

## Final Phase: Integration Validation (MANDATORY)

**Objective:** cadeia completa verde no repo.

### Execution

```
pnpm test:run
pnpm typecheck
pnpm lint
pnpm registry:build && pnpm registry:validate
pnpm build
```

### Acceptance Criteria

- [ ] `pnpm test:run` exit 0 (regressão dos 55 + novos)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:validate` exit 0
- [ ] `pnpm build` gera dist com `Slider` e `Combobox` (grep em dist)
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado

### If Validation Fails

1. Separar falhas do plano vs pré-existentes; 2. Corrigir as do plano; 3. Re-rodar; 4. Documentar pré-existentes no PR.

## Absorbed MUST-FIX items (from /edge-case-plan)

### EC-1 (auto-absorbed): min === max → posição percentual das marks divide por zero
- **Source:** edge-case-plan MUST FIX
- **Affected task:** T1.1
- **Family:** Input / Boundary
- **Scenario:** `((mark.value - min) / (max - min)) * 100` com `max === min` → `NaN%`/`Infinity%` no style — render quebrado silencioso. (RESOLVIDO no v1.1: RED test_marks_with_min_equal_max_render_at_zero adicionado ao TDD de T1.1 + guard range||1.)
- **Impact:** Estilo inválido no DOM; regressão visual silenciosa.
- **Suggested fix:** guard de 1 linha (`const range = max - min || 1`) + RED test `test_marks_with_min_equal_max_render_at_zero()` no TDD de T1.1.

