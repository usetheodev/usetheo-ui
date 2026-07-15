# Blueprint: DataTable virtualizado — promoção do virtual-table (M6)

> **Version 1.0** — 2026-07-15
> **Slug:** `datatable-virtualized`
> **Plan:** `.claude/knowledge-base/discoveries/plans/datatable-virtualized-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
> **Pesquisa:** tanstack-virtual clonado (adapter 255 LoC + core 2182 LoC; exemplo table; testes oficiais) + dashboard virtual-table (128 LoC); citações spot-checked em disco 2026-07-15.

## Context

ROADMAP § M6. DoD: (b1) ADR da dep `@tanstack/react-virtual` com custo; (b2) modo virtualized do `DataTable` sem breaking (sticky header, alturas fixas, limitações documentadas); (b3) prova 10K+ em story + teste. Estado local: `data-table.tsx` com 357 LoC (> piso 300 do hook) → o modo nasce em módulo co-localizado próprio.

## Objective

Fixar: superfície da API consumida, padrão de render para `<table>` semântica, matriz de exclusão mútua, custo da dep com números, modelo de registry e a receita de teste jsdom.

## Coverage Corner 1 — Integration Tests

**Q4 — done.** Como os testes OFICIAIS simulam layout em jsdom (`.claude/knowledge-base/references/tanstack-virtual/packages/react-virtual/tests/index.test.tsx` + `tests/test-setup.ts`):

- `ResizeObserver` polyfill global (`test-setup.ts:4,9`); `scrollHeight/scrollWidth` redefinidos p/ `Number.MAX_SAFE_INTEGER` (`index.test.tsx:7-18`).
- **Truque central:** injetar **`observeElementRect: (_, cb) => cb({height, width})`** como OPTION do próprio hook (`index.test.tsx:56-59`) — viewport sintético determinístico, sem mockar getBoundingClientRect.
- Comportamentos pinados transferíveis: janela visível exata (viewport/rowHeight; `:113-121`), `overscan=0` renderiza só o viewport (`:123-131`), contagem de re-renders (`:120`), mudança de `count` recomputa (`:152-164`), assert de style literal `transform: translateY(...)` (`:166-181`), height 0→200 passa a renderizar (`:183-189`).
- Dashboard (3 testes, mais fracos — sem injeção de rect): headers + rowgroup, 1000 rows sem throw, empty graceful (paths absolutos em Consumer).

**Shape do NOSSO teste 10K:** prop interna/testável que injete `observeElementRect` (ou aceitar `virtualizerOptions` de teste) → assertar: só N de 10.000 `<tr>` no DOM (N = viewport/rowHeight + 2×overscan), sizer com `getTotalSize()`, translateY literal da primeira linha visível, sort reordena mantendo N, edges (0 rows → empty state; 1 row), negative (virtualized + paginação → erro/aviso de dev tipado). Fixture determinística por índice (EC-2; padrão do próprio dashboard `virtual-table.test.tsx:16-22`).

## Coverage Corner 2 — Dependencies

**Q5 — done.** Números (fonte: package.jsons lidos + wc):

| Métrica | Valor |
|---|---|
| Versões no clone | react-virtual **3.14.6** (`packages/react-virtual/package.json:3`); virtual-core 3.17.4 |
| Dashboard usa (EC-3) | `^3.13.26` — mesma superfície de API; 3.14.x só adiciona `directDomUpdates` opt-in (`packages/react-virtual/src/index.tsx:58-69`) |
| Transitivas | **1** (`@tanstack/virtual-core`, que tem **zero** runtime deps) |
| Licença | MIT (ambos) |
| LoC source | 255 (adapter) + 2182 (core) = 2437 |
| Tree-shaking | `sideEffects: false` em ambos |
| Bundle | SEM dist/ no clone — estimativa ~10-16KB min / ~4-6KB gzip a partir de ~74KB TS; **medir no plan** (nota honesta) |

Estimativa own do recorte fixo: ~120-200 LoC de happy path, MAS o core paga a classe de bug scroll-math (observação de rect cross-browser, isScrolling debounce, momentum iOS, RTL, cache de medições) — ver ADR D1.

## Coverage Corner 3 — Tools

**Q6 — done.** Registry: acrescentar `"@tanstack/react-virtual"` ao array `"dependencies"` de `registry/data-table.json` (mecanismo idêntico ao `lucide-react` já presente na linha 7); modelo confirmado externamente — o data-table-filters declara a MESMA dep no descriptor shadcn (`.claude/knowledge-base/references/data-table-filters/packages/registry/public/r/data-table.json:6-9`, mesmo schema). `files[]` ganha a segunda entrada (`data-table-virtualized.tsx` → `components/ui/data-table-virtualized.tsx`; precedente 2-files: file-dropzone M5).

**Stories:** 1. `Virtualized10K` (10.000 linhas determinísticas por índice — DoD b3; com sort ativo); 2. `VirtualizedCompact` (rowHeight menor); (existentes do DataTable intocadas). Matriz manual de scroll real (jsdom não rola) documentada na story.

## Coverage Corner 4 — Techniques

### Q1 — Superfície da API (done)

`useVirtualizer({ count, getScrollElement: () => parentRef.current, estimateSize: () => rowHeight, overscan })` → `getVirtualItems()`, `getTotalSize()` (adapter `packages/react-virtual/src/index.tsx:230-235,116,127`). Re-render binding é interno: reducer force-rerender (`:84`) + `flushSync` quando sync (`:173-174`); instância única em useState lazy (`:184-185`), `setOptions` a cada render (`:201`). `measureElement`/`directDomUpdates` fora do recorte (alturas fixas; default off `:77`).

### Q2 — Padrão de render para `<table>` semântica (done)

Exemplo oficial (`examples/react/table/src/main.tsx`): container `ref` com altura+`overflow: auto` (`:90` + `index.css:16-19`); sizer `height: getTotalSize()` (`:91`); **`<tr>` EM FLUXO com `translateY(virtualRow.start − index*virtualRow.size)`** (`:132-139` — a base do translate de um tr é sua posição natural no tbody; prosa no próprio exemplo `:164-169`). O exemplo NÃO tem sticky header (css inteiro sem `position: sticky`); harness dos testes usa o padrão div-absoluto (`tests/index.test.tsx:79-99`); dashboard usa div-grid absoluto com header içado para fora do scroll (`virtual-table.tsx:66-83,100-105`).

**Decisão (ADR D2): manter `<Table>` semântica com o padrão do exemplo oficial** (tr em fluxo + translateY corrigido por índice) + `thead sticky top-0` relativo ao NOSSO container de scroll (o `Table.Header` local já é sticky — só muda o ancestral de scroll).

### Q3 — data-table-filters (done — ausência registrada)

Greps executados (`react-virtual|useVirtualizer|virtual` em apps/+packages/; `useVirtualizer` no repo inteiro): **zero uso em código** — a dep é declarada nos manifests e no descriptor, e o marketing menciona virtualização, mas nenhum `useVirtualizer` existe no source clonado. Valor extraído: só o modelo de declaração no registry (Corner 3).

### Consumer requirements (paths absolutos — ADR D3)

- `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/data/virtual-table.tsx` — config real (rowHeight 56, overscan 5, maxHeight 600 — `:49-51`); `rowKey` estável obrigatório ("avoid index — breaks virtualizer reuse", `:35`); docstring fixa alturas fixas (`:12-13`). Markup div-grid NÃO transferido (nosso Table semântico vence — M7 deleta o original).
- `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/data/virtual-table.test.tsx` — piso de teste (não o alvo).
- `src/components/composites/data-table/data-table.tsx` (357 LoC) — features mapeadas + **matriz de exclusão**:

| Feature | Veredito |
|---|---|
| Paginação | **EXCLUSIVO** (dataset inteiro num scroll; type-level se possível) |
| Expandable rows | **EXCLUSIVO no V1** (altura variável quebra estimateSize fixo — fronteira do DoD) |
| Sticky header | COMPATÍVEL COM ADAPTAÇÃO (sticky relativo ao novo container) |
| Sorting | COMPATÍVEL (reordena antes do virtualizer; rowKey estável) |
| rowActions | COMPATÍVEL (caveat: dropdown desmonta ao sair do overscan — documentar) |
| Loading/empty | COMPATÍVEL (retornam antes do corpo) |
| Column width/render/align | COMPATÍVEL COM RESTRIÇÃO (célula não pode exceder rowHeight) |

## Cross-cutting Comparison

| Dimensão | Example oficial | Dashboard virtual-table | **Nosso modo virtualized** |
|---|---|---|---|
| Markup | `<table>` | divs+grid+ARIA | `<Table>` semântica (mantém primitive) |
| Posição da linha | tr em fluxo, `translateY(start − index*size)` | absoluta `translateY(start)` | padrão do exemplo (preserva tr) |
| Sticky header | ausente | içado p/ fora do scroll | thead sticky no container próprio |
| Config | 34px/overscan 20 | 56px/overscan 5 | props `rowHeight`/`overscan` (defaults do dashboard) |
| Teste | injeção de observeElementRect | render-sem-throw | injeção de rect (padrão oficial) |

## ADRs

### D1 — Adotar `@tanstack/react-virtual` (única dependência nova do V1)

**Decision:** adicionar `@tanstack/react-virtual` (pin `^3.14.6`, compatível com o `^3.13.26` do dashboard) como dependency; declarada também no registry item.

**Rationale (números do Corner 2):** MIT; exatamente 1 transitiva (virtual-core, zero deps); tree-shakeable; superfície consumida estável entre 3.13/3.14; produção comprovada no próprio dashboard. Own de recorte fixo custaria ~120-200 LoC de happy path mas assumiria a classe de bug scroll-math que os 2182 LoC do core pagam (rect cross-browser, isScrolling, momentum iOS, RTL) — Rule 9: virtualização é problema resolvido, difícil de resolver BEM. Simetria honesta com o M5 (lá a superfície era pequena → own; aqui é profunda → dep).

**Alternatives considered:** (a) own fixo (~120-200 LoC) — rejeitada: o custo real está nos edge cases de scroll, não no happy path; regressões chegariam via bug report de consumidor; (b) `react-window` — rejeitada: API de componente (não hook) forçaria fork do DataTable em vez de modo; sem produção interna; (c) CSS `content-visibility` — rejeitada: sem controle de janela/overscan, suporte irregular.

**Consequences:** bundle +~4-6KB gzip (estimativa — MEDIR no plan e registrar o número no ADR do plano); registry deixa de ser zero-dep para este item (modelo shadcn padrão — risco #2 do ROADMAP mitigado como previsto); deps-audit ganha 1 pacote para CVE-scan.

### D2 — Modo virtualized preserva `<Table>` semântica (padrão do exemplo oficial)

**Decision:** tr em fluxo com `translateY(start − index*size)` + sizer + thead sticky no container próprio; módulo co-localizado `data-table-virtualized` (piso de 300 do hook — lição ADR 0001-m5), exposto como prop `virtualized` do DataTable (união discriminada nos types).

**Rationale:** preserva a11y da tabela nativa (o dashboard perdeu semântica com divs — nossa promoção corrige); zero breaking (prop nova opcional); a união discriminada torna paginação/expandable inexpressáveis com virtualized no type-level (matriz de exclusão).

**Alternatives considered:** divs+ARIA como o dashboard (rejeitada — regressão semântica); fork VirtualDataTable separado (rejeitada — DoD b2 exige "sem fork"); linhas absolutas dentro do tbody (rejeitada — tr absoluto quebra o layout de table).

### D3 — Testes com injeção de `observeElementRect` (padrão oficial)

**Decision:** o modo virtualized aceita override interno das options do virtualizer para teste (rect sintético), permitindo assertar janela exata de 10K em jsdom.

**Rationale:** é o mecanismo dos próprios testes oficiais (`tests/index.test.tsx:56-59`) — determinístico, sem mock global frágil; o piso "não lança" do dashboard não prova o DoD b3. **Alternatives:** mock global de getBoundingClientRect (rejeitado — frágil, vaza entre testes); e2e com browser real (rejeitado — fora da pirâmide da lib; matriz manual na story cobre).

## Recommendations for the project

1. API: `DataTable<T>` ganha `virtualized?: { height: number|string; rowHeight: number; overscan?: number }` — união discriminada que EXCLUI `pagination`/`expandable` no type-level; módulo `data-table-virtualized.tsx` co-localizado com o corpo virtual.
2. `rowKey` estável obrigatório no modo virtualized (lição do dashboard `:35`).
3. Registry: dep no array `dependencies` + segunda entry em `files[]`; `registry:build` por último.
4. Teste: injeção de rect; assert de janela exata + translateY literal + total size; negative type-level (`@ts-expect-error` para virtualized+pagination) + runtime dev-warning.
5. Medir o bundle real da dep no plan (o ADR do plano registra o número medido).
6. Caveats documentados no JSDoc: dropdown de rowActions desmonta fora do overscan; célula ≤ rowHeight; expandable/paginação indisponíveis.

## Blocked questions

(nenhuma — 6/6 done; Q3 respondida por ausência com greps registrados)

## Halt-loop progress (audit trail)

| Q | Status | Evidência-chave |
|---|---|---|
| Q1 | done | `packages/react-virtual/src/index.tsx:84,116,127,173-174,184-185,201,230-235` |
| Q2 | done | `examples/react/table/src/main.tsx:85-86,90-91,132-139,164-169` + `index.css:16-19`; `tests/index.test.tsx:79-99` |
| Q3 | done | greps registrados; dep declarada em `packages/registry/public/r/data-table.json:6-9` sem uso em código |
| Q4 | done | `tests/test-setup.ts:4,9`; `tests/index.test.tsx:7-18,56-60,113-189` |
| Q5 | done | package.jsons (versões/deps/licença/sideEffects); wc -l; sem dist (nota honesta) |
| Q6 | done | `registry/data-table.json:7` local; modelo externo confirmado |

Spot-check independente (orquestrador): `react-virtual/src/index.tsx:84`, `examples/react/table/src/main.tsx:86`, dashboard `virtual-table.tsx:58` — literais confirmados.

## Related

- Plan: `.claude/knowledge-base/discoveries/plans/datatable-virtualized-plan.md` (v1.1)
- Edge-case review: `.claude/knowledge-base/reviews/datatable-virtualized-edge-cases-2026-07-15.md`
- ADR precedente de estrutura: `.claude/knowledge-base/adrs/0001-m5-filedropzone-structure.md` (piso de 300)
- ROADMAP § M6
