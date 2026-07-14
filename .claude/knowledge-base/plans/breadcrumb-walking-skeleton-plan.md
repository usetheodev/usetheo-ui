---
slug: breadcrumb-walking-skeleton
milestone_id: M0
created_at: 2026-07-14
goal: Ship o primitive Breadcrumb composicional no @usetheo/ui atravessando código → testes → story → registry, provando o pipeline do M0.
---

# Plan: Breadcrumb primitive — walking skeleton (M0)

> **Version 1.1** (2026-07-14 — absorve SHOULD TEST EC-1/EC-2/EC-3 do edge-case review no TDD) — Implementa o primitive `Breadcrumb` (composicional, 7 sub-componentes, anatomia validada pelo blueprint da descoberta) com TDD completo (unit + axe + edge + negative), story, entrada de registry validada, soft-deprecation documentada do `TopNav.Breadcrumbs` e o caminho de adoção no theokit-studio — o walking skeleton que prova o pipeline componente→registry→release→adoção para os milestones M1-M7.

## Goal

Enable os consumidores do `@usetheo/ui` (theokit-studio primeiro) a compor trilhas de navegação hierárquica acessíveis com o primitive `Breadcrumb`, measured by `pnpm test:run` verde incluindo `breadcrumb.test.tsx` (9 comportamentos, axe zero violations) e `pnpm registry:validate` passando com a entry `breadcrumb`.

## Context

ROADMAP.md § M0 (milestone_id M0 no frontmatter) exige o menor componente do escopo atravessando o pipeline inteiro. A descoberta (`blueprint breadcrumb-walking-skeleton`, verdict SHIPPABLE_WITH_CAVEATS 89) fixou: anatomia composicional do shadcn (fonte shipped `registry/new-york-v4/ui/breadcrumb.tsx`), contraponto de API do Mantine (N-1 separadores; não destruir props de filhos), requisitos do consumidor real (studio shell com breadcrumb hand-rolled e bug de a11y — aria-current em todos os itens) e a decisão de convivência com `TopNav.Breadcrumbs` (blueprint ADR D2). Zero dependência nova (parsimony rung 4). Grill do roadmap: `.claude/knowledge-base/grills/data-ui-expansion-roadmap-grill.md` (Q3 fixa DoD padrão por componente; Q6 fixa critério de adoção).

## Baseline Context (deep review of current state)

### Files that will be touched

| File | LoC today | Last commit (sha + date) | Why it exists today | Invariants to preserve |
|---|---|---|---|---|
| `src/components/primitives/breadcrumb/breadcrumb.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/breadcrumb/breadcrumb.test.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/breadcrumb/breadcrumb.stories.tsx` (NEW) | 0 | — | (a criar) | — |
| `src/components/primitives/breadcrumb/index.ts` (NEW) | 0 | — | (a criar) | — |
| `src/index.ts` | 142 | `66a3335b` (2026-07-03) | Barrel de exports públicos dos 54 componentes | Nenhum export existente muda (aditivo only) |
| `src/components/primitives/topnav/topnav.tsx` | 222 | `66a3335b` (2026-07-03) | App bar com sub `TopNav.Breadcrumbs` data-driven embutido | API pública `TopNav.*` INALTERADA (só JSDoc — ADR D2) |
| `registry/breadcrumb.json` (NEW) | 0 | — | (a criar) | — |
| `registry/index.json` | 376 | `66e600d1` (2026-07-03) | Índice do registry shadcn (62 arquivos em registry/) | Entries existentes inalteradas; schema `registry.json` |
| `CHANGELOG.md` | 32 | `eb1d0549` (2026-07-09) | Keep-a-Changelog; `[Unreleased]` vazio hoje | Versões released nunca editadas |

Cross-repo (adoção — fase pós-release, executa no repo theokit-studio): `packages/studio/src/app/shell.tsx` (118 LoC, lido 2026-07-14) — breadcrumb hand-rolled nas linhas 11-30.

### Current callers / dependents

- **Symbol:** `Breadcrumb` (NEW) — zero callers hoje; caller de produção pós-adoção: studio `shell.tsx`.
- **Symbol:** `TopNav.Breadcrumbs` em `src/components/primitives/topnav/topnav.tsx:81-122` — **não modificado** (só JSDoc). Callers: `src/components/primitives/topnav/topnav.test.tsx`, `src/components/primitives/topnav/topnav.stories.tsx` (verificado via grep 2026-07-14). Externo: consumidores do pacote podem usar `TopNav.Breadcrumbs` — por isso D2 proíbe breaking.
- **Symbol:** `safeHref(url)` em `src/lib/safe-href.ts:34` — consumido (não modificado) pelo novo `Breadcrumb.Link`.

