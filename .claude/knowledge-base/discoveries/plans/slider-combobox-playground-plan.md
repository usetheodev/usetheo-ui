# Discovery Plan: Slider + Combobox — playground primitives (M1)

> **Version 1.1** (2026-07-14 — absorve MUST FIX EC-1: shadcn v4 não tem mais receita cmdk; Q2 extrai só o SHAPE da API, Q3 é a fonte do COMO via prior art interno; checkpoints EC-2/EC-3 adicionados) — Investigar como shadcn (fonte shipped), base-ui e Mantine implementam/testam Slider e Combobox, contrastar a receita cmdk clássica (que nosso `CommandPalette` já usa) com o Combobox base-ui do shadcn v4, e levantar os requisitos do consumidor real (playground do theokit-studio), para fixar API, a11y, testes e registry dos dois primitives do M1.

**Slug:** `slider-combobox-playground`
**Owner:** Paulo + Claude
**Created:** 2026-07-14
**Time budget:** 3.5h (ADR D1)

## Context

ROADMAP.md § M1 (deps: M0 ✅) exige `Slider` (Radix) e `Combobox` sobre o `cmdk` já instalado (zero dep nova além do slider). Verificação 2026-07-14: `@radix-ui/react-slider` NÃO está no package.json (12 pacotes @radix-ui presentes; slider ausente) → única dep nova candidata. O combobox shipped do shadcn v4 mudou para `@base-ui/react` (`ui/combobox.tsx:4`) — contraponto de design, não caminho (DoD trava cmdk). Prior art local: `src/components/composites/command-palette/` (cmdk) e `src/components/primitives/select/` (Radix popup). Regras consumidas: `rules/testing.md § 4.1`, `rules/parsimony-ladder.md` (rung 4), `rules/architecture.md § 3`.

## Objective

Produzir blueprint que fixe: anatomia/props/ARIA do `Slider` (single + range, marks, orientação), o modelo do `Combobox` cmdk-based (trigger+popover+lista filtrável, async, empty/loading), shape de testes (unit+axe+keyboard) e entries de registry — sem incógnita de design para o `/to-plan` do M1.

- [ ] All research questions answered with citations to `.claude/knowledge-base/references/`
- [ ] Cross-cutting comparison table populated
- [ ] Recommendations com ≥ 1 proposta concreta por questão
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/shadcn-ui/` | `apps/v4/registry/new-york-v4/ui/slider.tsx`, `apps/v4/registry/new-york-v4/ui/combobox.tsx`, `apps/v4/registry/new-york-v4/ui/_registry.ts` (slider :532; combobox :172), `apps/v4/examples/radix/combobox-*.tsx` | Fonte shipped (lição EC-1 do M0) + contraponto base-ui |
| `.claude/knowledge-base/references/base-ui/` | `packages/react/src/slider/`, `packages/react/src/combobox/` | Semântica ARIA de referência (plano B do Radix; catalog M1) |
| `.claude/knowledge-base/references/mantine/` | `packages/@mantine/core/src/components/Slider/` | API madura de slider (marks, range) + testes de comportamento |
| (interno) | `src/components/composites/command-palette/`, `src/components/primitives/select/`, `package.json` | Prior art cmdk + convenções Radix popup locais |
| (consumidor externo) | `theokit-studio/packages/studio/src/pages/playground/index.tsx` | Caso real (agent selector; futuros topK/threshold) — ADR D3 do M0 reaplicado |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/shadcn-ui/apps/v4/styles/` | Variantes temáticas; shipped é `registry/new-york-v4/` (lição M0 EC-1) |
| `.claude/knowledge-base/references/mantine/` fora de `Slider/` | Autocomplete/Select do Mantine usam framework próprio; budget (D1) |
| `.claude/knowledge-base/references/{tremor,react-json-view,react-dropzone,tanstack-virtual,data-table-filters}/` | Suportam M2-M6 |
| Adotar `@base-ui/react` como dep | DoD do M1 trava cmdk (zero dep nova além do slider); base-ui é só referência de a11y |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** shadcn 1.5h; base-ui 1h; mantine 0.5h; interno+studio 0.5h. Total 3.5h.

**Rationale:** dois componentes (vs 1 no M0); shadcn segue sendo a maior transferência (mesmo modelo registry); base-ui ganha peso por ser a referência ARIA dos dois componentes. Alternativas: split igual (subutiliza shadcn), incluir Mantine combobox (framework próprio, baixa transferência).

