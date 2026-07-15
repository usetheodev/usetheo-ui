# Blueprint: Slider + Combobox — playground primitives (M1)

> **Version 1.0** — Sintetiza a anatomia do Slider shipped do shadcn, o shape de API do Combobox moderno (base-ui) e a receita cmdk local, os contratos de teste (Mantine/base-ui) e as entries de registry, fixando o design dos dois primitives do M1 — incluindo as duas decisões estruturais: marks próprios no Slider (shadcn não tem) e listbox inline sem Popover (zero dep nova para o Combobox).

**Slug:** `slider-combobox-playground`
**Source plan:** `.claude/knowledge-base/discoveries/plans/slider-combobox-playground-plan.md` (v1.1)
**Owner:** Paulo + Claude
**Generated:** 2026-07-14 via `/discover-execute` (halt-loop inline, 7 iterações)
**Confidence verdict:** SHIPPABLE_WITH_CAVEATS (89.0 — weighted 100; cap único: soft_floor_citation_density_low; 0 fabricadas; 4/4 corners) — 2026-07-14

## Context

ROADMAP § M1 (deps M0 ✅). Verificado: `@radix-ui/react-slider` ausente do package.json (única dep nova candidata); cmdk instalado (`package.json:57`) e provado no CommandPalette; a lib NÃO tem Popover primitive nem `@radix-ui/react-popover`.

## Objective

Fixar API, a11y, testes e registry de `Slider` e `Combobox` sem incógnitas para o `/to-plan`.

---

## Coverage Corner 1 — Integration Tests

### Mantine Slider (Q4)

Assertions de comportamento transferíveis (jsdom-safe, fora do harness — checkpoint EC-3):

- Setas direita/esquerda mudam o valor (`onChange` com 60/40 a partir de 50) — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Slider/Slider/Slider.test.tsx:46-53`.
- Clamp: valor nunca > max (`:74-80`) nem < min (`:81-87`).
- Hidden input carrega name/value para forms (`:40-44`).
- `aria-valuetext` só quando fornecido (`:115-117`).
- Range: `RangeSlider.test.tsx` (mesmo dir) cobre dois thumbs.
- Drag/pointer: EXCLUÍDO do escopo unit (jsdom não reproduz — EC-3); coberto por story manual.

### base-ui Combobox (Q5)

Contrato ARIA pinado pelos testes do próprio base-ui — `.claude/knowledge-base/references/base-ui/packages/react/src/combobox/input/ComboboxInput.test.tsx:146-155`:

| Estado | Assertion |
|---|---|
| Fechado | input SEM `role="combobox"`/`aria-expanded`/`aria-controls` (:146-148) |
| Aberto | input `role="combobox"` + `aria-expanded="true"` + `aria-controls` (:154-155) |

(base-ui usa aria-activedescendant para foco virtual — `ComboboxInput.tsx:339`. O cmdk gerencia isso internamente via `aria-selected` nos items; nosso teste pina combobox-role/expanded/controls + navegação por teclado + `Command.Empty`.)

### Convenção local

`pagination.test.tsx`/`radio-group.test.tsx`: vitest + vitest-axe (`axe()` → `toHaveNoViolations`), getByRole. Testes a pinar por componente:

| Componente | Comportamentos |
|---|---|
| Slider | render single/range (N thumbs), arrows mudam valor, clamp min/max, step respeitado, marks renderizados e clicáveis?, aria-valuenow/min/max, label acessível (aria-label), disabled, data-slots, forwardRef, axe |
| Combobox | abre no focus/click, filtra ao digitar, seleção via Enter/click fecha e seta valor, Empty state, loading state, keyboard nav (setas), aria combobox/expanded/controls, edge: lista vazia, negative: onSelect com value inexistente é no-op, data-slots, forwardRef, axe |

---

## Coverage Corner 2 — Dependencies

| Dep | Status | Evidência |
|---|---|---|
| `@radix-ui/react-slider` | **NOVA (única do M1)** — shadcn usa o pacote unificado `radix-ui@^1.4.3` (`apps/v4/package.json:79`; import `ui/slider.tsx:4`); nós seguimos a convenção granular local (12 pacotes `@radix-ui/react-*` instalados, `package.json:42-54`) | Rule 9: reimplementar slider a11y (drag+keyboard+touch+RTL) é exatamente o que Radix resolve; alternativas: base-ui (família nova inteira — rejeitada), hand-rolled (a11y de slider é notoriamente difícil — rejeitada) |
| `cmdk` | instalada (`package.json:57`), provada em `command-palette.tsx:3,86-148` | zero dep nova para Combobox (DoD) |
| `@radix-ui/react-popover` | **NÃO adicionar** (ADR D2 abaixo) | — |

## Coverage Corner 3 — Tools

Entries shadcn (`_registry.ts`): slider `:532` `{dependencies:["radix-ui"]}`; combobox `:172` `{dependencies:["@base-ui/react"], registryDependencies:["button","input-group"]}`.

Drafts para o nosso schema (modelo `registry/breadcrumb.json` do M0; o `validate-registry.ts` local exige deps por introspecção de imports — lição T2.2 M0):

```json
// registry/slider.json
{"name":"slider","type":"registry:ui","dependencies":["@radix-ui/react-slider"],
 "registryDependencies":["cn","tailwind-preset"],
 "files":[{"path":"components/primitives/slider/slider.tsx","type":"registry:ui","target":"components/ui/slider.tsx"}]}