### Domain glossary

- **primitive** — componente da camada base da lib (39 hoje), sem composição de outros composites.
- **data-slot** — atributo `data-slot="<nome>"` presente em todo componente; convenção de observabilidade/depuração da lib (o "runtime metric" do wiring triad para UI: presença assertável no DOM).
- **registry item** — descriptor `registry/*.json` (schema shadcn `registry-item.json`) que o `registry:build` infla para `registry/r/*.json` (copy-paste via `npx shadcn add`).
- **asChild** — padrão Radix Slot: o componente delega a renderização ao filho (ex.: `Link` de router) preservando props/classes.

### Architecture boundaries affected

Nenhuma fronteira DIP cruzada (`rules/architecture.md § 1-2`): componente puro de apresentação, sem I/O, sem estado. Superfície pública do pacote cresce em 1 export nomeado (+ tipos) — `architecture.md § 3` (API pública mínima) respeitada: só o namespace `Breadcrumb` é exportado.

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/breadcrumb-walking-skeleton-blueprint.md` — anatomia (§ Coverage Corner 4/Q1), padrões de uso (§ Q2), shape de testes (§ Coverage Corner 1/Q4), deps (§ Q5), registry (§ Q6), decisão TopNav (§ ADR D2 do blueprint). Fonte primária deste plano.
- **Patterns skills:** (nenhuma `*-patterns` instalada — verificado 2026-07-14).
- **Reference projects:** `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:7-99` (anatomia/ARIA); `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.test.tsx:19-28` (assertions N-1 e separador custom).
- **External literature:** WAI-ARIA APG Breadcrumb pattern (https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) — nav com aria-label, aria-current="page" no item corrente.

## Objective

- [ ] `Breadcrumb` + 6 subs (`List/Item/Link/Page/Separator/Ellipsis`) implementados com a anatomia/ARIA da tabela Q1 do blueprint.
- [ ] 9 comportamentos testados (tabela Corner 1 do blueprint): N-1 separadores, separador custom, aria-current only-last, nav label, separador aria-hidden, axe zero violations, edge 1-item, negative safe-href, asChild preserva props.
- [ ] Story com composição canônica + ellipsis + router-link + separador custom.
- [ ] Export no barrel + `registry/breadcrumb.json` + entry no `registry/index.json`; `registry:build` e `registry:validate` verdes.
- [ ] `TopNav.Breadcrumbs` com JSDoc de soft-deprecation apontando o primitive (ADR D2).
- [ ] CHANGELOG `[Unreleased] § Added` com a entry do componente.
- [ ] (pós-release, cross-repo) Studio consumindo `Breadcrumb` em `shell.tsx` com o hand-rolled deletado e o bug de aria-current corrigido.

## ADRs

### D1 — Modelo composicional com namespace via Object.assign

**Decision:** `Breadcrumb` é a raiz `nav`; sub-componentes acoplados como `Breadcrumb.List/Item/Link/Page/Separator/Ellipsis` via `Object.assign` (padrão DropdownMenu/Table da lib), function components finos, sem estado.

**Rationale:** blueprint § Q3 — composição shadcn vence Mantine em a11y (HTML semântico `nav>ol>li`, aria-current tipado) e é o padrão idiomático da lib (KISS; consistência per `architecture.md § 3`). SRP: cada sub tem uma responsabilidade de render.

**Alternatives considered:** API data-driven `items[]` (como TopNav.Breadcrumbs) — rejeitada como API primária: não compõe router-links via asChild nem ellipsis (blueprint ADR D1); modelo Mantine children+prop — rejeitado (cloneElement frágil, sem semântica de página atual).

**Consequences:** consumo mais verboso; studio mapeia `useMatches()` → JSX trivialmente; zero estado = zero testes de concorrência.

### D2 — TopNav.Breadcrumbs: soft-deprecation documentada, sem breaking

**Decision:** `TopNav.Breadcrumbs` permanece intacto; ganha JSDoc `@deprecated`-style nota ("prefira o primitive `Breadcrumb`; este sub será reimplementado sobre ele numa minor futura") sem marcar `@deprecated` formal (evita ruído de lint nos consumidores atuais).

**Rationale:** blueprint ADR D2 — absorção agora = breaking sem demanda (YAGNI/semver). Duplicação é de render, não de conhecimento de negócio (DRY per CLAUDE.md § 12).

**Alternatives considered:** `@deprecated` formal já (gera warnings em consumidores sem rota de migração publicada — rejeitado no M0); absorver o TopNav sobre o primitive já (breaking de comportamento visual em app bar — rejeitado).

**Consequences:** migração interna vira candidata de minor futura; docs apontam o caminho novo desde já.

### D3 — Segurança de href com safeHref no fallback nativo

**Decision:** `Breadcrumb.Link` sem `asChild` passa `href` por `safeHref()` (`src/lib/safe-href.ts`); com `asChild`, a sanitização é do componente do consumidor (Slot repassa props).

**Rationale:** guardrail de segurança (parsimony-ladder § never on the chopping block; error-handling fail-fast); reuso de util existente (rung 4; Don't Reinvent).

**Alternatives considered:** validar também via Slot (impossível sem quebrar o contrato de composição do Radix Slot — o filho é dono das props).

**Consequences:** um negative test pina `javascript:` URL neutralizada (testing.md § 4.1).

### D4 — Wiring triad adaptado a biblioteca de UI

**Decision:** o triad do cycle-implement mapeia assim: (a) caller = story de composição + export no barrel (consumo real vem na adoção pós-release); (b) integration test = teste de composição completa renderizada (lista + ellipsis + asChild com componente externo); (c) runtime metric = assertion dos `data-slot="breadcrumb-*"` no DOM (a convenção de observabilidade da lib — ver glossário).

**Rationale:** biblioteca de componentes não tem counter/histogram de ops; `data-slot` é o mecanismo observável da lib em produção (inspecionável em qualquer consumidor). Precedente: todos os 54 componentes seguem essa convenção.

**Alternatives considered:** exigir métrica de telemetria real (inexistente na lib e YAGNI — rejeitado); dispensar o pilar (viola cycle-implement — rejeitado).

**Consequences:** `check_wiring` do implement valida caller via story/test; o consumo em tela real fecha no T3.1.

### D5 — Pin deliberado de lucide-react 0.x neste plano

**Decision:** o Breadcrumb usa `lucide-react@^0.471.0` já instalado; o bump para 1.x (latest 1.24.0) NÃO faz parte deste plano.

**Rationale:** todos os 54 componentes da lib importam lucide 0.x; migrar major é mudança repo-wide com risco de regressão visual em massa — viola o escopo do walking skeleton (KISS/YAGNI). O deps-audit registra o outdated MAJOR; este ADR é o pin consciente que o golden rule exige.

**Alternatives considered:** bump para 1.x dentro do M0 (rejeitado: escopo explode, risco não relacionado ao objetivo); pin sem ADR (rejeitado: caparia o plano em 89 sem justificativa auditável).

**Consequences:** candidato a chore dedicado pós-M0 (bump lucide 1.x com sweep visual); registrado como follow-up no relatório do deps-audit.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Duplicação temporária de conceito (primitive novo + TopNav.Breadcrumbs) confunde consumidores | Medium | JSDoc de soft-deprecation no TopNav (T2.3) + story do primitive como caminho canônico; migração interna agendada como candidata da próxima minor | Paulo |
| Adoção no studio é cross-repo e depende da release — pode escorregar e o M0 DoD ficar pendurado | Medium | T3.1 explícito no plano com gate: roadmap-run file do M0 só marca `completed` após PR de adoção aberto/merged no studio | Paulo |
| Superfície pública cresce (7 subs) — custo de manutenção/registry por componente | Low | Anatomia congelada na do shadcn shipped (estável há anos); testes pinam ARIA por sub | Claude |
| `registry/index.json` editado à mão pode divergir do descriptor novo | Low | `registry:validate` no DoD de T2.2 e no Global DoD | Claude |

## Unresolved Questions

- Q1 — O studio resolve `@usetheo/ui` por qual canal (GitHub Packages / workspace link)? Afeta só o T3.1 (timing da adoção), não o design. Verificar `.npmrc` do studio na execução do T3.1.

(demais decisões resolvidas em plan time — blueprint cobriu API, a11y, testes, registry e deps)

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `@radix-ui/react-slot` | `^1.1.2` | npm | Padrão asChild do `Breadcrumb.Link` (mesmo uso do Button; package.json:50) |
| `lucide-react` | `^0.471.0` | npm | Ícones default `ChevronRight` (Separator) e `MoreHorizontal` (Ellipsis) (package.json:58) |
| `class-variance-authority` | `^0.7.1` | npm | Não usado pelo Breadcrumb (sem variantes) — listado por transparência; nenhum uso novo |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale (libs evaluated) | Why this one |
|---|---|---|---|---|
| (none) | — | — | Avaliado e rejeitado adicionar dep: react-aria breadcrumbs (peso/stack divergente), Mantine (framework próprio) — blueprint § Q5 confirma zero dep necessária | — |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## Dependency Graph

```
Phase 1 (T1.1 componente+testes → T1.2 story) ──▶ Phase 2 (T2.1 export → T2.2 registry; T2.3 topnav-docs+changelog em paralelo a T2.2)
                                                        │
                                                        ▼
                                              Final Phase (Integration Validation)
                                                        │
                                                        ▼  (pós-release — cross-repo)
                                              Phase 3 (T3.1 adoção studio)
