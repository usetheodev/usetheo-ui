# Blueprint: DescriptionList + JsonViewer — detail primitives (M2)

> **Version 1.0** — Sintetiza o modelo de collapse e o inventário de edge cases do react-json-view (zero-dep, mesmo perfil do alvo), o vocabulário field/item do shadcn shipped para o DescriptionList semântico, a fronteira viewer-vs-editor (Mantine JsonInput) e os requisitos do consumidor real (event inspector do studio) — fixando API, testes e registry dos dois primitives do M2.

**Slug:** `description-list-json-viewer`
**Source plan:** `.claude/knowledge-base/discoveries/plans/description-list-json-viewer-plan.md` (v1.1)
**Owner:** Paulo + Claude
**Generated:** 2026-07-15 via `/discover-execute` (halt-loop inline, 7 iterações + consumer)
**Confidence verdict:** SHIPPABLE_WITH_CAVEATS (89.0 — cap único: soft_floor_citation_density_low; 0 fabricadas; 4/4 corners) — 2026-07-15

## Context

ROADMAP § M2. Descoberta standalone (cycle-discover) enquanto o M1 aguarda merge do PR #2. Zero deps novas esperadas; `CopyButton` local para copy-por-nó.

## Objective

Fixar API/testes/registry de `DescriptionList` e `JsonViewer` sem incógnitas para o `/to-plan` do M2.

---

## Coverage Corner 1 — Integration Tests

### react-json-view (Q4)

Os testes da referência são de RENDER por tipo, não de interação — baixa transferência direta, mas mapeiam o que pinar por tipo:

- Snapshot de classes/estilo do container — `.claude/knowledge-base/references/react-json-view/core/src/index.test.tsx:32-49` (não transferível: pina implementação, anti-pattern do nosso testing.md § 6).
- Render por tipo (`String`, `BigInt` etc.) parametrizado — `.claude/knowledge-base/references/react-json-view/core/src/types/index.test.tsx:4,113` (transferível como IDEIA: um `it.each` por tipo de valor).

### Shape de testes para os nossos (convenção local vitest+axe, lições M0/M1)

| Componente | Comportamentos |
|---|---|
| DescriptionList (9) | dl/dt/dd semânticos no DOM; layout horizontal (grid) vs vertical; densidade via prop/context; N itens → N dt+dd; item sem detail → dd com fallback "—"?; edge: lista vazia (dl válido); data-slots; forwardRef; axe |
| JsonViewer (13) | expand/collapse por clique (subtree NÃO renderizada quando fechada — perf por design); `collapsed` boolean e number (profundidade); render por tipo (string, number, boolean, null, BigInt→sufixo n, array, objeto); truncamento de string > N com expand; **circular → "[Circular]" sem travar (negative — referência NÃO trata; nosso DEVE)**; copy-por-nó via CopyButton (clipboard mock); objeto vazio/array vazio (edge); root primitivo (edge); data-slots; axe (árvore aberta) |

---

## Coverage Corner 2 — Dependencies

| Dep | Status | Evidência |
|---|---|---|
| react-json-view | REFERÊNCIA apenas — zero `dependencies` (peer `@babel/runtime` é artefato de build lerna, irrelevante) | `.claude/knowledge-base/references/react-json-view/core/package.json` (deps: None) |
| Nossas novas | **ZERO** | DL = HTML nativo; JsonViewer = próprio; `CopyButton` local (`src/components/primitives/copy-button/`); chevrons via `lucide-react` já instalada |

## Coverage Corner 3 — Tools

Entries análogas no shadcn: `field` (`_registry.ts:250` — sem deps, registryDeps label/separator) e `item` (`:316` — deps radix-ui). Drafts para o nosso schema (modelos M0/M1; validate local exige deps por introspecção):

```json
// registry/description-list.json
{"name":"description-list","type":"registry:ui",
 "registryDependencies":["cn","tailwind-preset"],
 "files":[{"path":"components/primitives/description-list/description-list.tsx","type":"registry:ui","target":"components/ui/description-list.tsx"}]}
// registry/json-viewer.json
{"name":"json-viewer","type":"registry:ui","dependencies":["lucide-react"],
 "registryDependencies":["cn","copy-button","tailwind-preset"],
 "files":[{"path":"components/primitives/json-viewer/json-viewer.tsx","type":"registry:ui","target":"components/ui/json-viewer.tsx"}]}
```