// registry/combobox.json
{"name":"combobox","type":"registry:ui","dependencies":["cmdk","lucide-react"],
 "registryDependencies":["cn","tailwind-preset"],
 "files":[{"path":"components/primitives/combobox/combobox.tsx","type":"registry:ui","target":"components/ui/combobox.tsx"}]}
```

(lucide-react entra se o componente importar ícones — introspecção local exige; conferir na implementação.)

---

## Coverage Corner 4 — Techniques

### Slider — anatomia shipped (Q1)

`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/slider.tsx`:

- Componente ÚNICO (não-composicional): `SliderPrimitive.Root > Track > Range + Thumb×N` (:27-60); thumbs derivados do length do value/defaultValue (:16-24) → range = passar array.
- `data-slot` em cada parte (:28,40,46,55); orientação via `data-[orientation=...]` classes (:34-44); min/max default 0/100 (:12-13); disabled via `data-[disabled]` (:34).
- **Sem marks** — o DoD exige; shape do Mantine: `marks: {value,label}[]` (dir `Marks/` em `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Slider/`), renderizados sobre o track com labels clicáveis.

### Combobox — shape de API moderno (Q2) + receita cmdk local (Q3)

Shape shipped (base-ui-based, `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/combobox.tsx:16-293`): `Combobox(Root)`, `Value`, `Trigger`, `Clear` (:42), `Input` (com `showClear` :55-90), `Content` (:92), `List` (render-prop de items :129), `Item` (:142), `Group/Label` (:169-193), `Empty` (:201), `Separator`, `Chips*` (multiselect — fora do M1). Uso canônico: `examples/radix/combobox-basic.tsx:21-36`.

Receita cmdk local (prior art): `src/components/composites/command-palette/command-palette.tsx` — `Command` root com `shouldFilter` + `filter` custom (:86), `Command.Input` (:89), `Command.List` (:103), `Command.Empty` (:104), `Command.Group` (:108), `Command.Item` com onSelect (:122). Capacidades EC-2 provadas: input controlado dentro de overlay (Dialog) funciona; filtro custom suportado; Empty nativo.

**Nossa API (síntese):** `Combobox` composicional cmdk-based: `Combobox` (root com value/onValueChange, open controlado/uncontrolled), `Combobox.Input` (trigger+campo no mesmo elemento, padrão APG), `Combobox.Content` (listbox ancorado inline), `Combobox.Item`, `Combobox.Empty`, `Combobox.Loading` (estado async), `Combobox.Group`. Estados empty/loading de primeira classe (DoD).

## Consumer requirements (paths absolutos — plano ADR D3; lido 2026-07-14)

`/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/pages/playground/index.tsx`: filtro de agentes hoje é `Input` + filter client-side (:82-86, lista :102) — caso direto de Combobox (seleção de agente com typeahead). Campos futuros de recall/retrieval (grill/roadmap): topK 1-100 step 1; threshold 0-1 step 0.05 → Slider single com marks e `aria-label`; sem necessidade de range no consumidor imediato (range entra por paridade shadcn/DoD, custo ~zero).

## Cross-cutting Comparison

| Dimension | shadcn shipped | base-ui | Mantine | Nossa decisão |
|---|---|---|---|---|
| Slider composição | único componente, thumbs por value length | subs compostos | único + marks/scale | único componente + prop `marks` (Mantine shape) |
| Slider deps | radix-ui unificado | própria | própria | `@radix-ui/react-slider` granular |
| Combobox base | @base-ui/react | própria | — | cmdk + listbox inline (D2) |
| Combobox estados | Empty, Clear, Chips | idem | — | Empty + Loading (M1); Clear/Chips fora (YAGNI) |
| ARIA combobox | via base-ui | role/expanded/controls (test :146-155) | — | pinar o mesmo contrato nos nossos testes |

## ADRs

### D1 — Slider: wrapper único sobre @radix-ui/react-slider + marks próprios

**Decision:** um componente `Slider` (não-composicional, paridade shadcn) com props `min/max/step/value/defaultValue/orientation/disabled/aria-label` + `marks?: {value: number; label?: ReactNode}[]` renderizados sobre o track.

**Rationale:** anatomia shipped é battle-tested (Q1); marks é exigência do DoD ausente no shadcn — shape do Mantine (Q1/Q4) é o consagrado. Radix granular segue a convenção dos 12 pacotes instalados (Rule 9/consistência).

**Alternatives considered:** subs compostos estilo base-ui (verboso sem demanda — YAGNI); sem marks (viola DoD); pacote unificado radix-ui (divergiria dos 12 granulares instalados).

**Consequences:** marks são nossos (testes próprios); dep nova única auditada no deps-audit.

### D2 — Combobox: cmdk + listbox inline ancorado (sem Popover/portal)

**Decision:** Combobox composicional sobre cmdk; `Combobox.Content` renderiza o listbox em container `relative` + lista `absolute top-full` (inline, sem portal), aberto/fechado por estado.

**Rationale:** DoD trava zero dep nova; a lib não tem Popover (`grep react-popover package.json` vazio; sem primitive). Inline atende o padrão APG (input + listbox abaixo) e o caso do playground. Portal/collision é complexidade sem consumidor (KISS/YAGNI).

**Alternatives considered:** adicionar `@radix-ui/react-popover` (viola DoD; segunda dep nova); reusar Dialog (modal — UX errada); adotar @base-ui/react (família nova inteira — rejeitada, EC-4 do edge-case review).

**Consequences:** LIMITAÇÃO DOCUMENTADA: clipping em ancestrais com `overflow:hidden` — registrar no JSDoc + story; se um consumidor real bater nisso, ADR futuro reavalia Popover (trigger de reavaliação explícito, tb. para o caso base-ui/multiselect).

### D3 — Contrato ARIA do Combobox pinado por teste (base-ui como oráculo)

**Decision:** testes pinam `role="combobox"`, `aria-expanded`, `aria-controls` no input (aberto) e ausência quando fechado — mesmo contrato dos testes do base-ui (Q5 :146-155).

**Rationale:** é o contrato APG mínimo verificável em jsdom; cmdk fornece a mecânica de lista, nós garantimos a semântica do input/trigger.

**Alternatives considered:** confiar no cmdk sem pinar (regressões silenciosas); aria-activedescendant completo (cmdk gerencia internamente — pinar via aria-selected do item ativo).

**Consequences:** dois testes de a11y estrutural além do axe.

## Recommendations for the project

| # | Recommendation | Linked to | Priority |
|---|---|---|---|
| 1 | `Slider` primitive (wrapper Radix + marks Mantine-shape), testes da tabela Corner 1 | Q1, Q4, D1, testing.md § 4.1 | HIGH |
| 2 | `Combobox` primitive cmdk-based composicional com Empty/Loading e listbox inline | Q2, Q3, D2, parsimony rung 4 | HIGH |
| 3 | Testes ARIA do combobox por D3 + axe em ambos | Q5, D3 | HIGH |
| 4 | `registry/slider.json` + `registry/combobox.json` conforme drafts (introspecção local de imports) | Q7 | HIGH |
| 5 | Deps: adicionar APENAS `@radix-ui/react-slider` (deps-audit no cycle-plan); Rule 9 documentado | Q6 | HIGH |
| 6 | Story "query playground" (Slider topK/threshold + Combobox de coleção) — satisfaz DoD bullet 3 via story axe-validada | Consumer req. | HIGH |

## Blocked questions (if any)

(none — 7/7 respondidas)

## Halt-loop progress (audit trail)

- Iterations used: 7 (inline) · Questions answered: 7/7 · blocked: 0 · Promise: BLUEPRINT_COMPLETE

## Related

- Discovery plan: `.claude/knowledge-base/discoveries/plans/slider-combobox-playground-plan.md`
- Project rules: `.claude/rules/testing.md`, `.claude/rules/parsimony-ladder.md`, `.claude/rules/architecture.md`