```

Sequencial: T1.1 → T1.2 → T2.1 → T2.2. T2.3 paraleliza com T2.2. Phase 3 bloqueada pela release (fora do halt-loop deste repo).

---

## Phase 1: Primitive + testes (TDD)

**Objective:** Breadcrumb implementado com anatomia/ARIA do blueprint e 9 comportamentos pinados por teste.

### T1.1 — Breadcrumb primitive com TDD completo

#### Objective
Criar `src/components/primitives/breadcrumb/breadcrumb.tsx` com os 7 sub-componentes e todos os testes de comportamento.

#### Why this step (action + reasoning — ReAct discipline)

1. **What:** escreve primeiro `breadcrumb.test.tsx` (RED — 9 comportamentos da tabela Corner 1 do blueprint), depois o componente mínimo que os satisfaz (GREEN), depois refactor de classes/tokens.
2. **Why now:** é a fundação de todo o resto (story, registry, adoção dependem do componente). TDD-first é gate do cycle-implement; a anatomia já está 100% decidida no blueprint (§ Q1) — zero incógnita de design, só execução. Cita ADRs D1/D3/D4 e Baseline rows dos arquivos NEW.

#### Evidence
- Anatomia/ARIA por sub-componente: blueprint § Coverage Corner 4 tabela Q1 (fonte: `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:7-99`).
- Assertions de comportamento: blueprint § Coverage Corner 1 (Mantine test:19-28 + convenção local `src/components/primitives/pagination/pagination.test.tsx:72-75`).
- Util de segurança: `src/lib/safe-href.ts:34` (`safeHref`).

#### Files to edit
```
src/components/primitives/breadcrumb/breadcrumb.test.tsx — (NEW) RED tests primeiro (TDD)
src/components/primitives/breadcrumb/breadcrumb.tsx — (NEW) 7 sub-componentes
src/components/primitives/breadcrumb/index.ts — (NEW) re-export do módulo
```

#### Deep file dependency analysis
- `breadcrumb.test.tsx` (NEW): importa o componente local + `vitest-axe` (mesmo harness de `pagination.test.tsx`, Baseline row). Nenhum downstream.
- `breadcrumb.tsx` (NEW): importa `cn` (`src/lib/cn.ts`), `Slot` de `@radix-ui/react-slot` (package.json:50, mesmo padrão do Button), `ChevronRight`/`MoreHorizontal` de `lucide-react` (package.json:58), `safeHref` (`src/lib/safe-href.ts:34`). Downstream: `src/index.ts` (T2.1), registry (T2.2), story (T1.2).
- `index.ts` (NEW): re-export padrão (mesmo shape de `button/index.ts`).

#### Deep Dives
- **Estrutura:** `Breadcrumb` = `nav[aria-label="breadcrumb"]`; `List` = `ol` flex-wrap; `Item` = `li` inline-flex; `Link` = `a`|Slot com `asChild?: boolean`; `Page` = `span[role=link][aria-disabled=true][aria-current=page]`; `Separator` = `li[role=presentation][aria-hidden]` com `children ?? <ChevronRight/>`; `Ellipsis` = `span[role=presentation][aria-hidden]` + `sr-only "More"`.
- **Invariants:** todos os subs com `data-slot="breadcrumb-*"` (D4); classes só com tokens do preset (`text-muted-foreground`, `text-foreground`, gaps) — zero hex; forwardRef em todos (convenção da lib, ver `topnav.tsx:21-33`).
- **Edge cases:** 1 item só → sem separador, item é `Page`; separador custom via children; lista vazia → `ol` vazio válido (sem crash).
- **Negative:** `Link` nativo com `href="javascript:alert(1)"` → `safeHref` neutraliza (retorna undefined → sem atributo href).

#### Pseudo-code / Signatures

```pseudocode
Breadcrumb(props: ComponentProps<"nav">) -> nav[aria-label=breadcrumb][data-slot=breadcrumb]
BreadcrumbLink({asChild, href, ...}: ComponentProps<"a"> & {asChild?: boolean}):
  if asChild: return <Slot data-slot=breadcrumb-link {...props}/>
  return <a href={safeHref(href)} data-slot=breadcrumb-link .../>
