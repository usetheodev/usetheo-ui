# Discovery Plan: Breadcrumb primitive — walking skeleton (M0)

> **Version 1.1** (2026-07-14 — absorve MUST FIX EC-1/EC-2 do edge-case review; fonte canônica corrigida para `registry/new-york-v4/ui/`) — Investigar como as referências SOTA (shadcn-ui, mantine) implementam, testam e distribuem um componente Breadcrumb, e levantar os requisitos reais dos dois consumidores internos (theokit-studio shell + slot de breadcrumbs do nosso TopNav), para produzir um blueprint que fixe a API, a a11y e a entrada de registry do primitive `Breadcrumb` do `@usetheo/ui` — o walking skeleton do milestone M0 do ROADMAP.

**Slug:** `breadcrumb-walking-skeleton`
**Owner:** Paulo + Claude
**Created:** 2026-07-14
**Time budget:** 3h (per-project breakdown in ADR D1)

## Context

O ROADMAP.md § M0 exige o `Breadcrumb` atravessando o pipeline inteiro (código → testes → story → registry → release → adoção no studio). O theokit-studio hand-rolou um breadcrumb por falta do componente (comentário em `packages/studio/src/app/shell.tsx`: "@usetheo/ui doesn't have Breadcrumb yet"), e o nosso `TopNav` (`src/components/primitives/topnav/topnav.tsx`) já tem um conceito de breadcrumbs embutido — o M0 DoD exige decisão documentada de convivência ou absorção. As referências foram clonadas pelo `/roadmap-init` (ver `.claude/knowledge-base/references/_catalog.md`).

Regras do projeto que este plano consome: `rules/testing.md` (§ 3 — todo comportamento com teste; § 4.1 edge + negative cases), `rules/parsimony-ladder.md` (rungs 2-5 — zero dependência nova esperada para breadcrumb), `rules/architecture.md` (§ 3 — API pública mínima).

## Objective

Produzir um blueprint que permita decidir a API completa do primitive `Breadcrumb` (sub-componentes, props, a11y, separadores, colapso/ellipsis), o shape dos testes (unit + axe), a entrada `registry/breadcrumb.json` e a decisão TopNav-vs-Breadcrumb — sem nenhuma incógnita de design restante para o `/to-plan` do M0.

- [ ] All research questions in this plan answered with citations to `.claude/knowledge-base/references/`
- [ ] Cross-cutting comparison table populated for every in-scope reference project
- [ ] Recommendations section provides at least one concrete decision proposal per in-scope research question
- [ ] `/discover-confidence` verdict ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/shadcn-ui/` | `apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` (fonte que o registry distribui, per `_registry.ts:71-76`), `apps/v4/registry/new-york-v4/ui/_registry.ts`, `apps/v4/examples/radix/breadcrumb-*.tsx` | Receita canônica do modelo registry copy-paste que seguimos (catalog: supports M0) |
| `.claude/knowledge-base/references/mantine/` | `packages/@mantine/core/src/components/Breadcrumbs/` | API madura validada por comunidade grande; testes de referência (catalog: design de props) |
| (interno) `src/components/primitives/topnav/` + `registry/` | `topnav.tsx`, `registry/button.json` (modelo de entry) | Decisão de convivência/absorção do DoD M0; convenções locais de registry |
| (consumidor externo) `theokit-studio/packages/studio/src/app/` | `shell.tsx`, `routes.tsx` | Caso real que o M0 DoD manda cobrir (route handles) |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/shadcn-ui/apps/v4/styles/*` (todos, incl. `radix-nova`) | Variantes temáticas; a fonte shipped é `registry/new-york-v4/ui/` — `diff` confirmou que `radix-nova` DIFERE dela (EC-1; ADR D2) |
| `.claude/knowledge-base/references/shadcn-ui/apps/v4/app/` (site de docs) e `.claude/knowledge-base/references/shadcn-ui/apps/v4/content/` | Páginas/conteúdo do site de docs, não fonte do componente |
| `.claude/knowledge-base/references/base-ui/` | Não tem componente breadcrumb (verificado em `packages/react/src/` — pattern WAI-ARIA de breadcrumb é nav+aria-current, sem state machine; base-ui não agrega aqui) |
| `.claude/knowledge-base/references/{tremor,react-json-view,react-dropzone,tanstack-virtual,data-table-filters}/` | Suportam M2-M6, não M0 |
| `.claude/knowledge-base/references/mantine/` fora de `Breadcrumbs/` | Fora do alvo; budget |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** shadcn-ui: 1.5h; mantine: 1h; interno+studio: 0.5h. Total 3h.

**Rationale:** shadcn é a referência primária (mesmo modelo de distribuição registry — maior transferência); mantine é contraponto de API; o código interno/consumidor é pequeno e conhecido. Alternativas consideradas: split igual (desperdiça budget em mantine), deep-dive só shadcn (perde o contraponto de API que evita YAGNI).