**Stop condition — per question (mandatory):** Fase A vazia após 3 variantes de query → BLOCKED "Fase A exhausted"; seguir para a próxima. Nunca preencher com hotspots de outra questão.

**Stop condition — per project (mandatory):** budget exaurido → questões restantes BLOCKED ("budget exhausted"); se todos os projetos exaurirem, emitir `<promise>BLUEPRINT_BLOCKED</promise>` — nunca `BLUEPRINT_COMPLETE` parcial.

**Anti-pattern:** fabricar Fase B com Fase A exaurida (Unbreakable Rule 3).

**Consequences:** questões BLOCKED viram seed da próxima descoberta.

### D2 — Fonte canônica: registry shipped, dois contrapontos deliberados

**Decision:** fonte primária = `apps/v4/registry/new-york-v4/ui/{slider,combobox}.tsx`; base-ui e Mantine são contrapontos de API/ARIA, nunca fonte de código.

**Rationale:** lição EC-1 do M0 (styles ≠ shipped). O combobox shipped usa @base-ui — estudamos o SHAPE da API (sub-componentes, estados) e reimplementamos sobre cmdk+Popover (parsimony rung 4: cmdk instalado e provado no CommandPalette). Alternativas: adotar @base-ui (rejeitada — DoD + dep pesada), receita cmdk das docs antigas sem olhar o shipped (perde o shape moderno da API).

**Consequences:** o blueprint mapeia API base-ui-combobox → equivalentes cmdk; divergências documentadas.

### D3 — Consumidor externo lido, não citado como referência

**Decision:** theokit-studio lido via path absoluto (read-only), seção "Consumer requirements" no blueprint com paths absolutos — mesma regra do M0 (ADR D3 daquele plano).

**Rationale:** golden rule valida paths de `references/`; o studio é consumidor vivo.

**Consequences:** blueprint distingue evidência SOTA de requisito de consumidor.

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Qual a anatomia do Slider shipped do shadcn (sub-componentes, multi-thumb/range, orientação, data-slots, ARIA, CSS vars)? | techniques | `.claude/knowledge-base/references/shadcn-ui/` | Grep `function Slider\|SliderPrimitive` em `apps/v4/registry/new-york-v4/ui/slider.tsx` | Read do arquivo inteiro; tabela por sub: elemento/aria/props | Tabela sub → elemento → aria → props com `path:line` |
| Q2 | Que SHAPE de API o combobox shipped do shadcn expõe (subs, estados empty/loading, clear)? EC-1: shadcn v4 é 100% base-ui — extrair APENAS o shape; NÃO procurar receita cmdk lá (não existe) | techniques | `.claude/knowledge-base/references/shadcn-ui/` | Grep `^function Combobox` em `apps/v4/registry/new-york-v4/ui/combobox.tsx` (verificado: base-ui based, :4) | Read completo + Read de 3 exemplos `apps/v4/examples/radix/combobox-{basic,clear,custom}.tsx` (padrões de USO); a implementação cmdk vem de Q3 (prior art interno) | Tabela de subs/estados do shape → decisão de superfície para a nossa lib |
| Q3 | Como o nosso CommandPalette usa cmdk hoje (filtro, keyboard, grupos) e o que falta para virar Combobox (trigger+popover+seleção única+async)? | techniques | (interno) | Grep `Command\.` em `src/components/composites/command-palette/command-palette.tsx` | Read completo + Read `src/components/primitives/select/select.tsx` (convenção popup/trigger local) | Lista do delta cmdk→combobox + convenções locais a reusar |
| Q4 | Que comportamentos os testes de referência pinam para slider (keyboard arrows/home/end, aria-valuenow/text, range) e o que a convenção local exige (axe, aria)? | tests | `.claude/knowledge-base/references/mantine/`, `.claude/knowledge-base/references/base-ui/` | Glob `packages/@mantine/core/src/components/Slider/**/*.test.tsx`; Glob `packages/react/src/slider/**/*.test.tsx` em base-ui | Read dos test files; extrair assertions de COMPORTAMENTO (fora de harness de framework — lição EC-3 do M0); cruzar com `src/components/primitives/radio-group/radio-group.test.tsx` local se existir (fallback: switch) | Lista comportamento → assertion, marcando edge (min==max, step decimal) e negative (value fora do range) |
| Q5 | Que semântica ARIA o combobox do base-ui implementa (roles, aria-expanded, activedescendant, listbox) que nossos testes devem pinar? | tests | `.claude/knowledge-base/references/base-ui/` | Grep `role=\|aria-` em `packages/react/src/combobox/` (arquivos root/input/list) | Read dos hits em contexto; destilar o contrato ARIA mínimo (combobox pattern APG) | Contrato ARIA mínimo testável (tabela role/attr → onde) |
| Q6 | Deps: qual versão/estado de `@radix-ui/react-slider` (a ÚNICA dep nova) e o cmdk instalado cobre o combobox sem dep nova? | deps | `.claude/knowledge-base/references/shadcn-ui/` + (interno) | Grep `^import` em `apps/v4/registry/new-york-v4/ui/slider.tsx`; Grep `"cmdk"` em `package.json` local (verificado :57) | Confirmar import granular radix no shipped; registrar versão-alvo para o deps-audit do cycle-plan | Tabela dep → status (nova/instalada) → Rule 9 rationale |
| Q7 | Como o registry shadcn declara slider (:532) e combobox (:172) e como mapeia para nosso schema (lição: validate local exige deps por introspecção de imports)? | tools | `.claude/knowledge-base/references/shadcn-ui/` | Read `apps/v4/registry/new-york-v4/ui/_registry.ts` nos blocos :532 e :172 | Mapear campo a campo para o shape de `registry/breadcrumb.json` (nosso modelo M0); prever deps que o `validate-registry.ts` local exigirá (lucide, cmdk, @radix-ui/react-slider, safe-href?) | Drafts de `registry/slider.json` + `registry/combobox.json` |