export Breadcrumb = Object.assign(Root, {List, Item, Link, Page, Separator, Ellipsis})

# Example
<Breadcrumb><Breadcrumb.List>
  <Breadcrumb.Item><Breadcrumb.Link href="/">Home</Breadcrumb.Link></Breadcrumb.Item>
  <Breadcrumb.Separator/>
  <Breadcrumb.Item><Breadcrumb.Page>Settings</Breadcrumb.Page></Breadcrumb.Item>
</Breadcrumb.List></Breadcrumb>
```

#### Tasks
1. Escrever `breadcrumb.test.tsx` com os 9 testes RED (lista abaixo) — rodar e confirmar que falham.
2. Implementar `breadcrumb.tsx` mínimo até GREEN.
3. REFACTOR: extrair classes repetidas, conferir tokens-only.
4. Criar `index.ts` re-exportando.

#### TDD
```
RED: renders_nav_with_aria_label_breadcrumb() — raiz é <nav aria-label="breadcrumb">
RED: three_items_render_two_separators() — 3 itens → 2 separadores (Mantine N-1)
RED: custom_separator_children_rendered() — <Separator>·</Separator> renderiza custom N-1 vezes
RED: page_has_aria_current_and_is_not_link() — só o Page tem aria-current="page"; sem href
RED: separator_hidden_from_screen_readers() — role=presentation + aria-hidden
RED: single_item_no_separator() — edge: 1 item → 0 separadores
RED: link_aschild_preserves_child_props_and_classes() — asChild com <a data-x> preserva props/className
RED: link_blocks_javascript_href() — negative: javascript: URL → sem atributo href (safeHref)
RED: axe_no_violations_full_composition() — axe(lista completa com ellipsis) zero violations
RED: empty_list_renders_valid_ol() — edge EC-1: List vazia → nav>ol válido, 0 separadores, axe limpo
RED: link_without_valid_href_renders_without_href_attr() — negative EC-2: href undefined/"" → âncora SEM atributo href (safeHref retorna undefined; safe-href.ts:35-37), sem crash
GREEN: implementar breadcrumb.tsx mínimo
REFACTOR: tokens/classes; nenhum comportamento novo
VERIFY: pnpm vitest run src/components/primitives/breadcrumb/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm vitest run src/components/primitives/breadcrumb/` reporta 11 passed / 0 failed; `axe()` retorna `violations.length === 0`
- [ ] Todos os subs com `data-slot="breadcrumb-*"` assertado em teste (D4 pilar c)
- [ ] Pass: lint — `pnpm lint` zero warnings nos arquivos novos
- [ ] Pass: size — `breadcrumb.tsx` ≤ 500 linhas (esperado ~110, paridade com shadcn)
- [ ] Pass: complexity — componentes sem branches além de `asChild`/`children ??`

#### DoD (Definition of Done)
- [ ] `pnpm vitest run src/components/primitives/breadcrumb/` verde
- [ ] `pnpm typecheck` zero erros
- [ ] `pnpm lint` zero warnings

### T1.2 — Story de composição

#### Objective
`breadcrumb.stories.tsx` com os padrões canônicos de uso.

#### Why this step (action + reasoning)
1. **What:** cria a story com 4 variações: básica, separador custom, ellipsis (+nota de composição com DropdownMenu), router-link via asChild.
2. **Why now:** a story é o pilar (a) do wiring adaptado (D4) e a documentação executável dos padrões do blueprint § Q2; precisa existir antes do registry (T2.2) para o DoD padrão do componente (grill Q3).

#### Evidence
Padrões de uso: blueprint § Q2 (exemplos `.claude/knowledge-base/references/shadcn-ui/apps/v4/examples/radix/breadcrumb-ellipsis.tsx`, `breadcrumb-separator.tsx`). Convenção local: `src/components/primitives/pagination/pagination.stories.tsx` (mesmo formato CSF).

#### Files to edit
```
src/components/primitives/breadcrumb/breadcrumb.stories.tsx — (NEW) 4 stories CSF
```

#### Deep file dependency analysis
- `breadcrumb.stories.tsx` (NEW): importa o componente local; formato CSF idêntico às stories vizinhas (`button.stories.tsx`). Nenhum downstream (stories não entram no build tsup).

#### Deep Dives
- Story `RouterLink` usa um stub `<a>` com asChild (sem dep de router na lib).
- Story `Ellipsis` demonstra colapso; nota aponta composição com o `DropdownMenu` existente (blueprint EC-4: sem re-abrir o fonte dele).

#### Tasks
1. Criar as 4 stories.
2. Conferir render sem erros via teste de smoke da story principal (import na suíte de teste é suficiente — convenção da lib).

#### TDD
```
RED: (coberto por T1.1 — stories não têm suite própria na lib; smoke via import no teste)
VERIFY: pnpm typecheck (stories são type-checked)
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `pnpm typecheck` exit 0 com as 4 stories exportadas em `breadcrumb.stories.tsx`
- [ ] `pnpm lint` exit 0 e `wc -l` ≤ 500 em `breadcrumb.stories.tsx`

