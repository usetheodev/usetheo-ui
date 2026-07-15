# Discovery Plan: DataTable virtualizado — promoção do virtual-table (M6)

> **Version 1.1** (2026-07-15 — absorve EC-1/EC-2; EC-3 documentado) — Estudar o `@tanstack/react-virtual` clonado (react-virtual 255 LoC sobre virtual-core 2029 LoC; exemplo oficial de table; testes oficiais) e o `virtual-table.tsx` do dashboard (128 LoC, produção, consumidor da MESMA dep) para fixar: o ADR da única dependência nova do V1 (custo de bundle + copy-paste do registry), o desenho do modo `virtualized` do `DataTable` existente SEM breaking (modos mutuamente exclusivos com expandable/paginação) e o shape de testes de virtualização em jsdom (sem layout real).

**Slug:** `datatable-virtualized`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 2.5h (ADR D1)

## Context

ROADMAP § M6 (deps: M0 ✅; recomendado após M3-M5 ✅ — padrão de promoção rodado 3×). Pré-staging durante o gate do PR #6 (M5/0.21.0) — artefatos `.claude/` apenas, não commitados até o merge (ADR D4 da família). DoD: (b1) ADR aprovado para `@tanstack/react-virtual` (única dep nova do V1) com análise de custo; (b2) `DataTable` com opção de virtualização (sticky header, alturas fixas; limitações documentadas) sem breaking; (b3) prova com 10K+ linhas em story + teste.