**Stop condition — per question (mandatory):** quando a Fase A de uma questão retornar vazio após 3 variantes de query (pattern → kind → path alternativo → escopo mais amplo), marcar a questão BLOCKED com razão "Fase A exhausted" e seguir para a próxima. Não preencher com hotspots de outra questão.

**Stop condition — per project (mandatory):** budget do projeto exaurido com questões pendentes → marcar todas as restantes daquele projeto BLOCKED ("budget exhausted") e avançar. Se todos os projetos ficarem nesse estado, emitir `<promise>BLUEPRINT_BLOCKED</promise>` com o relatório honesto — nunca `BLUEPRINT_COMPLETE` com questões bloqueadas.

**Anti-pattern:** NUNCA fabricar respostas de Fase B para fechar questão com Fase A exaurida (Unbreakable Rule 3).

**Consequences:** blueprint pode sair com questões BLOCKED explícitas; elas viram seed da próxima descoberta.

### D2 — Investigation depth: a fonte shipped do registry, não styles temáticos (v1.1, per EC-1)

**Decision:** ler apenas `apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` — o arquivo que a entry `_registry.ts:71-76` efetivamente distribui — mais os exemplos `apps/v4/examples/radix/breadcrumb-*.tsx`. Ignorar TODOS os `apps/v4/styles/*` (verificado: `radix-nova` difere do shipped).

**Rationale:** o que importa para nossa lib é o componente que os consumidores do registry recebem, não variantes temáticas; ler todos os styles viola KISS/budget sem informação estrutural. Alternativas: radix-nova (rejeitado após diff — EC-1), diff entre múltiplos styles (custo sem benefício).

**Consequences:** se o blueprint precisar de detalhe de um style temático, é follow-up explícito.

### D3 — Consumidor externo lido, não citado como referência

**Decision:** `theokit-studio` é lido via path absoluto (read-only) para levantar requisitos, mas NÃO entra como citação `knowledge-base/references/` no blueprint — entra como seção "Consumer requirements" com paths absolutos.

**Rationale:** o golden rule de citações valida paths sob `references/`; o studio não é material de estudo clonado, é consumidor vivo. Alternativas: clonar o studio para references/ (errado — é nosso repo irmão, não peer SOTA).

**Consequences:** o blueprint distingue "evidência SOTA" (references/) de "requisito de consumidor" (paths absolutos do monorepo).

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read at each hotspot) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Qual a anatomia exata do Breadcrumb do shadcn (sub-componentes, elementos HTML, atributos ARIA, asChild, data-slots)? | techniques | `.claude/knowledge-base/references/shadcn-ui/` | Grep `function Breadcrumb` em `apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` para listar todos os sub-componentes exportados | Read do arquivo inteiro; capturar por sub-componente: elemento, aria-*, classes, composição Slot | Tabela: sub-componente → elemento → aria/role → props especiais, com `path:line` por linha |
| Q2 | Como o shadcn resolve colapso de níveis (ellipsis) e separador customizado, e o que os exemplos oficiais mostram como uso canônico? | techniques | `.claude/knowledge-base/references/shadcn-ui/` | Glob `apps/v4/examples/radix/breadcrumb-*.tsx` (7 exemplos verificados: basic, link, separator, ellipsis, dropdown, rtl, demo) | Read de cada exemplo; capturar padrões de composição (ellipsis+dropdown, separador custom, RTL) | Lista de padrões de uso com citação por exemplo |
| Q3 | Que API o Mantine `Breadcrumbs` expõe (props, separador como prop vs composição, styles API) e o que isso ensina sobre o mínimo viável? | techniques | `.claude/knowledge-base/references/mantine/` | Grep `interface BreadcrumbsProps` em `packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.tsx` | Read de `Breadcrumbs.tsx` completo; contrastar modelo "children + separator prop" (Mantine) vs "sub-componentes compostos" (shadcn) | Comparação dos dois modelos de API + recomendação para a nossa lib (que usa composição shadcn-style) |
| Q4 | Que comportamentos os testes de referência pinam para breadcrumb (contagem de separadores, aria-current, keyboard) e o que nosso teste deve cobrir (incl. axe + negative cases)? | tests | `.claude/knowledge-base/references/mantine/` | Glob `packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.test.tsx` (verificado) + Grep `aria-current` em `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` | Read do test file inteiro; mapear cada assertion; cruzar com a convenção local (`src/components/primitives/pagination/` usa aria-current + axe via vitest-axe) | Lista de comportamentos → assertion, marcando edge cases (1 item, item único = página atual) e negative cases (href inválido → safe-href) |
| Q5 | Quais dependências um Breadcrumb realmente exige? (expectativa: zero além de `@radix-ui/react-slot` + `lucide-react`, ambos já instalados) | deps | `.claude/knowledge-base/references/shadcn-ui/`, `.claude/knowledge-base/references/mantine/` | Grep `^import` em `apps/v4/registry/new-york-v4/ui/breadcrumb.tsx`; Grep `import` em `packages/@mantine/core/src/components/Breadcrumbs/Breadcrumbs.tsx` | Read dos imports em contexto; conferir contra nosso `package.json` (parsimony rung 4 — reusar deps instaladas) | Tabela: dep → já instalada? → veredito (esperado: nenhuma dep nova) |
| Q6 | Como o shadcn declara o item breadcrumb no registry (files, dependencies, registryDependencies, type) e como isso mapeia para o nosso formato `registry/*.json`? | tools | `.claude/knowledge-base/references/shadcn-ui/` | Read `apps/v4/registry/new-york-v4/ui/_registry.ts` no bloco `name: "breadcrumb"` (linha ~71; verificado 2026-07-14 — `directory.json` NÃO contém breadcrumb, per EC-2) | Read da entry + Read do nosso `registry/button.json` como modelo local; mapear campo a campo (nosso schema JSON é o alvo; a entry TS do shadcn é inspiração de campos — EC-5) | Draft do `registry/breadcrumb.json` + diffs de convenção entre shadcn e nosso `registry:build` |

