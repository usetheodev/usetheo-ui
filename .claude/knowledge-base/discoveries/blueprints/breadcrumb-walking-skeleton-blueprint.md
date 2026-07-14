# Blueprint: Breadcrumb primitive — walking skeleton (M0)

> **Version 1.0** — Sintetiza como shadcn-ui (fonte shipped do registry) e Mantine implementam, testam e distribuem Breadcrumb, mais os requisitos reais dos dois consumidores internos (theokit-studio shell e o slot `TopNav.Breadcrumbs` da nossa lib). Informa a API, a a11y, o shape de testes e a entrada de registry do primitive `Breadcrumb` do `@usetheo/ui`, e a decisão de convivência com o TopNav (DoD do M0).

**Slug:** `breadcrumb-walking-skeleton`
**Source plan:** `.claude/knowledge-base/discoveries/plans/breadcrumb-walking-skeleton-plan.md` (v1.1)
**Owner:** Paulo + Claude
**Generated:** 2026-07-14 via `/discover-execute` (halt-loop inline, 6 iterações)
**Confidence verdict:** SHIPPABLE_WITH_CAVEATS (89.0 — weighted 100; único cap: `soft_floor_citation_density_low`; 0 citações fabricadas; 4/4 corners) — 2026-07-14

## Context

ROADMAP.md § M0 exige o Breadcrumb ponta a ponta. O theokit-studio hand-rolou um breadcrumb mínimo com comentário explícito de gap; o nosso TopNav embute um conceito de breadcrumbs. Referências clonadas por `/roadmap-init` (catálogo em `.claude/knowledge-base/references/_catalog.md`).

## Objective

Permitir decidir a API completa do primitive `Breadcrumb`, o shape dos testes (unit + axe + negative), a entrada `registry/breadcrumb.json` e a decisão TopNav-vs-Breadcrumb — sem incógnita de design restante para o `/to-plan` do M0.

---

## Coverage Corner 1 — Integration Tests

### Mantine (Q4)

Comportamentos pinados pelo teste do Mantine (fora do harness de system-props, per checkpoint EC-3):

- **Contagem estrutural N/N-1**: com 3 filhos, renderiza exatamente 3 breadcrumbs e **2 separadores** — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.test.tsx:19-23`.
- **Separador customizado renderizado N-1 vezes**: `separator="test-separator"` → `getAllByText` retorna 2 — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.test.tsx:25-28`.
- **className do filho preservada** (composição não destrói props do consumidor) — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.test.tsx:29-39`.
- O resto do arquivo é harness `tests.itSupportsSystemProps` do `@mantine-tests/core` (styles-API machinery — não transferível; EC-3).

### shadcn-ui (Q4)

shadcn não versiona testes unitários por componente; a a11y está **embutida na anatomia** (assertável por nós): `aria-current="page"` no `BreadcrumbPage` — `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:58`; separador `role="presentation" aria-hidden="true"` — `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:73-74`; nav com `aria-label="breadcrumb"` — `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:8`.

### Convenção local (nossa lib)

Padrão a seguir (mesmo shape do Pagination): `vitest` + `vitest-axe`, assertion de `aria-current="page"` no item ativo — `src/components/primitives/pagination/pagination.test.tsx:3` (axe) e `:72-75` (aria-current). Testes de comportamento a pinar no Breadcrumb:

| Comportamento | Tipo | Origem |
|---|---|---|
| N itens → N-1 separadores | unit | Mantine test:19-23 |
| Separador custom via children do `Breadcrumb.Separator` | unit | Mantine test:25-28 + exemplo shadcn |
| Página atual: `aria-current="page"` + não-link | unit/a11y | shadcn breadcrumb.tsx:52-63 |
| `nav[aria-label="breadcrumb"]` na raiz | a11y | shadcn breadcrumb.tsx:7-9 |
| Separador invisível para SR (`aria-hidden`) | a11y | shadcn breadcrumb.tsx:73-74 |
| axe: zero violations (lista completa + ellipsis) | a11y | convenção local pagination.test.tsx |
| Edge: 1 item só (= página atual, sem separador) | edge | testing.md § 4.1 |
| Negative: `href` inválido (`javascript:`) bloqueado | negative | `src/lib/safe-href.ts` (lib local existente) |
| asChild: composição com `<Link>` de router preserva props/classes | unit | shadcn breadcrumb.tsx:34-50 + Mantine test:29-39 |

---

## Coverage Corner 2 — Dependencies

### shadcn-ui (Q5)

| Dependency | Uso | Citation |
|---|---|---|
| `radix-ui` (pacote unificado v4) → só `Slot.Root` | asChild no `BreadcrumbLink` | `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:3,41` |
| `lucide-react` → `ChevronRight`, `MoreHorizontal` | separador default + ellipsis | `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx:2` |

### Mantine (Q5)

Zero deps externas — só machinery interna (`Box`, `factory`, `useStyles` de `../../core`) — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.tsx:1-16`. Não representativo para nós (framework próprio), mas confirma: breadcrumb não precisa de dependência de terceiros.

