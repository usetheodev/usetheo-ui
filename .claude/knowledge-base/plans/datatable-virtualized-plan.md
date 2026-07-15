---
slug: datatable-virtualized
milestone_id: M6
created_at: 2026-07-15
goal: Ship o modo virtualized do DataTable sobre @tanstack/react-virtual (única dep nova do V1) com prova de 10K linhas em teste e story, sem breaking na API atual.
---

# Plan: DataTable virtualizado (M6)

> **Version 1.2** (v1.1 + Drawback do sinal M7: virtual-table do dashboard tem zero callers — justificativa repousa nos casos forward-looking do ROADMAP; absorve EC-1/EC-2 do edge-case review — 12→14 REDs no T1.2; EC-3/4 documentados) — Adiciona o modo `virtualized` ao `DataTable` existente seguindo o blueprint do M6: dep `@tanstack/react-virtual` aprovada com números (ADR D1 do blueprint), `<Table>` semântica preservada com o padrão do exemplo oficial (tr em fluxo + `translateY(start − index*size)` + thead sticky no container próprio — ADR D2), corpo virtual em módulo co-localizado (piso de 300 do hook — ADR 0001-m5/followup #10), exclusões type-level (paginação/expandable) e testes com injeção de `observeElementRect` (padrão oficial — ADR D3). Zero breaking.

## Goal

Enable os consumidores do `@usetheo/ui` a renderizar 10K+ linhas no `DataTable` via prop `virtualized`, measured by `pnpm vitest run src/components/composites/data-table/` verde (≥ 16 testes novos incl. janela exata de 10.000 linhas) e `pnpm registry:validate` com a dep declarada (68 itens, entry `data-table` atualizada).

## Context

ROADMAP § M6 (deps M0 ✅; M3-M5 ✅). Blueprint (`datatable-virtualized`, 89): dep decidida com números (MIT, 1 transitiva zero-dep, tree-shakeable, ~4-6KB gzip estimado — MEDIR nesta implementação, T1.1); padrão de render que preserva a semântica que o dashboard perdeu (divs → nossa promoção corrige); matriz de exclusão mapeada por leitura integral do componente atual. Consumidor real: dashboard `virtual-table.tsx` (M7 substitui com deleção).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `package.json` | 118 | `fc127fd7` | Manifests | +1 dependency APENAS (`@tanstack/react-virtual`) |
| `src/components/composites/data-table/data-table.tsx` | 357 | `66a3335b` | DataTable atual (sort, paginação, expandable, rowActions, loading/empty) | **Zero breaking**; já ACIMA do piso 300 do hook — mudanças mínimas (tipos + branch de delegação); nenhuma feature atual alterada |
| `src/components/composites/data-table/data-table-virtualized.tsx` (NEW) | 0 | — | corpo virtual (módulo co-localizado — ADR 0001-m5) | ≤ 300 LoC |
| `src/components/composites/data-table/data-table.test.tsx` | 279 | `66a3335b` | 15 testes atuais | Todos continuam verdes (prova de não-breaking) |
| `src/components/composites/data-table/data-table.stories.tsx` | (existente) | — | stories atuais | Intocadas; +2 novas |
| `src/components/composites/data-table/index.ts` | (existente) | — | re-exports | Aditivo |
| `src/index.ts` | 190 | `5aae67a9` | Barrel (62 componentes pós-M5) | Aditivo only |
| `registry/data-table.json` / `registry/index.json` | — / 424 | `9ac3d593` | Descriptor atual (`dependencies: ["lucide-react"]`) / 68 itens | Entry data-table ganha a dep + 2º file; contagem segue 68 |
| `CHANGELOG.md` | 129 | `fc127fd7` | `[Unreleased]` vazio pós-0.21.0 | Released intocadas |

### Current callers / dependents

- **Symbol:** `DataTable` — exportado no barrel (`src/index.ts`), usado em stories próprias; consumidores externos (studio/dashboard) via npm — por isso ZERO breaking é hard gate. Assinatura atual: `DataTableProps<T>` com `columns/data/rowKey/sort/onSortChange/pagination/expandable/rowActions/loading/empty`.
- **Symbols (NEW):** `DataTableVirtualizedBody` (interno ao módulo novo), tipo `DataTableVirtualizedOptions` — expostos via barrel apenas como tipo.
- **Dep NEW:** `@tanstack/react-virtual@^3.14.6` — peers react 16.8-19 satisfeitos.

### Domain glossary

- **união discriminada de modos** — `virtualized` presente EXCLUI `pagination`/`expandable` no type-level (`never`); a matriz de exclusão do blueprint vira contrato de tipo.
- **translateY corrigido por índice** — em `<table>`, a base do translate de um `<tr>` é sua posição natural no tbody: `translateY(start − index*rowHeight)` (exemplo oficial `main.tsx:132-139`).
- **injeção de rect** — option `observeElementRect` sintética nos testes (padrão dos testes oficiais) → viewport determinístico em jsdom.
- **rowKey estável** — obrigatório no modo virtualized (lição do dashboard: índice quebra o reuse do virtualizer em filtros).

### Architecture boundaries affected

+1 dependência de runtime (a única do V1 — ADR do blueprint consumido). Módulo novo co-localizado; sem camada nova; sem "use client".

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/datatable-virtualized-blueprint.md` — API mínima (Q1), padrão de render (Q2), receita de teste (Q4), custo da dep (Q5), registry (Q6), matriz de exclusão (Consumer).
- **Reference projects:** `.claude/knowledge-base/references/tanstack-virtual/packages/react-virtual/src/index.tsx:84,230-235` (contrato do hook); `.claude/knowledge-base/references/tanstack-virtual/examples/react/table/src/main.tsx:132-139` (padrão tr+translateY — adotado); `.claude/knowledge-base/references/tanstack-virtual/packages/react-virtual/tests/index.test.tsx:56-59` (injeção de rect — adotada); `.claude/knowledge-base/references/data-table-filters/packages/registry/public/r/data-table.json:6-9` (modelo de declaração da dep no registry).
- **Fontes de design (consumer):** dashboard `virtual-table.tsx` (paths absolutos; ADR D3 da família) — defaults rowHeight 56/overscan 5/maxHeight 600.
- **ADR precedente:** `.claude/knowledge-base/adrs/0001-m5-filedropzone-structure.md` (módulo co-localizado pelo piso de 300).
- **Patterns skills:** (nenhuma — verificado).

## Objective

- [ ] Dep `@tanstack/react-virtual@^3.14.6` adicionada (package.json + registry) com bundle MEDIDO registrado no ADR D1 deste plano.
- [ ] `DataTable` com prop `virtualized: { height, rowHeight, overscan? }` — união discriminada excluindo `pagination`/`expandable`; corpo virtual em `data-table-virtualized.tsx` (≤300 LoC) preservando `<Table>` semântica + thead sticky.
- [ ] ≥ 16 testes novos: janela exata de 10K com rect injetado, translateY literal, total size, sort no modo virtual, edges (0 rows/1 row), negative type-level (`@ts-expect-error`) + dev-warning runtime; os 15 testes atuais intactos.
- [ ] 2 stories novas (Virtualized10K determinística — DoD b3; VirtualizedCompact) + smoke; caveats documentados (JSDoc: dropdown fora do overscan; célula ≤ rowHeight; sem expandable/paginação).
- [ ] Registry atualizado (dep + 2º file) validado; CHANGELOG.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `lucide-react` | instalada | npm | Ícones já usados pelo DataTable atual |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| `@tanstack/react-virtual` | `^3.14.6` | npm | Own (~120-200 LoC happy path) rejeitado — classe de bug scroll-math que os 2182 LoC do core pagam; `react-window` rejeitado — API de componente forçaria fork; CSS content-visibility rejeitado — sem controle de janela (blueprint ADR D1, com números) | MIT; 1 transitiva zero-dep; tree-shakeable; produção no dashboard (^3.13.26, mesma superfície) |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — `@tanstack/react-virtual` como única dep nova do V1 (consome blueprint ADR D1)

**Decision:** adicionar `^3.14.6`; T1.1 MEDE o custo real de bundle (build antes/depois) e registra o número aqui via nota de implementação.

**Rationale:** números do blueprint (MIT, 1 transitiva zero-dep, sideEffects false, superfície estável 3.13↔3.14, produção interna). Rule 9: virtualização é problema resolvido difícil de resolver bem — simetria honesta com M5 (superfície pequena → own; profunda → dep).

**Alternatives considered:** own fixo (rejeitada — edge cases de scroll chegam via bug de consumidor); react-window (rejeitada — componente, não hook: forçaria fork, violando DoD b2); content-visibility CSS (rejeitada — sem janela/overscan controláveis).

**Consequences:** registry do item deixa de ser zero-dep (modelo shadcn padrão — risco #2 do ROADMAP mitigado por declaração explícita); deps-audit passa a escanear o pacote.

### D2 — Modo por união discriminada; corpo virtual em módulo co-localizado

**Decision:** `DataTableProps<T>` vira união: modo padrão (todas as features atuais; `virtualized?: never`) OU modo virtualized (`virtualized: {...}`; `pagination?: never; expandable?: never`). O corpo virtual vive em `data-table-virtualized.tsx`; `data-table.tsx` apenas delega (branch mínimo — arquivo já está a 357 LoC, acima do piso de 300: mudanças nele são as MENORES possíveis, allowlist do hook não é necessária pois o hook só bloqueia crescimento em novos writes — validar no T1.2 e, se o hook bloquear a edição, extrair o branch para o módulo novo).

**Rationale:** zero breaking (prop opcional); matriz de exclusão vira contrato de compilação (melhor que doc); ADR 0001-m5 fixa o precedente do split pelo piso de 300; `<Table>` semântica preservada corrige a regressão do dashboard.

**Alternatives considered:** fork `VirtualDataTable` (rejeitado — DoD b2 "sem fork"); flags booleanas soltas com validação só em runtime (rejeitada — erro de dev detectável em compile time); reescrever data-table.tsx para caber tudo (rejeitada — arquivo no limite; risco de regressão nas features atuais).

### D3 — Testes por injeção de `observeElementRect` (consome blueprint ADR D3)

**Decision:** `DataTableVirtualizedOptions` aceita campo interno `virtualizerOptions?` (assinado como `@internal` para testes) que repassa overrides ao `useVirtualizer` — os testes injetam rect sintético.

**Rationale:** mecanismo dos testes oficiais; determinístico; sem mock global frágil. **Alternatives:** mock global de getBoundingClientRect (rejeitado — vaza entre testes); aceitar o piso "não lança" do dashboard (rejeitado — não prova o DoD b3).

### D4 — Wiring triad herdado (precedente M0-M5)

**Decision:** (a) caller = barrel+stories+registry; (b) testes co-localizados; (c) data-slot no DOM (novo: `data-slot="data-table-virtual-body"` + assert do sizer).

**Rationale:** adaptação aprovada em 6 reviews consecutivos. **Alternatives:** tests/integration/ dedicado (rejeitado — followup #5); dispensar (rejeitado).

**Consequences:** check_wiring pillar b segue FAIL de ferramenta, coberto por este ADR.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Primeira dep nova do V1 quebra a promessa copy-paste zero-config do item (risco #2 ROADMAP) | Medium | Declaração explícita no descriptor (modelo shadcn/tanstack confirmado no blueprint Q6); CLI instala automaticamente | Claude |
| Edição em data-table.tsx (357 LoC > piso 300) pode ser bloqueada pelo hook | Medium | D2 prevê fallback: extrair o branch de delegação para o módulo novo; mudanças no arquivo legado são mínimas | Claude |
| jsdom não exercita scroll real — janela testada só com rect injetado | Medium | Padrão dos testes OFICIAIS da dep; matriz manual de scroll documentada na story (mesmo tratamento do M5 risco #2) | Paulo |
| **Sinal M7:** o `virtual-table.tsx` do dashboard (motivador da promoção) tem ZERO callers de produção (verificado 2× em 2026-07-15) — a justificativa do M6 repousa nos casos forward-looking do ROADMAP (audit views, memórias/chunks do theo-rag em escala), decisão humana já tomada no roadmap-init; surfaced ao humano no report | Medium | Feature entra pela demanda futura declarada; M7 deleta o arquivo morto do dashboard (dedup, não migração) | Paulo |
| Dropdown de rowActions desmonta ao sair do overscan | Low | Caveat documentado em JSDoc + story | Claude |
| translateY corrigido por índice depende de rowHeight EXATO (célula maior quebra alinhamento) | Low | Restrição documentada (célula ≤ rowHeight); classe `truncate` recomendada nas células | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
Phase 1 (T1.1 dep+medição → T1.2 tipos+corpo virtual+testes → T1.3 stories) → Phase 2 (T2.1 barrel/tipos → T2.2 registry; T2.3 changelog ∥) → Final Validation
```

## Phase 1: Modo virtualized (TDD)

**Objective:** dep instalada com custo medido + corpo virtual com 14 comportamentos pinados.

### T1.1 — Dependência + medição de bundle

#### Objective
`@tanstack/react-virtual@^3.14.6` instalada; custo de bundle MEDIDO e registrado.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** `pnpm build` baseline (bytes de dist/index.js), `pnpm add @tanstack/react-virtual@^3.14.6`, re-build com um import mínimo temporário? NÃO — a medição honesta vem no T1.2 com o código real; aqui registra-se o baseline e instala-se a dep (audit imediato).
2. **Why now:** o DoD b1 exige análise de custo com número real; o baseline pré-mudança é irrecuperável depois. Cita D1 e o blueprint do M6 (`.claude/knowledge-base/discoveries/blueprints/datatable-virtualized-blueprint.md` — Corner 2).

#### Evidence
Blueprint Corner 2 (números da dep); `package.json` 118 LoC (Baseline).

#### Files to edit
```
package.json — +1 dependency
pnpm-lock.yaml — gerado
```

#### Deep file dependency analysis
- Peers satisfeitos (react 19 no repo). osv-scanner na dep imediatamente (deps-audit do plano já cobre; re-verificar pós-install).

#### Deep Dives
- Baseline registrado no log de implementação: bytes min do `dist/index.js` ANTES; após T1.2, delta = custo real do modo (registrar no summary de implementação, referenciado por este ADR D1).

#### Tasks
1. Baseline build; 2. pnpm add; 3. osv-scanner re-check.

#### TDD
```
RED: test_dep_installed_and_importable() — `node -e "import('@tanstack/react-virtual').then(m => process.exit(m.useVirtualizer ? 0 : 1))"` falha antes do add (gate de ambiente)
GREEN: pnpm add @tanstack/react-virtual@^3.14.6
VERIFY: pnpm test:run && osv-scanner --lockfile=pnpm-lock.yaml
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -c "@tanstack/react-virtual" package.json` == 1
- [ ] `osv-scanner --lockfile=pnpm-lock.yaml` sem advisory nova além das 5 dev-chain conhecidas
- [ ] Baseline de bytes registrado no log de implementação

#### DoD (Definition of Done)
- [ ] `pnpm test:run` exit 0 (regressão 874 intacta)

### T1.2 — Tipos (união discriminada) + corpo virtual + testes

#### Objective
`data-table-virtualized.tsx` (NEW, ≤300) + branch de delegação mínimo + 12 testes novos.

#### Why this step (action + reasoning)
1. **What:** escreve 14 REDs (união de tipos com `@ts-expect-error`, janela exata de 10K com rect injetado, translateY literal, sizer, sort, sticky, edges 0/1 row, dev-warning), implementa o módulo virtual, delega no DataTable, refactor.
2. **Why now:** é o milestone; o RED da janela exata é a prova do DoD b3. Cita D2/D3 e o blueprint do M6 (`.claude/knowledge-base/discoveries/blueprints/datatable-virtualized-blueprint.md` — Q1/Q2/Q4).

#### Evidence
Blueprint Q1 (`.claude/knowledge-base/references/tanstack-virtual/packages/react-virtual/src/index.tsx:230-235`), Q2 (`.claude/knowledge-base/references/tanstack-virtual/examples/react/table/src/main.tsx:132-139` — translateY corrigido), Q4 (`.claude/knowledge-base/references/tanstack-virtual/packages/react-virtual/tests/index.test.tsx:56-59` — injeção de rect); matriz de exclusão (blueprint § Consumer).

#### Files to edit
```
src/components/composites/data-table/data-table.test.tsx — +14 REDs (RED primeiro)
src/components/composites/data-table/data-table-virtualized.tsx — (NEW)
src/components/composites/data-table/data-table.tsx — tipos (união) + branch de delegação MÍNIMO
src/components/composites/data-table/index.ts — +tipo
```

#### Deep file dependency analysis
- `data-table-virtualized.tsx` importa `useVirtualizer` + primitives `Table` locais + `cn`; recebe columns/data/rowKey/sort já resolvidos do wrapper.
- `data-table.tsx`: MENOR diff possível (tipos + `if (virtualized) return <VirtualBody .../>`); os 15 testes atuais são o selo de não-breaking.

#### Deep Dives
- Corpo: container `overflow-auto` com `height` da prop; `<Table>` com `thead sticky top-0`; sizer via `<tbody style={{height: getTotalSize()}}>`? NÃO — sizer é um tr spacer OU o padrão do exemplo (tbody relativo + translateY corrigido por índice nos tr em fluxo). Seguir o EXEMPLO OFICIAL literalmente (blueprint Q2).
- `rowKey` obrigatório no modo (type-level); dev-warning em runtime se `pagination`/`expandable` passados via spread não-tipado.
- `virtualizerOptions` interno `@internal` para injeção de rect nos testes (D3).

#### Pseudo-code / Signatures
```pseudocode
interface DataTableVirtualizedOptions { height: number | string; rowHeight: number; overscan?: number;
  /** @internal test-only */ virtualizerOptions?: Partial<VirtualizerOptions> }
type DataTableProps<T> = BaseProps<T> & (
  | { virtualized?: never; pagination?: PaginationOpts; expandable?: ExpandableOpts }
  | { virtualized: DataTableVirtualizedOptions; pagination?: never; expandable?: never })
```

#### Tasks
1. RED (14); 2. GREEN; 3. REFACTOR.

#### TDD
```
RED: test_virtualized_renders_exact_window_of_10k() — 10.000 rows, viewport 400px/rowHeight 40/overscan 5 com rect injetado → nº de <tr> == ceil(400/40)+2*5 (±1 de borda), não 10.000
RED: test_virtualized_sizer_reflects_total_size() — elemento sizer com height 10.000*40px
RED: test_virtualized_rows_positioned_by_corrected_translate() — 1º tr visível com style transform translateY literal (start − index*size)
RED: test_virtualized_preserves_semantic_table() — table/thead/tbody/tr/td presentes (não divs)
RED: test_virtualized_sticky_header_class() — thead com sticky top-0 dentro do container próprio
RED: test_virtualized_sort_reorders_within_window() — sort asc/desc muda a 1ª linha visível; janela continua exata
RED: test_virtualized_zero_rows_shows_empty_state() — edge: 0 rows → empty state atual (sem virtualizer quebrar)
RED: test_virtualized_single_row_renders() — edge: 1 row
RED: test_virtualized_rejects_pagination_at_type_level() — @ts-expect-error: virtualized + pagination não compila (negative)
RED: test_virtualized_rejects_expandable_at_type_level() — @ts-expect-error: virtualized + expandable não compila (negative)
RED: test_virtualized_dev_warning_on_runtime_conflict() — spread não-tipado com pagination → console.warn em dev (negative runtime)
RED: test_virtualized_dataset_smaller_than_viewport_renders_all() — EC-1 edge: 3 rows em viewport 400px → todas no DOM, sizer correto
RED: test_virtualized_invalid_row_height_dev_warning() — EC-2 negative: rowHeight 0 → console.warn dev + fallback sem crash
RED: test_default_mode_untouched_snapshot() — modo padrão: os 15 testes atuais verdes + este smoke pina que sem `virtualized` NENHUM container de scroll novo aparece
GREEN: implementar data-table-virtualized.tsx + união de tipos + delegação
REFACTOR: extrair helpers puros se o módulo passar de 300
VERIFY: pnpm vitest run src/components/composites/data-table/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/composites/data-table/` reporta 29 passed / 0 failed (15 atuais + 14 novos)
- [ ] `wc -l` ≤ 300 em `data-table-virtualized.tsx`
- [ ] `git diff --stat src/components/composites/data-table/data-table.tsx` mostra diff mínimo (< 60 linhas alteradas)
- [ ] Delta de bytes do `pnpm build` registrado no log (custo real da dep — fecha o ADR D1)

#### DoD
- [ ] `pnpm vitest run src/components/composites/data-table/` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0

### T1.3 — Stories

#### Objective
2 stories novas (Virtualized10K — DoD b3; VirtualizedCompact) + smoke.

#### Why this step (action + reasoning)
1. **What:** stories com dataset determinístico por índice (10.000 linhas — EC-2 do discovery) + matriz manual de scroll real documentada.
2. **Why now:** pilar (a) do D4; Virtualized10K é a evidência visual do DoD b3. Cita blueprint Corner 3.

#### Evidence
Blueprint Corner 3; gerador determinístico (padrão dashboard `virtual-table.test.tsx:16-22`, escalado).

#### Files to edit
```
src/components/composites/data-table/data-table.stories.tsx — +2 stories
src/components/composites/data-table/data-table.test.tsx — +1 smoke
```

#### Deep file dependency analysis
- Stories usam o gerador puro por índice; sem faker/random.

#### Deep Dives
- Axe sweep do Ladle cobre as novas stories automaticamente.

#### Tasks
1. 2 stories; 2. smoke.

#### TDD
```
RED: test_virtualized_10k_story_renders_window() — story Virtualized10K renderiza tabela com < 100 tr no DOM
VERIFY: pnpm vitest run src/components/composites/data-table/ && pnpm typecheck
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0; `pnpm vitest run src/test/ladle-axe.test.tsx` exit 0

#### DoD
- [ ] `pnpm vitest run src/components/composites/data-table/` reporta 30 passed / 0 failed

## Phase 2: Export, registry e docs

**Objective:** superfície pública + registry + CHANGELOG.

### T2.1 — Barrel (tipos)

#### Objective
Export do tipo `DataTableVirtualizedOptions` + smoke de compilação.

#### Why this step (action + reasoning)
1. **What:** RED smoke (import do tipo via barrel em teste `.test-d` style no próprio test file) → export aditivo. 2. **Why now:** padrão M0-M5.

#### Evidence
`src/index.ts` (190 LoC, `5aae67a9` — Baseline).

#### Files to edit
```
src/index.ts — aditivo (tipo)
src/components/composites/data-table/data-table.test.tsx — +1 smoke barrel
```

#### Deep file dependency analysis
- Barrel aditivo only.

#### Deep Dives
(nenhum)

#### Tasks
1. RED; 2. GREEN.

#### TDD
```
RED: test_barrel_exports_virtualized_type() — import type { DataTableVirtualizedOptions } via "../../../index.js" compila e uso em objeto literal passa typecheck
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
`registry/data-table.json` atualizado (dep + 2º file); validate 68 itens.

#### Why this step (action + reasoning)
1. **What:** dep no array `dependencies` + entry `data-table-virtualized.tsx` em `files[]` (RED validate detecta import não declarado) → build+validate; **build é o ÚLTIMO passo antes do commit final** (disciplina M1-M5). 2. **Why now:** DoD b1 (registry declara a dep — risco #2).

#### Evidence
Blueprint Q6 (modelo externo `.claude/knowledge-base/references/data-table-filters/packages/registry/public/r/data-table.json:6-9`); precedente 2-files M5.

#### Files to edit
```
registry/data-table.json — dep + file
```

#### Deep file dependency analysis
- Introspecção do validator exige a dep declarada (comprovado no M4 com lucide).

#### Deep Dives
(nenhum)

#### Tasks
1. RED (validate falha com import novo sem dep declarada); 2. descriptor; 3. build+validate.

#### TDD
```
RED: test_registry_validate_fails_without_declared_dep() — após T1.2, `pnpm registry:build && pnpm registry:validate` exit != 0 sem a dep no descriptor
GREEN: dep + file no descriptor → `pnpm registry:build && pnpm registry:validate` exit 0 (68 itens)
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -c "@tanstack/react-virtual" registry/data-table.json` == 1
- [ ] `pnpm registry:validate` exit 0 (68 itens)

#### DoD
- [ ] `git diff --stat registry/` só a entry + regenerações do build

### T2.3 — CHANGELOG

#### Objective
Entry `[Unreleased] § Added` (modo) + `§ Changed` se aplicável (dep nova é Added do pacote).

#### Why this step (action + reasoning)
1. **What:** entry consumer-facing (Rule 6). 2. **Why now:** ∥ T2.2.

#### Evidence
CHANGELOG (129 LoC — Baseline).

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
RED: test_changelog_mentions_virtualized() — `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém virtualized (gate documental)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -A15 "\[Unreleased\]" CHANGELOG.md` contém virtualized sob § Added

#### DoD
- [ ] `pnpm test:run` exit 0

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | ADR aprovado da dep com análise de custo bundle+registry (M6 DoD b1) | T1.1, T2.2 | ADR D1 (números do blueprint) + medição real no T1.1/T1.2 + declaração no descriptor |
| 2 | Modo virtualized sem breaking, sticky header, alturas fixas, limitações documentadas (M6 DoD b2) | T1.2 | União discriminada + módulo co-localizado + 15 testes atuais verdes + JSDoc de caveats |
| 3 | Prova 10K+ em story + teste (M6 DoD b3) | T1.2, T1.3 | test_virtualized_renders_exact_window_of_10k + story Virtualized10K |
| 4 | Exclusões type-level (risco #1 ROADMAP) | T1.2 | @ts-expect-error tests + dev-warning runtime |
| 5 | DoD padrão da lib | T1.2-T2.2 | 17 testes novos, 2 stories, registry validado |
| 6 | CHANGELOG (Rule 6) | T2.3 | Entry § Added |

**Coverage: 6/6 gaps covered (100%)**

## Global Definition of Done

- [ ] `pnpm test:run` exit 0 (+17 novos + sweep; regressão 874 intacta — inclui os 15 do DataTable atual)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] File-size: `data-table-virtualized.tsx` ≤ 300 LoC (piso do hook)
- [ ] `CHANGELOG.md` atualizado (Rule 6)
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0 (68 itens) — build como último passo
- [ ] Runtime-metric proof — data-slot `data-table-virtual-body` + sizer assertados (D4)
- [ ] `pnpm build` com delta de bytes registrado (fecha ADR D1)
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