#### DoD
- [ ] `pnpm typecheck` + `pnpm lint` verdes

---

## Phase 2: Export, registry e docs

**Objective:** componente publicado na superfície do pacote e no registry, com soft-deprecation do TopNav e CHANGELOG.

### T2.1 — Export no barrel

#### Objective
Exportar `Breadcrumb` (+ tipos de props) em `src/index.ts`.

#### Why this step (action + reasoning)
1. **What:** adiciona `export { Breadcrumb } from "./components/primitives/breadcrumb/index.js";` (+ types) na seção de primitives, ordem alfabética local.
2. **Why now:** sem export não há consumo (pilar a do D4); bloqueia T2.2 (registry aponta para código publicável). Baseline row `src/index.ts` garante mudança aditiva.

#### Evidence
Padrão de export: `src/index.ts:5` (Badge) e `:40` (TopNav) — named exports com sufixo `.js` (ESM).

#### Files to edit
```
src/index.ts — +2 linhas de export (aditivo)
```

#### Deep file dependency analysis
- `src/index.ts` (142 LoC, Baseline): barrel público; mudança puramente aditiva; nenhum export existente tocado (invariant da Baseline row). Downstream: consumidores do pacote e `registry:build`.

#### Deep Dives
(nenhum — mudança mecânica de 2 linhas)

