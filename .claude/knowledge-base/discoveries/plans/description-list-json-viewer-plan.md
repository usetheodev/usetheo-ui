# Discovery Plan: DescriptionList + JsonViewer — detail primitives (M2)

> **Version 1.1** (2026-07-15 — absorve EC-1/EC-2 como checkpoints; EC-3/EC-4 documentados) — Investigar o react-json-view (zero-dep, mesmo perfil do nosso alvo) como blueprint do JsonViewer (modelo de collapse, edge cases, theming), os padrões field/item do shadcn shipped como contraponto de API para o DescriptionList (que é HTML `dl/dt/dd` + layout), e os requisitos do consumidor real (event inspector do studio; payloads JSONB do theo-memory) — fixando API, testes e registry dos dois primitives do M2.

**Slug:** `description-list-json-viewer`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 2.75h (ADR D1)

## Context

ROADMAP § M2 (deps: M0 ✅; M1 em release — PR #2). Descoberta executada standalone via `cycle-discover` (pre-conditions próprias, sem gating de milestone) para que o auto-plan do M2 encontre blueprint pronto ("DISCOVER: full chain, if no prior blueprint"). Alvos do DoD: `DescriptionList` (term/detail, layouts horizontal/vertical, densidade) e `JsonViewer` **dependency-free** (tree colapsável, profundidade inicial, copy por nó via `CopyButton` existente, truncamento, safe contra referências circulares). Verificado 2026-07-15: não há `dl/dt/dd` em nenhum componente local; `CopyButton` existe (`src/components/primitives/copy-button/`); catálogo mapeia `react-json-view` → M2.

Regras consumidas: `rules/testing.md § 4.1`, `rules/parsimony-ladder.md` (rungs 1-5 — JsonViewer próprio POR DECISÃO do roadmap, com estudo do SOTA para não reinventar mal), `rules/architecture.md § 3`.

## Objective

Blueprint que fixe: modelo de collapse e edge cases do JsonViewer (circular, BigInt, strings longas, arrays grandes), API do DescriptionList (subs, layouts, densidade), shape de testes (unit+axe+edge+negative) e entries de registry — sem incógnita para o `/to-plan` do M2.

- [ ] All research questions answered with citations to `.claude/knowledge-base/references/`
- [ ] Cross-cutting comparison table populated
- [ ] Recommendations com ≥ 1 proposta concreta por questão
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/react-json-view/` | `core/src/` (index.tsx, Container.tsx, comps/, section/, index.test.tsx, Container.test.tsx), `core/package.json` | Zero-dep ~20KB, mesmo perfil do alvo (catálogo: supports M2) |
| `.claude/knowledge-base/references/shadcn-ui/` | `apps/v4/registry/new-york-v4/ui/field.tsx`, `apps/v4/registry/new-york-v4/ui/item.tsx`, `apps/v4/registry/new-york-v4/ui/_registry.ts` | Contraponto de API para term/detail layouts (não existe DescriptionList no shadcn — field/item são os vizinhos) |
| `.claude/knowledge-base/references/mantine/` | `packages/@mantine/core/src/components/JsonInput/` | Contraponto de ESCOPO (editor vs viewer — o que NÃO fazer no M2) |
| (interno) | `src/components/primitives/copy-button/`, `src/components/primitives/table/` (density context), `src/components/composites/code-block/` | Reuso (CopyButton por nó) + convenções locais de densidade e superfície mono |
| (consumidor externo — ADR D3 M0/M1 reaplicado) | `theokit-studio/packages/studio/src/pages/events/index.tsx` | Event inspector: payloads em `<details>` hoje — caso real do JsonViewer |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/react-json-view/core/src/editor/` como feature | Edição é fora do M2 (viewer read-only por contrato do roadmap); o dir só é lido para DELIMITAR a fronteira do escopo |
| `.claude/knowledge-base/references/react-json-view/www/` e `example/` | Site/demos |
| Adotar `react-json-view` como dependência | Decisão do roadmap: implementação própria dependency-free (registry copy-pasteable); a referência é blueprint de design |
| `.claude/knowledge-base/references/{tremor,react-dropzone,tanstack-virtual,data-table-filters,base-ui}/` | Suportam M3-M6 |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** react-json-view 1.5h; shadcn field/item 0.5h; mantine JsonInput 0.25h; interno+studio 0.5h. Total 2.75h.

**Rationale:** o JsonViewer é o componente denso do M2 (edge cases + collapse model) — maior fatia; DescriptionList é HTML semântico + layout (fatia menor). Alternativas: split igual (desperdiça no DL), pular mantine (perde o contraponto editor-vs-viewer que protege o escopo).

**Stop condition — per question (mandatory):** Fase A vazia após 3 variantes → BLOCKED "Fase A exhausted"; próxima questão. Nunca preencher com hotspots alheios.

**Stop condition — per project (mandatory):** budget exaurido → restantes BLOCKED; todos exauridos → `<promise>BLUEPRINT_BLOCKED</promise>` — nunca COMPLETE parcial.

**Anti-pattern:** fabricar Fase B (Unbreakable Rule 3).

**Consequences:** BLOCKED honestos viram seed da próxima descoberta.

### D2 — react-json-view é blueprint de DESIGN, não fonte de código

**Decision:** estudar arquitetura/edge-cases/API para informar implementação própria; NUNCA copiar código (MIT permite, mas o alvo é menor e nos nossos tokens/convenções — forwardRef, data-slot, cn).

**Rationale:** roadmap trava dependency-free + registry copy-pasteable; o valor da referência é o MAPA de edge cases que 20KB de produção acumularam (Don't Reinvent *mal* — rung do estudo antes da escrita). Alternativas: adotar a dep (rejeitada — roadmap), ignorar a referência (rejeitada — reinventar edge cases às cegas).

**Consequences:** blueprint entrega inventário de edge cases com citação, não diffs de código.

### D3 — Consumidor externo lido, não citado como referência

**Decision:** studio via path absoluto na seção "Consumer requirements" (mesmo ADR D3 dos M0/M1).

**Rationale/Consequences:** idem M0/M1 (golden rule de citações).

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Qual o modelo de collapse do react-json-view (prop `collapsed`, callback `shouldExpandNodeInitially`, estado por nó) e como a árvore renderiza nós (recursão? flat map)? | techniques | `.claude/knowledge-base/references/react-json-view/` | Grep `collapsed\|shouldExpand` em `core/src/` | Read `core/src/index.tsx` + `core/src/Container.tsx` + `core/src/section/` relevantes | Descrição do modelo de estado + assinatura equivalente mínima para o nosso |
| Q2 | Como o react-json-view trata os edge cases: referências circulares, BigInt, undefined/função, strings longas (truncamento), arrays/objetos grandes? | techniques | `.claude/knowledge-base/references/react-json-view/` | Grep `circular\|BigInt\|truncat\|maxDisplayLength\|Infinity` em `core/src/` | Read dos hits em contexto (comps/) | Inventário edge case → estratégia → citação (mapa para nossos testes) |
| Q3 | Que API os vizinhos field/item do shadcn shipped expõem para pares rótulo/valor (subs, orientação, densidade) e o que transferir para um `DescriptionList` semântico (`dl/dt/dd`)? | techniques | `.claude/knowledge-base/references/shadcn-ui/` | Grep `^function` em `apps/v4/registry/new-york-v4/ui/field.tsx` e `ui/item.tsx` | Read dos dois arquivos; mapear para dl/dt/dd + variantes horizontal/vertical | Proposta de subs/props do DescriptionList com citações |
| Q4 | Que comportamentos os testes do react-json-view pinam (expand/collapse, render de tipos, customização) e o que nosso shape de teste deve cobrir (incl. axe, edge Q2, negative)? | tests | `.claude/knowledge-base/references/react-json-view/` | Glob `core/src/*.test.tsx` (index.test.tsx, Container.test.tsx verificados) | Read dos test files; extrair assertions de comportamento | Lista comportamento→assertion; marcar edges (objeto vazio, null root) e negatives (circular → não trava; tipo não-serializável) |
| Q5 | Deps: confirmar react-json-view zero-dep (package.json) e que nosso par também fica em zero deps novas (CopyButton local para copy-por-nó; sem lucide novo?) | deps | `.claude/knowledge-base/references/react-json-view/` + (interno) | Read `core/package.json` (dependencies/peerDependencies); Grep `lucide\|import` no nosso `copy-button` | Confirmar zero-dep deles; listar reusos locais nossos | Tabela dep→status→veredito (esperado: zero novas) |
| Q6 | Registry: como declarar `description-list` e `json-viewer` no nosso schema (deps por introspecção — CopyButton vira registryDependency?) e há entry análoga no shadcn (`field`/`item` em `_registry.ts`) para inspiração de campos? | tools | `.claude/knowledge-base/references/shadcn-ui/` | Grep `"field"\|"item"` em `apps/v4/registry/new-york-v4/ui/_registry.ts` | Mapear para o shape local (`registry/breadcrumb.json`/`registry/combobox.json` como modelos M0/M1) | Drafts dos dois descriptors |
| Q7 | O que o JsonInput do Mantine inclui (validação, formatação, edição) que delimita a fronteira viewer-vs-editor do nosso escopo? | techniques | `.claude/knowledge-base/references/mantine/` | Grep `interface JsonInputProps` em `packages/@mantine/core/src/components/JsonInput/JsonInput.tsx` | Read do arquivo; listar o que fica FORA do M2 | Lista "explicitamente fora" com citação (blindagem de escopo) |

**Consumer requirements (per D3, fora do budget):** Read `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/packages/studio/src/pages/events/index.tsx` (payloads em `<details>` + categorização) → shape dos dados reais (fixtures de eventos), profundidade típica, necessidade de copy-por-nó; theo-memory payload JSONB (blueprint do roadmap-init) como segundo caso.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4 | Covered |
| Dependencies | Q5 | Covered |
| Tools | Q6 | Covered |
| Techniques | Q1, Q2, Q3, Q7 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop Checkpoints

| Checkpoint | Assertion | Action if fails |
|---|---|---|
| Before answering Qx | Paths da Fase A existem (pré-validados 2026-07-15) | BLOCKED "path not found"; continue |
| Per-question Fase A budget | ≥ 1 hotspot OU 3 variantes | BLOCKED "Fase A exhausted"; continue |
| After answering Qx | ≥ 1 citação `references/` (exceto Consumer requirements — D3) | Re-iterar (1 retry) |
| Q2 completude | Inventário cobre no mínimo: circular, BigInt, string longa, coleção grande | Re-iterar Q2 (1 retry) |
| Q2 zero-hit ≠ BLOCKED (EC-1) | Edge sem hit na referência → resposta "não tratado na referência" com evidência das 3 variantes; família permanece no inventário | Corrigir a resposta |
| Q4 glob recursivo (EC-2) | Fase A usa `core/src/**/*.test.tsx` (types/index.test.tsx incluso) | Re-executar Fase A |
| Q4 behavior-only (lição M0 EC-3) | ≥ 2 assertions de comportamento fora de harness | Re-iterar Q4 (1 retry) |
| Q7 anti scope-creep | Só delimitação de fronteira; sem propor features de editor | Cortar digressão |
| Per-project time budget | Budget OK (D1) | BLOCKED restantes; próximo projeto |
| Before promising complete | 4 corners + Consumer requirements + ≥ 1 ADR | Recusar promise |

## Acceptance Criteria

- [ ] Questões respondidas OU BLOCKED com razão
- [ ] 4 corners populados no blueprint
- [ ] Toda citação resolve em `.claude/knowledge-base/references/{...}`
- [ ] Seção Consumer requirements presente
- [ ] Inventário de edge cases do JsonViewer com ≥ 4 famílias citadas
- [ ] ≥ 1 ADR de síntese no blueprint
- [ ] Budget respeitado
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS
- [ ] Blueprint em `.claude/knowledge-base/discoveries/blueprints/description-list-json-viewer-blueprint.md`

## Global Definition of Done

- [ ] Fases plan → edge-cases → plan-confidence → execute → confidence completas
- [ ] Verdict final no header do blueprint
- [ ] 0 citações fabricadas; Coverage Matrix 100%
- [ ] ADRs citam princípios/regras (D1→Rule 3; D2→Don't Reinvent/registry contract; D3→fronteiras; Q4→testing.md § 4.1)