(`copy-button` existe como item do registry? conferir na execução; senão inline o botão com clipboard — decisão no plano.)

---

## Coverage Corner 4 — Techniques

### JsonViewer — modelo de collapse (Q1)

Referência: `collapsed?: boolean | number` (true = tudo fechado; número = fecha a partir da profundidade N; **tem precedência** sobre `shouldExpandNodeInitially`) — `.claude/knowledge-base/references/react-json-view/core/src/index.tsx:65-73`; estado vive em store de contexto (`core/src/store.tsx:22-23`); props úteis: `indentWidth` (:57), `displayDataTypes` (:61), `enableClipboard` (:63), `shortenTextAfterLength` (:79).

**Nossa API mínima (KISS):** `JsonViewer({ value: unknown, collapsed?: boolean | number, shortenTextAfterLength?: number (default 60), className })` — nó expande/colapsa por clique; subtree fechada não renderiza (lazy — o guard de performance do M1-noted "payloads grandes"); estado interno por nó (Map de paths) — sem controlled mode no M2 (YAGNI).

### JsonViewer — inventário de edge cases (Q2; checkpoint EC-1 honrado)

| Edge | Estratégia da referência | Citação | Nossa decisão |
|---|---|---|---|
| BigInt | `bigIntToString` + comp `TypeBigint` (render `10086n`) | `core/src/types/index.tsx:7-12,224` | idem (sufixo `n`) |
| String longa | `shortenTextAfterLength` default 30 + `stringEllipsis '...'`; slice no render | `core/src/types/index.tsx:62,84` | default 60 + clique expande a string |
| **Circular** | **NÃO TRATADA** — zero hits para `circular` em `core/src/` (3 variantes de busca: circular, WeakSet, seen); JSON circular estoura a recursão da referência | (ausência verificada 2026-07-15) | **WeakSet de ancestrais → nó "[Circular]"** (negative test obrigatório) |
| Coleção grande | sem windowing; render integral quando expandida | (ausência de virtualização em `core/src/`) | idem M2 (collapse lazy é o guard); virtualização = M6 se houver demanda |
| undefined/função/símbolo | comps por tipo (`types/index.tsx` FCs por tipo) | `core/src/types/index.tsx:224+` | render literal (`undefined`, `ƒ`) sem crash |

### DescriptionList — vocabulário transferido (Q3)

shadcn field/item: subs `Field/FieldContent/FieldLabel/FieldTitle/FieldDescription` (`ui/field.tsx:81-141`) e `Item/ItemContent/ItemTitle/ItemDescription` + separador com `orientation` (`ui/item.tsx:26,54-132`) — vocabulário de conteúdo+título+descrição com orientação. Transferência para semântica nativa:

**Nossa API:** `DescriptionList` (`dl`, prop `layout?: "vertical" | "horizontal"` — horizontal = grid `dt` coluna fixa; `dense?: boolean`) + `DescriptionList.Item` (grupo `div`) + `.Term` (`dt`) + `.Detail` (`dd`). Parsimony rungs 2-3: a semântica vem da plataforma (`dl/dt/dd`); só layout/tokens são nossos.

### Fronteira viewer-vs-editor (Q7 — blindagem de escopo)

Mantine `JsonInput` = editor: `value/onChange`, `formatOnBlur`, `validationError`, `serialize` — `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/JsonInput/JsonInput.tsx:9-27`. **Tudo isso fica FORA do M2** (roadmap: viewer read-only; edição só com caso real + ADR).

## Consumer requirements (paths absolutos — ADR D3; 2026-07-15)

Studio event inspector: payload hoje em `<details>` + `JSON.stringify(event, null, 2)` — `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/pages/events/index.tsx:92-99`. Requisitos: default fechado (payloads volumosos), mono font, copy do nó raiz, profundidade típica 2-4 (typed events); theo-memory detail (payload JSONB) = segundo caso com o mesmo shape.

## Cross-cutting Comparison