#### Tasks
1. Adicionar export do componente e tipos.

#### TDD
```
RED: import { Breadcrumb } from "../../index" no breadcrumb.test.tsx (um assert de smoke via barrel)
GREEN: export adicionado
VERIFY: pnpm typecheck && pnpm vitest run src/components/primitives/breadcrumb/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `import { Breadcrumb } from "@usetheo/ui"`-shape resolve (via barrel relativo no teste)
- [ ] Zero mudanças em exports existentes (`git diff src/index.ts` só adições)

#### DoD
- [ ] `pnpm typecheck` + `pnpm test:run` verdes

### T2.2 — Registry entry + build + validate

#### Objective
`registry/breadcrumb.json` + entry no `registry/index.json`; artefato `registry/r/breadcrumb.json` gerado e válido.

#### Why this step (action + reasoning)
1. **What:** cria o descriptor (draft pronto no blueprint § Coverage Corner 3), adiciona a entry ao índice e roda `registry:build`/`registry:validate`.
2. **Why now:** o registry é parte do DoD do M0 (ROADMAP § M0) e do DoD padrão por componente (grill Q3); depende do componente (T1.1) e do export (T2.1).

#### Evidence
Draft do descriptor: blueprint § Coverage Corner 3 (mapeado da entry shadcn `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/_registry.ts:71-79` para o schema local `registry/button.json`). Mecânica do build: `scripts/build-registry.ts` (lê `registry/<item>.json` e infla para `registry/r/`).

#### Files to edit
```
registry/breadcrumb.json — (NEW) descriptor conforme draft do blueprint
registry/index.json — +1 entry (name/type/title/description) na lista items
```

#### Deep file dependency analysis
- `registry/breadcrumb.json` (NEW): consumido por `scripts/build-registry.ts` e `validate-registry.ts`. `dependencies: ["@radix-ui/react-slot"]`, `registryDependencies: ["cn", "tailwind-preset"]` (paridade com `registry/button.json`; lucide implícita conferida contra o button.json na execução).
- `registry/index.json` (376 LoC, Baseline): índice; mudança aditiva.

#### Deep Dives
- `files[0].path = "components/primitives/breadcrumb/breadcrumb.tsx"`, `target = "components/ui/breadcrumb.tsx"` (paridade button.json).
- Conferir na execução se button.json declara `lucide-react` em dependencies; espelhar a convenção local (blueprint § Q6).

#### Tasks
1. Criar `registry/breadcrumb.json`.
2. Adicionar entry em `registry/index.json`.
3. `pnpm registry:build` e `pnpm registry:validate`.

#### TDD
```
RED: pnpm registry:validate falha antes do descriptor existir? (validate cobre index↔descriptors; o RED é o validate com entry no index e sem descriptor)
GREEN: descriptor criado; build + validate verdes
VERIFY: pnpm registry:build && pnpm registry:validate
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `registry/r/breadcrumb.json` gerado com o fonte inline
- [ ] `pnpm registry:validate` verde