**Consumer requirements (fora do orçamento de questões, seção obrigatória do blueprint por D3):** Read de `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/app/shell.tsx` e `routes.tsx` (breadcrumb hand-rolled + route handles) e de `src/components/primitives/topnav/topnav.tsx` (slot de breadcrumbs atual) → requisitos concretos + proposta de convivência/absorção exigida pelo DoD do M0.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4 | Covered |
| Dependencies | Q5 | Covered |
| Tools | Q6 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop Checkpoints

| Checkpoint | Assertion | Action if fails |
|---|---|---|
| Before answering Qx | Path declarado na Fase A existe (todos pré-validados em 2026-07-14) | Mark Qx BLOCKED "path not found", continue |
| Per-question Fase A budget | Fase A retornou ≥ 1 hotspot OU 3 variantes tentadas | Após 3 retries vazios, BLOCKED "Fase A exhausted"; continue |
| After answering Qx | Seção do blueprint de Qx tem ≥ 1 citação `references/` (exceto Consumer requirements, per D3) | Re-iterar Qx (1 retry max) |
| Mid-loop sanity | Citações a `.claude/knowledge-base/references/` ≥ 1 / 200 palavras de prosa | Adicionar citações (1 retry max) |
| Per-project time budget | Budget do projeto não exaurido (D1) | BLOCKED "budget exhausted" nas restantes; próximo projeto |
| Q4 behavior-only (EC-3) | Resposta de Q4 lista ≥ 2 assertions de COMPORTAMENTO extraídas fora do harness `tests.itSupportsSystemProps` do `@mantine-tests/core` | Re-iterar Q4 focando nas assertions de comportamento (1 retry max) |
| Q2 anti scope-creep (EC-4) | Ao ler `breadcrumb-dropdown.tsx`/`breadcrumb-ellipsis.tsx`, registrar a composição (breadcrumb + DropdownMenu) SEM abrir fontes dos componentes compostos | Cortar a digressão; DropdownMenu já existe na nossa lib |
| Before promising complete | 4 coverage corners populados + seção Consumer requirements presente | Recusar promise, continuar iterando |

## Acceptance Criteria

- [ ] All research questions answered OR explicitly marked BLOCKED with reason
- [ ] All four coverage corners have populated sections in the blueprint
- [ ] Every citation in the blueprint points to a real `.claude/knowledge-base/references/{...}` path
- [ ] Seção "Consumer requirements" com a decisão TopNav-vs-Breadcrumb proposta (insumo direto do DoD M0)
- [ ] At least one ADR section in the blueprint synthesizes decisions taken
- [ ] Time budget respected per project
- [ ] `/discover-confidence` verdict ≥ SHIPPABLE_WITH_CAVEATS
- [ ] Blueprint saved at `.claude/knowledge-base/discoveries/blueprints/breadcrumb-walking-skeleton-blueprint.md`

## Global Definition of Done

- [ ] All phases completed (plan → edge-cases → execute → confidence → improve if needed → confidence re-score)
- [ ] Final `/discover-confidence` verdict recorded in the blueprint header
- [ ] No fabricated citations
- [ ] Coverage Matrix 100% covered
- [ ] ADRs reference at least one principle from project rules (D1→Rule 3/honestidade; D2→KISS; D3→arquitetura de fronteiras; Q5→parsimony-ladder rung 4; Q4→testing.md § 4.1)