| Dimension | react-json-view | shadcn field/item | Nosso alvo |
|---|---|---|---|
| Collapse | boolean\|number + callback (index.tsx:65-73) | n/a | boolean\|number (sem callback — YAGNI) |
| Circular | não trata (verificado) | n/a | WeakSet → "[Circular]" |
| Truncation | 30 chars default (types:62) | n/a | 60 + expand no clique |
| Semântica | divs + spans por tipo | div-based | JsonViewer: tree em `ul/li`?; DL: `dl/dt/dd` nativos |
| Deps | zero | radix-ui (item) | zero novas |

## ADRs

### D1 — JsonViewer próprio com collapse lazy e circular-safe

**Decision:** implementação própria (roadmap) com `collapsed: boolean|number`, subtree fechada não renderizada, WeakSet contra circular, truncamento 60 com expand, tipos com render literal (BigInt `n`).

**Rationale:** a referência dá o mapa (Q1/Q2) mas não trata circular e o registry copy-pasteable proíbe a dep; lazy-render dos filhos fechados é o guard de performance natural (KISS — sem virtualização no M2). Cita Don't Reinvent (estudo antes da escrita) + testing.md § 4.1 (negative circular).

**Alternatives considered:** adotar react-json-view (rejeitada — roadmap/registry); render eager com virtualização (rejeitada — M6 se houver demanda); controlled expansion API (rejeitada — YAGNI sem consumidor).

**Consequences:** payloads gigantes totalmente expandidos são responsabilidade do consumidor (documentar no JSDoc — lição BLOCKER do review M1: documentar consequências de ADR no código).

### D2 — DescriptionList 100% semântico com layout por grid

**Decision:** `dl/dt/dd` nativos; `layout` horizontal/vertical + `dense`; subs compostos (padrão da lib).

**Rationale:** parsimony rungs 2-3 (plataforma dá semântica/a11y de graça); vocabulário field/item do shadcn informa nomes, não estrutura. 

**Alternatives considered:** API data-driven `items[]` (rejeitada como primária — mesma lição do Breadcrumb M0); div-based como shadcn field (rejeitada — perde semântica nativa sem ganho).

**Consequences:** axe valida definition-list rules (dt/dd pareados) — teste pina.

### D3 — Copy-por-nó reusa CopyButton local

**Decision:** `JsonViewer` renderiza `CopyButton` (hover) por nó de objeto/array + raiz.

**Rationale:** rung 4 (componente pronto, aria-live e clipboard tratados; provado no CodeBlock).

**Alternatives considered:** botão próprio (duplicaria clipboard/announce — rejeitado).

**Consequences:** `copy-button` vira registryDependency do json-viewer (conferir entry no registry local durante o plano).

## Recommendations for the project

| # | Recommendation | Linked to | Priority |
|---|---|---|---|
| 1 | DescriptionList primitive (D2) com 9 testes | Q3, D2, testing.md | HIGH |
| 2 | JsonViewer primitive (D1) com 13 testes (circular negative obrigatório) | Q1, Q2, Q4, D1 | HIGH |
| 3 | Copy-por-nó via CopyButton (D3) + registryDeps corretas | Q5, Q6, D3 | HIGH |
| 4 | Stories: DL (layouts/densidade) + JsonViewer (payload de evento do studio como fixture) + composição "detail panel" (DL + JsonViewer) | Consumer req. | HIGH |
| 5 | JSDoc documenta consequência do D1 (payload gigante expandido) — lição M1 | D1 | MEDIUM |

## Blocked questions (if any)

(none — 7/7; Q2-circular respondida como "não tratado na referência" com evidência de busca, per checkpoint EC-1)

## Halt-loop progress (audit trail)

- Iterations used: 7 + consumer · Questions answered: 7/7 · blocked: 0
- Citations verified: sanity pós-promise · Promise: BLUEPRINT_COMPLETE (iteração 7)

## Related

- Discovery plan: `.claude/knowledge-base/discoveries/plans/description-list-json-viewer-plan.md`
- Project rules: `.claude/rules/testing.md`, `.claude/rules/parsimony-ladder.md`, `.claude/rules/architecture.md`