#### DoD
- [ ] build + validate verdes; diff em `registry/` só aditivo

### T2.3 — Soft-deprecation do TopNav.Breadcrumbs + CHANGELOG

#### Objective
JSDoc no `TopNav.Breadcrumbs` apontando o primitive (D2) e entry no CHANGELOG.

#### Why this step (action + reasoning)
1. **What:** adiciona nota JSDoc acima de `Breadcrumbs` em `topnav.tsx:81` ("Prefer the standalone `Breadcrumb` primitive...") e a entry `[Unreleased] § Added` no CHANGELOG.
2. **Why now:** o DoD do M0 exige a decisão TopNav documentada NO código/CHANGELOG (não só no blueprint); paraleliza com T2.2. Cita ADR D2 e Unbreakable Rule 6.

#### Evidence
`src/components/primitives/topnav/topnav.tsx:81-122` (sub atual); decisão: blueprint § ADR D2; CHANGELOG (32 LoC, `[Unreleased]` vazio — Baseline row).

#### Files to edit
```
src/components/primitives/topnav/topnav.tsx — só JSDoc (zero mudança de runtime)
CHANGELOG.md — entry em [Unreleased] § Added
```

#### Deep file dependency analysis
- `topnav.tsx` (222 LoC, Baseline): callers `topnav.test.tsx`/`topnav.stories.tsx` inalterados (JSDoc não muda runtime — invariant da Baseline row).
- `CHANGELOG.md`: aditivo em `[Unreleased]`.

#### Deep Dives
(nenhum — docs)

#### Tasks
1. JSDoc no sub Breadcrumbs.
2. Entry no CHANGELOG: "Added — `Breadcrumb` primitive (composable trail: List/Item/Link/Page/Separator/Ellipsis)... (#M0)" + nota da soft-deprecation em § Changed.

#### TDD
```
RED: (n/a — documentação; teste existente do topnav segue verde como regressão)
VERIFY: pnpm test:run && pnpm lint
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `git diff topnav.tsx` contém apenas comentário
- [ ] `CHANGELOG.md` contém a entry do Breadcrumb sob `## [Unreleased]` § Added e a nota de soft-deprecation em § Changed (`grep -A6 'Unreleased' CHANGELOG.md`)

#### DoD
- [ ] suite inteira verde; lint verde

---

## Phase 3: Adoção no consumidor (cross-repo, pós-release)

**Objective:** studio consome o primitive em tela real; hand-rolled deletado (M0 DoD bullet 3).

### T3.1 — Substituir o breadcrumb hand-rolled do studio

#### Objective
No repo theokit-studio: `shell.tsx` usa `Breadcrumb` da lib; função local deletada; bug de aria-current corrigido.

#### Why this step (action + reasoning)
1. **What:** troca `shell.tsx:11-30` por composição `Breadcrumb` mapeando `useMatches()`; só o último item vira `Breadcrumb.Page` (corrige o aria-current em todos — bug documentado no blueprint § Consumer requirements); bump da dep `@usetheo/ui` para a versão da release do M0.
2. **Why now:** é a prova de adoção do walking skeleton (grill Q6: "adoção real ≥ 1 consumidor"); só pode rodar após a release desta lib (dependência declarada no Dependency Graph). Executa no repo do studio (fora do halt-loop deste repo) — o roadmap-run file do M0 só fecha com este task done.

#### Evidence
`packages/studio/src/app/shell.tsx:11-30` (hand-rolled + comentário de gap na :12, lido 2026-07-14); handles em `routes.tsx:47`; requisito asChild com `react-router` (blueprint § Consumer requirements).

#### Files to edit
```
(cross-repo) theokit-studio/packages/studio/src/app/shell.tsx — substituir função Breadcrumb local por composição da lib
(cross-repo) theokit-studio/packages/studio/package.json — bump @usetheo/ui
```

#### Deep file dependency analysis
- `shell.tsx` (118 LoC): função local `Breadcrumb` usada apenas dentro do próprio Shell (linha 92) — deleção segura; `shell.test.tsx` existente valida o shell (ajustar assertions de breadcrumb se houver).

#### Deep Dives
- Mapa: `matches.filter(handle.label)` → itens; item estático "Studio" como primeiro `Breadcrumb.Item`; último = `Breadcrumb.Page`; anteriores com `Breadcrumb.Link asChild + <Link to>` quando a rota for navegável, senão `span`.