**Consumer requirements (per D3, fora do budget de questões):** Read `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/pages/playground/index.tsx` — agent selector atual (dropdown de registry) e campos futuros de recall/retrieval (topK 1-100, threshold 0-1 step 0.05) → props mínimos que os dois componentes precisam cobrir.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4, Q5 | Covered |
| Dependencies | Q6 | Covered |
| Tools | Q7 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop Checkpoints

| Checkpoint | Assertion | Action if fails |
|---|---|---|
| Before answering Qx | Paths da Fase A existem (pré-validados 2026-07-14) | BLOCKED "path not found"; continue |
| Per-question Fase A budget | ≥ 1 hotspot OU 3 variantes tentadas | BLOCKED "Fase A exhausted"; continue |
| After answering Qx | Seção tem ≥ 1 citação `references/` (exceto Consumer requirements — D3) | Re-iterar (1 retry) |
| Q4 behavior-only (lição EC-3 M0) | ≥ 2 assertions de comportamento fora de harness de framework por componente | Re-iterar Q4 (1 retry) |
| Q2 anti scope-creep | Extrair o shape SEM abrir internals do @base-ui além do necessário | Cortar digressão |
| Q3 capacidades cmdk provadas (EC-2) | Input-em-popover, filtro custom/async (shouldFilter=false), Command.Empty — cada capacidade citada com file:line do nosso código ou do cmdk em node_modules | Re-iterar Q3 (1 retry) |
| Q4 jsdom-only (EC-3) | Só assertions reproduzíveis em jsdom (keyboard, aria-value*, clamp); drag/pointer marcado fora do escopo unit | Ajustar resposta de Q4 |
| Per-project time budget | Budget não exaurido (D1) | BLOCKED restantes; próximo projeto |
| Before promising complete | 4 corners + Consumer requirements populados; ≥ 1 ADR | Recusar promise |

## Acceptance Criteria

- [ ] Questões respondidas OU BLOCKED com razão
- [ ] 4 corners populados no blueprint
- [ ] Toda citação resolve em `.claude/knowledge-base/references/{...}`
- [ ] Seção Consumer requirements com props mínimos por componente
- [ ] ≥ 1 ADR de síntese no blueprint
- [ ] Budget respeitado
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS
- [ ] Blueprint em `.claude/knowledge-base/discoveries/blueprints/slider-combobox-playground-blueprint.md`

## Global Definition of Done

- [ ] Fases plan → edge-cases → plan-confidence → execute → confidence completas
- [ ] Verdict final registrado no header do blueprint
- [ ] 0 citações fabricadas; Coverage Matrix 100%
- [ ] ADRs citam princípios/regras do projeto (D1→Rule 3; D2→parsimony rung 4 + lição EC-1 M0; D3→fronteiras; Q4→testing.md § 4.1)