Estado local (verificado): `src/components/composites/data-table/data-table.tsx` tem **357 LoC — já acima do piso de 300 do hook** (`MAX_FILE_LINES=300`; lição M5/ADR 0001-m5 + followup #10): o modo virtualizado NASCE em módulo próprio co-localizado, nunca inline. Fonte a absorver: dashboard `virtual-table.tsx` (128 LoC, fixed rowHeight + overscan + sticky via container, 3 testes).

Regras consumidas: `rules/parsimony-ladder.md` rung 4 (dep NÃO instalada — o ADR dep é o coração do milestone, com processo do deps-audit), `rules/architecture.md § 3` (superfície pública mínima; sem fork), `rules/testing.md § 4.1`.

## Objective

Blueprint que fixe: API do useVirtualizer usada no recorte (count/getScrollElement/estimateSize/overscan/getVirtualItems/getTotalSize + measureElement?), o padrão sticky-header com translateY/padding, a matriz de exclusão mútua com features do DataTable atual, o custo REAL da dep (LoC/bundle/transitivas), como o registry declara a dep (modelo shadcn/tanstack) e como TESTAR virtualização em jsdom.

- [ ] All research questions answered with citations
- [ ] Cross-cutting comparison table populated (tanstack example × dashboard virtual-table × nosso modo)
- [ ] ADR da dependência com números (evidência para o DoD b1)
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/tanstack-virtual/` | `packages/react-virtual/src/index.tsx`, `packages/react-virtual/package.json`, `packages/react-virtual/tests/index.test.tsx`, `examples/react/table/src/main.tsx`, `packages/virtual-core/src/index.ts` (API surface apenas — grep, não leitura integral de 2029 LoC) | A dep candidata em si: API, testes oficiais (como mockam layout), exemplo canônico de table |
| `.claude/knowledge-base/references/data-table-filters/` | uso de virtualização/tanstack se existir (grep exploratório; ausência registrada honestamente) | Segunda referência de padrões de table em produção |
| (interno) | `src/components/composites/data-table/` (357 LoC — API atual, features a proteger), `registry/data-table.json` | Baseline do não-breaking + modelo de registry |
| (consumidor externo — ADR D3 da família) | dashboard `src/components/data/virtual-table.{tsx,test.tsx}` | Produção real com a MESMA dep — o padrão a absorver |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `tanstack-virtual/packages/{angular,vue,svelte,solid,lit,marko}-virtual/`, `benchmarks/`, `docs/` como fonte primária | Só o adapter react importa; docs usados apenas se o código não responder |
| Leitura integral de `virtual-core/src/index.ts` (2029 LoC) | Budget; só a superfície consumida pelo adapter react (grep dirigido) |
| Alturas de linha variáveis (`measureElement`/ResizeObserver por linha) | DoD fixa "alturas de linha fixas"; anotar como fronteira documentada |
| Expandable rows virtualizadas | DoD exclui explicitamente; matriz de exclusão mútua documenta |
| Virtualização horizontal / colunas | Fora do DoD |
| `@tanstack/react-table` (a table headless) | Nosso DataTable já existe; só a VIRTUALIZAÇÃO entra |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** react-virtual src+tests 0.75h; exemplo table 0.25h; virtual-core surface (grep) 0.25h; data-table-filters (exploratório) 0.25h; interno DataTable+registry 0.5h; consumidor dashboard 0.25h; síntese 0.25h. Total 2.5h.

**Rationale:** o adapter react (255 LoC) + testes oficiais são a fonte mais densa (API real + como testar sem layout); o exemplo de table dá o padrão de render. Alternativas: ler virtual-core inteiro (rejeitada — 2029 LoC, o adapter esconde o que não usamos), confiar só no dashboard (rejeitada — 1 consumidor não mostra a API completa nem os testes oficiais).

**Stop condition — per question (mandatory):** Fase A vazia após 3 variantes de grep → BLOCKED; próxima questão.

**Stop condition — per project (mandatory):** budget exaurido → restantes BLOCKED; todos exauridos → `<promise>BLUEPRINT_BLOCKED</promise>` — nunca COMPLETE parcial.

**Anti-pattern:** fabricar Fase B (Unbreakable Rule 3).

### D2 — A dep é candidata, não decidida; o ADR final sai do blueprint com números

**Decision:** o estudo produz a evidência (LoC, transitivas, bundle estimado, modelo de registry) e o ADR do blueprint decide dep-vs-own; o ROADMAP já aponta a dep como candidata aprovada, mas o número fecha no blueprint (mesmo processo do M5, resultado potencialmente oposto).

**Rationale:** virtualização correta (scroll math, overscan, RTL, scroll restoration, momentum do iOS) é uma classe de problema comprovadamente difícil — o oposto do dropzone (superfície pequena); Rule 9 aponta dep. Mas a decisão precisa dos números para o DoD b1.

**Alternatives considered:** decidir já (rejeitada — o DoD b1 exige análise de custo documentada); implementar virtualização própria (avaliada na Q5 com estimativa honesta de LoC/risco).

### D3 — Consumidores externos lidos, não citados como referência

**Decision:** dashboard via path absoluto em "Consumer requirements" (ADR D3 da família M0-M5).

### D4 — Nenhum commit até o merge do PR #6

**Decision:** artefatos desta descoberta ficam UNCOMMITTED até o merge (precedente M4/M5).

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Qual a API do `useVirtualizer` que o recorte table usa (options: count/getScrollElement/estimateSize/overscan; returns: getVirtualItems/getTotalSize/measureElement) e o que o adapter react adiciona ao core (re-render binding)? | techniques | `.claude/knowledge-base/references/tanstack-virtual/` | Grep `useVirtualizer\|getVirtualItems\|getTotalSize` em `packages/react-virtual/src/index.tsx` | Read `packages/react-virtual/src/index.tsx` (255 LoC integral) | Superfície mínima consumida + o contrato de re-render |
| Q2 | Como o exemplo oficial de table renderiza linhas virtuais (posicionamento translateY vs padding, sticky header, container com altura fixa) e o que muda para `<table>` semântica vs divs? | techniques | `.claude/knowledge-base/references/tanstack-virtual/` | Read `examples/react/table/src/main.tsx` | Extrair o padrão de render + sticky | Padrão de markup transferível para o nosso Table semântico |
| Q3 | O data-table-filters usa virtualização/tanstack-virtual em produção? Que padrões de table (sticky, overscan) ele fixa? (ausência é resposta válida) | techniques | `.claude/knowledge-base/references/data-table-filters/` | Grep `react-virtual\|useVirtualizer\|virtual` em `src/` | Read dos hits (ou registrar ausência com o grep) | Confirmação/ausência de segundo padrão de produção |
| Q4 | Como os testes OFICIAIS do react-virtual simulam layout em jsdom (mock de scrollElement rect/scrollTo? setup em `tests/test-setup.ts`) e o que os 3 testes do dashboard pinam — o shape do NOSSO teste de 10K linhas? | tests | `.claude/knowledge-base/references/tanstack-virtual/` | Read `packages/react-virtual/tests/index.test.tsx` + `tests/test-setup.ts` (glob confirmado) | Extrair fixtures/mocks de layout | Receita de teste jsdom para virtualização (renderiza só N de 10K etc.) |
| Q5 | Custo da dep: LoC (adapter 255 + core 2029), transitivas (`@tanstack/virtual-core` única?), licença, versão atual vs dashboard (^3.13.26), tamanho estimado no bundle; estimativa honesta de own (para o ADR do DoD b1) | deps | `.claude/knowledge-base/references/tanstack-virtual/` | Read `packages/react-virtual/package.json` + `packages/virtual-core/package.json` (deps/licença); wc -l | Números consolidados | Tabela de custo → ADR dep com evidência |
| Q6 | Registry/stories: como declarar a dep npm no descriptor (modelo shadcn para tanstack — nosso `registry/data-table.json` atual + precedente `dependencies` do M4/M5) e o desenho da story de 10K linhas determinística? | tools | (interno) + `.claude/knowledge-base/references/tanstack-virtual/` | Read `registry/data-table.json`; Grep `makeData` em `examples/react/table/src/` | Draft descriptor + geração determinística de 10K rows (sem random — makeData deles usa faker?) | Draft do descriptor + fixture de story |

**Consumer requirements (per D3, fora do budget):** Read `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/data/virtual-table.tsx` (config real: rowHeight fixo, overscan 5, estrutura de markup) + `virtual-table.test.tsx` (3 testes — o que pinam e como mockam) + matriz de exclusão: quais features do NOSSO `data-table.tsx` (357 LoC: sort? paginação? expandable?) conflitam com virtualização — mapear por leitura do arquivo local.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4 | Covered |
| Dependencies | Q5 | Covered |
| Tools | Q6 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop checkpoints (para /discover-execute)

- Q1 antes de Q2/Q4 (a API organiza o exemplo e os testes); Q5 independente; Q6 por último (precisa do recorte).
- Uma questão só é `done` com ≥ 1 citação `path:linha` verificada por Read na mesma iteração.
- Q3: ausência registrada com o grep executado é resposta COMPLETA (não BLOCKED).
- Consumer requirements (incl. matriz de exclusão do DataTable local) lidos ANTES do ADR da dep.
- **EC-1:** do exemplo de table, extrair APENAS o markup/config do virtualizer — ignorar o acoplamento com @tanstack/react-table (flexRender/columnDefs), que NÃO usamos.
- **EC-2:** fixture de 10K da story é determinística (gerador puro por índice; makeData do exemplo usa faker — não transferir).
- **EC-3:** registrar a versão do clone e comparar com a ^3.13.26 do dashboard (nota do ADR).
- O ADR da dep DEVE citar números (LoC, transitivas, versão, estimativa own) — não vibes.

## Acceptance Criteria

- [ ] 6/6 questões `done` (ou `blocked` com razão honesta)
- [ ] Todas as citações de referência do blueprint resolvem em disco (`check_reference_citations.py` PASS)
- [ ] 4 coverage corners populados (`check_research_coverage.py` PASS)
- [ ] ≥ 1 ADR (a dependência é o central) com alternativas e evidência numérica
- [ ] Comparison table tanstack example × dashboard × nosso modo
- [ ] Matriz de exclusão mútua (virtualized × expandable/paginação) presente
- [ ] `/discover-confidence datatable-virtualized` ≥ SHIPPABLE_WITH_CAVEATS (89)

## Global Definition of Done

Blueprint em `.claude/knowledge-base/discoveries/blueprints/datatable-virtualized-blueprint.md` com verdict ≥ `SHIPPABLE_WITH_CAVEATS`. Alimenta o `/to-plan` do M6 — que só dispara após o merge do PR #6 (ADR D4).