#### Tasks
1. Bump da dep; 2. Reescrever composição; 3. Deletar função local; 4. Ajustar/adicionar teste do shell (aria-current só no último); 5. PR no repo do studio referenciando M0.

#### TDD
```
RED: shell.test.tsx — assert aria-current="page" APENAS no último item (falha contra o hand-rolled atual)
RED: breadcrumb_shows_only_root_on_bare_route() — edge EC-3: rota sem handle.label → só "Studio", sem separador
GREEN: composição com Breadcrumb da lib
VERIFY: suite do studio (vitest) verde
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -rn 'aria-label="breadcrumb"' packages/studio/src/` retorna 0 ocorrências fora do componente da lib (função local deletada)
- [ ] `shell.test.tsx` asserta `aria-current="page"` presente APENAS no último item (`getAllByRole` + assert de contagem == 1)
- [ ] PR aberto/merged no repo `theokit-studio` com URL registrada em `.claude/knowledge-base/roadmap-runs/M0-2026-07-14.md`

#### DoD
- [ ] Suite do studio verde; roadmap-run M0 atualizado com o link do PR

---

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | Primitive com testes vitest+axe zero violations, story, registry validando (ROADMAP M0 DoD b1; grill Q3) | T1.1, T1.2, T2.2 | Componente TDD + story + descriptor/build/validate |
| 2 | API cobre caso do studio (route handles) e decisão TopNav documentada (ROADMAP M0 DoD b2) | T1.1 (asChild/composição), T2.3 (D2 JSDoc), T3.1 | Composição atende useMatches; convivência documentada em código |
| 3 | Studio consumindo em tela real com hand-rolled deletado (ROADMAP M0 DoD b3; grill Q6) | T3.1 | Substituição + deleção + teste de aria-current |
| 4 | CHANGELOG + docs de props publicados (ROADMAP M0 DoD b4) | T2.3, T1.2 | CHANGELOG Unreleased; stories como docs executáveis + JSDoc de props |
| 5 | Export público mínimo e aditivo (architecture.md § 3) | T2.1 | Barrel aditivo, superfície = 1 namespace |
| 6 | Zero dependência nova (grill Q5/restrições; blueprint Q5) | T1.1 | Slot+lucide já instalados; nenhuma entry nova no package.json |
| 7 | Negative case de segurança de href (testing.md § 4.1; blueprint D3) | T1.1 | Teste link_blocks_javascript_href com safeHref |

**Coverage: 7/7 gaps covered (100%)**

## Global Definition of Done

- [ ] All phases completed (Phase 3 gated pela release — ver Drawback 2)
- [ ] All tests passing — `pnpm test:run` verde
- [ ] Zero type errors — `pnpm typecheck`
- [ ] Zero lint warnings — `pnpm lint`
- [ ] File-size budget respeitado (≤ 500 LoC por arquivo; `rules/architecture.md`)
- [ ] CHANGELOG.md atualizado under `[Unreleased]` (Unbreakable Rule 6)
- [ ] Backward compatibility preserved (exports e TopNav intactos)
- [ ] `pnpm registry:build` + `pnpm registry:validate` verdes
- [ ] Runtime-metric proof — `data-slot="breadcrumb-*"` assertado em teste de composição (D4)
- [ ] Plan archived após merge do PR de release (mover para `knowledge-base/plans/completed/`)

## Failure scenarios (when I/O external)

```
(none — no external I/O touched)
```

## Final Phase: Integration Validation (MANDATORY)

**Objective:** validar a cadeia completa no repo da lib.

### Execution

```
pnpm test:run          # suite inteira (regressão dos 54 componentes + breadcrumb)
pnpm typecheck         # zero type errors
pnpm lint              # biome zero warnings
pnpm registry:build && pnpm registry:validate
pnpm build             # tsup + dts — o pacote compila com o export novo
```

### Acceptance Criteria

- [ ] `pnpm test:run` exit 0 (suite completa — regressão dos 54 componentes)
- [ ] `pnpm typecheck` exit 0 e `pnpm lint` exit 0
- [ ] `pnpm registry:build && pnpm registry:validate` exit 0
- [ ] `pnpm build` gera dist com o export novo (grep `Breadcrumb` em dist)
- [ ] Failure scenarios: `(none — no external I/O touched)` declarado — nada a exercitar

### If Validation Fails

1. Separar falhas causadas pelo plano vs pré-existentes; 2. Corrigir as do plano antes de declarar completo; 3. Re-rodar a cadeia; 4. Pré-existentes documentadas no PR.