### Veredito para a nossa lib (parsimony rung 4)

**Zero dependência nova.** `@radix-ui/react-slot@^1.1.2` (`package.json:50`) e `lucide-react@^0.471.0` (`package.json:58`) já instalados. Nosso Button já usa exatamente o mesmo padrão Slot.

---

## Coverage Corner 3 — Tools

### shadcn-ui (Q6) — entrada de registry

Entry do breadcrumb em `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/_registry.ts:71-79`:

```ts
{ name: "breadcrumb", type: "registry:ui", dependencies: ["radix-ui"],
  files: [{ path: "ui/breadcrumb.tsx", type: "registry:ui" }] }
```

Mapeamento para o nosso schema (`registry/button.json` como modelo local — schema `registry-item.json`):

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry-item.json",
  "name": "breadcrumb",
  "type": "registry:ui",
  "title": "Breadcrumb",
  "description": "Hierarchical navigation trail primitive in the Violet Forge design system.",
  "dependencies": ["@radix-ui/react-slot"],
  "registryDependencies": ["cn", "tailwind-preset"],
  "files": [{
    "path": "components/primitives/breadcrumb/breadcrumb.tsx",
    "type": "registry:ui",
    "target": "components/ui/breadcrumb.tsx"
  }]
}
```

Diferenças de convenção: shadcn v4 declara `radix-ui` (pacote unificado); nós declaramos `@radix-ui/react-slot` granular (como o nosso button.json). `lucide-react` não entra em `dependencies` no shadcn (é dep implícita do template) — seguimos a convenção do NOSSO registry (conferir se button.json lista lucide; se não, manter implícita). Validação: `registry:build` + `registry:validate`.

---

## Coverage Corner 4 — Techniques

### Anatomia do componente (Q1)

Anatomia shipped do shadcn — 7 sub-componentes, todos function components finos sobre elementos semânticos (`.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx`):

| Sub-componente | Elemento | ARIA/role | Especial | Citation (linha) |
|---|---|---|---|---|
| `Breadcrumb` | `nav` | `aria-label="breadcrumb"` | raiz | :7-9 |
| `BreadcrumbList` | `ol` | (semântica nativa) | flex-wrap, gap responsivo | :11-22 |
| `BreadcrumbItem` | `li` | — | inline-flex | :24-32 |
| `BreadcrumbLink` | `a` ou Slot | — | `asChild` (Slot.Root) p/ router links | :34-50 |
| `BreadcrumbPage` | `span` | `role="link" aria-disabled="true" aria-current="page"` | página atual não-navegável | :52-63 |
| `BreadcrumbSeparator` | `li` | `role="presentation" aria-hidden="true"` | `children ?? <ChevronRight/>` | :65-81 |
| `BreadcrumbEllipsis` | `span` | `role="presentation" aria-hidden="true"` + `sr-only "More"` | colapso visual | :83-99 |

Todos carregam `data-slot="breadcrumb-*"` — mesma convenção da nossa lib.

### Padrões de uso dos exemplos oficiais (Q2)

- **Ellipsis para colapso**: `BreadcrumbItem > BreadcrumbEllipsis` entre separadores; variante com DropdownMenu no ellipsis para navegar níveis colapsados (composição registrada SEM abrir o fonte do DropdownMenu — EC-4) — `.claude/knowledge-base/references/shadcn-ui/apps/v4/examples/radix/breadcrumb-ellipsis.tsx` e `.claude/knowledge-base/references/shadcn-ui/apps/v4/examples/radix/breadcrumb-dropdown.tsx`.
- **Separador custom por composição**: `<BreadcrumbSeparator><DotIcon/></BreadcrumbSeparator>` — `.claude/knowledge-base/references/shadcn-ui/apps/v4/examples/radix/breadcrumb-separator.tsx`.
- **Router-links via asChild**: `<BreadcrumbLink asChild><Link href="/"/></BreadcrumbLink>` — `.claude/knowledge-base/references/shadcn-ui/apps/v4/examples/radix/breadcrumb-link.tsx` e demais.
- RTL suportado só com classes (`breadcrumb-rtl.tsx`) — nada estrutural.

### Modelo de API: composição (shadcn) vs children+prop (Mantine) (Q3)

| Aspecto | shadcn (composição) | Mantine (children + separator prop) |
|---|---|---|
| API | 7 sub-componentes explícitos | 1 componente, `separator?: ReactNode` (default `'/'`), `separatorMargin` — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.tsx:23-33` |
| Mecânica | consumidor monta a lista | `Children.toArray(...).reduce` interpõe separadores e `cloneElement` nos filhos — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.tsx:82-105` |
| Semântica HTML | `nav>ol>li` completa | `div`s (Box) — sem `nav/ol/li` |
| Página atual | `BreadcrumbPage` com aria-current | não modelado (consumidor resolve) |
| Colapso/ellipsis | primeiro-classe | não modelado |
| Custo | mais verboso | `cloneElement` (frágil com Fragment/strings) e a11y inferior |

**Conclusão:** o modelo de composição do shadcn é superior em a11y (HTML semântico + aria-current de primeira classe) e é o padrão da nossa lib (Table, DangerZone, Sidebar usam sub-componentes). O do Mantine informa dois cuidados: pinar N-1 separadores em teste e não destruir props dos filhos.

---

## Consumer requirements (paths absolutos — per ADR D3 do plano; estado em 2026-07-14)

### theokit-studio (caso real do M0 DoD)

Hand-rolled em `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/app/shell.tsx:11-30`, com comentário de gap na linha 12. Requisitos observados:

1. Deriva itens de `useMatches()` do react-router lendo `handle.label` (handles declarados em `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/app/routes.tsx:47`) → o dado chega como **array de labels** ; o componente da lib precisa aceitar itens dinâmicos (map), não JSX fixo.
2. Item raiz estático ("Studio") sem link + itens correntes com `aria-current="page"` (o hand-rolled marca TODOS os itens como current — **bug de a11y** que a adoção corrige: só o último deve ter aria-current).
3. Separador textual `/` — o default `ChevronRight` do shadcn atende; separador custom via composição cobre o `/` se o studio quiser manter.
4. Router: react-router v7 (`Link` de `react-router`) → `asChild` obrigatório no `Breadcrumb.Link`.

### TopNav.Breadcrumbs da nossa lib (decisão convivência/absorção — DoD M0)

`src/components/primitives/topnav/topnav.tsx:72-122`: sub-componente data-driven (`items: {label, href?}[]`), `nav[aria-label="Breadcrumb"]`, `aria-current` correto no último (:108), ChevronRight aria-hidden (:114). Limitações vs primitive novo: sem `asChild` (só `href` string — não integra router SPA sem full reload), sem ellipsis, sem página-atual tipada, casing do aria-label divergente ("Breadcrumb" vs "breadcrumb").

**Proposta (ADR D2 abaixo):** criar o primitive standalone `Breadcrumb` composicional; `TopNav.Breadcrumbs` passa a ser **wrapper deprecated-soft** (mantido por compat, documentado para migrar) OU reimplementado por cima do primitive na próxima major. Absorção imediata quebraria a API do TopNav sem necessidade (YAGNI + semver).

---

## Cross-cutting Comparison

| Dimension | shadcn-ui | Mantine | TopNav.Breadcrumbs (interno) |
|---|---|---|---|
| Modelo de API | composição, 7 sub-componentes (`ui/breadcrumb.tsx:101-109`) | children + `separator` prop (`Breadcrumbs.tsx:23-33`) | data-driven `items[]` (`topnav.tsx:72-79`) |
| Semântica HTML | `nav>ol>li` | `div`s | `nav` plano (sem ol/li) |
| aria-current | `BreadcrumbPage` (:58) | não modelado | último item (:108) |
| Ellipsis/colapso | primeira classe (:83-99) | não | não |
| Router integration | `asChild`/Slot (:41) | cloneElement | só href string |
| Deps | Slot + lucide (:2-3) | zero externas | zero (lucide já interno) |
| Teste | anatomia a11y (sem unit próprio) | N-1 separadores, custom separator (test:19-28) | coberto em topnav.test.tsx |

## ADRs

### D1 — Adotar o modelo composicional do shadcn (7 sub-componentes via Object.assign)

**Decision:** `Breadcrumb` primitive com sub-componentes `Breadcrumb.List/Item/Link/Page/Separator/Ellipsis` (namespace via `Object.assign`, padrão da lib — como DropdownMenu/Table), anatomia e ARIA idênticos ao shipped do shadcn.

**Rationale:** melhor a11y (HTML semântico, aria-current tipado, separador aria-hidden — breadcrumb.tsx:7-99), consistência com o padrão composicional da lib, e o modelo do Mantine exige `cloneElement` (frágil) sem modelar página atual nem colapso (Q3). KISS: function components finos, zero estado.

**Alternatives considered:** (a) API data-driven `items[]` como TopNav.Breadcrumbs — rejeitada como API primária: não compõe com router links (asChild) nem ellipsis; PODE ser oferecida depois como conveniência sobre a composicional se 2+ consumidores pedirem (YAGNI agora). (b) Modelo Mantine — rejeitado (Q3, a11y inferior).

**Consequences:** consumidores montam a lista (verboso porém explícito); studio mapeia `useMatches()` para JSX trivialmente.

### D2 — TopNav.Breadcrumbs convive (soft-deprecation documentada), sem breaking no M0

**Decision:** o primitive novo NÃO absorve nem quebra `TopNav.Breadcrumbs` no M0. O TopNav ganha nota de docs apontando o primitive como caminho preferido; migração interna do TopNav para compor o primitive fica para uma minor futura sem mudança de API pública.

**Rationale:** absorção imediata = breaking sem demanda (YAGNI; semver). A duplicação é de RENDER, não de conhecimento de negócio (DRY § regra: duplicar código ≠ duplicar lógica de negócio); o custo de manter os dois até a migração é baixo e o M0 é walking skeleton — escopo mínimo.

**Alternatives considered:** (a) absorver já (breaking no TopNav — rejeitado no M0); (b) deletar TopNav.Breadcrumbs (breaking pior); (c) primitive como sub do TopNav (acopla navegação de página a um app-bar — errado).

**Consequences:** decisão de convivência documentada satisfaz o DoD M0; issue de migração fica registrada no plano do M0 para a minor seguinte.

### D3 — Segurança de href no Breadcrumb.Link

**Decision:** `Breadcrumb.Link` passa `href` por `safe-href` (lib local `src/lib/safe-href.ts`) quando renderiza `<a>` nativo; com `asChild`, a responsabilidade é do componente do consumidor (router Link).

**Rationale:** guardrail de segurança da parsimony ladder ("never on the chopping block"); a lib já tem o utilitário (rung 4 — reuso). Negative-case test correspondente exigido por `rules/testing.md § 4.1`.

**Alternatives considered:** validar sempre inclusive via Slot (impossível sem quebrar composição — o Slot repassa props ao filho).

**Consequences:** um negative test pina o comportamento (`javascript:` URL → neutralizada).

## Recommendations for the project

| # | Recommendation | Linked to | Priority |
|---|---|---|---|
| 1 | Implementar `Breadcrumb` composicional (7 subs, ARIA por linha da tabela Q1) em `src/components/primitives/breadcrumb/` | Q1, Q2, D1, architecture.md § 3 | HIGH |
| 2 | Testes: 9 comportamentos da tabela do Corner 1 (unit + axe + edge 1-item + negative safe-href) | Q4, D3, testing.md § 3-4.1 | HIGH |
| 3 | `registry/breadcrumb.json` conforme draft do Corner 3; `registry:build` + `registry:validate` verdes | Q6 | HIGH |
| 4 | Zero dependência nova (Slot + lucide já instalados) | Q5, parsimony-ladder rung 4 | HIGH |
| 5 | Docs do TopNav.Breadcrumbs apontando o primitive (soft-deprecation D2); story de composição com ellipsis + router-link | Q3, D2 | MEDIUM |
| 6 | Adoção no studio: substituir shell.tsx:11-30 (corrigindo o aria-current em todos os itens) | Consumer req., M0 DoD | HIGH |

## Blocked questions (if any)

(none — 6/6 respondidas)

## Halt-loop progress (audit trail)

- Iterations used: 6 (inline; uma por questão — Q1..Q6 + consumer requirements na mesma passada de leitura)
- Questions answered: 6 / 6
- Questions blocked: 0
- Citations verified: ver sanity check pós-promise no relatório da fase
- Promise emitted at iteration: 6

## Related

- Discovery plan: `.claude/knowledge-base/discoveries/plans/breadcrumb-walking-skeleton-plan.md`
- Confidence report: `.claude/knowledge-base/reviews/breadcrumb-walking-skeleton-confidence-2026-07-14.md` (gerado por `/discover-confidence`)
- Project rules: `.claude/rules/architecture.md`, `.claude/rules/testing.md`, `.claude/rules/parsimony-ladder.md`
