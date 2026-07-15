# Blueprint: Stepper / PipelineStatus — promoção do build-timeline (M4)

> **Version 1.0** — 2026-07-15
> **Slug:** `stepper-promotion`
> **Plan:** `.claude/knowledge-base/discoveries/plans/stepper-promotion-plan.md` (v1.1, SHIPPABLE_WITH_CAVEATS 89)
> **Verdict alvo:** consumido pelo `/to-plan` do M4 (dispara após merge do PR #4 — ADR D4 do plan)

## Context

ROADMAP § M4: promover o padrão `build-timeline` do dashboard theo-cloud a um composite genérico `Stepper` — estados pending/active/done/failed por etapa, orientações vertical/horizontal, timestamps opcionais, retry slot — validado contra build pipeline (dashboard) e ingest pipeline (theo-rag). Referências SOTA estudadas: Stepper do Mantine (única anatomia composta completa nos clones) e Tracker do tremor (contraponto compacto). shadcn-ui e base-ui NÃO têm stepper/timeline (ausência verificada 2026-07-15).

## Objective

Fixar anatomia, modelo de estado, contrato a11y, fronteira controlado-vs-live, shape de testes e registry do `Stepper` — sem incógnita para o `/to-plan`.

## Coverage Corner 1 — Integration Tests

**Q4 — done.** Comportamentos que os SOTA pinam e o que transferimos:

| Fonte | Comportamento pinado | Transferir? |
|---|---|---|
| `.claude/knowledge-base/references/mantine/packages/@mantine/core/src/components/Stepper/Stepper.test.tsx:49` | `onStepClick` recebe índice 0-based do step clicado | SIM (se navegação clicável entrar — ver ADR D2: NÃO entra no M4) → vira negative "step não é botão" |
| `Stepper.test.tsx:56` | conteúdo do step ativo renderiza; `active > length-1` cai no slot Completed; `active=100` não quebra (clamp implícito) | SIM — edge: índice fora do range não quebra (nosso: estado derivado clampado) |
| `Stepper.test.tsx:67` | anatomia composta exposta (`Stepper.Step`) | SIM — `Stepper.Step` como sub (convenção local de subs M0-M2) |
| `Stepper.test.tsx:72,89,105` | matriz de permissão de seleção (bidirectional / allowNextStepsSelect / allowStepSelect por step) | NÃO — navegação wizard fora do escopo M4 (pipeline é read-only); registrado como fronteira |
| `Stepper.test.tsx:28` | `tests.itSupportsSystemProps` — harness genérico `@mantine-tests/core` | NÃO conta como cobertura SOTA (EC-3 do edge-case review) |
| `.claude/knowledge-base/references/tremor/src/components/Tracker/tracker.spec.ts:1` | Playwright e2e contra Storybook (`test(`, não `it(`) — render/bar/tooltip | Inventário apenas (EC-1); shape unit/RTL vem do Mantine + padrões M0-M3 |

**Shape de teste proposto (nosso, vitest+RTL+axe):** helpers puros (derivação de estado) unit; render por estado (4 estados × ícone/data-state); orientações (2); timestamps opcionais; retry slot só no failed; a11y (`<ol>` + `aria-current="step"` + axe zero violations incl. story sweep do Ladle); edges: 1 etapa, todas done, active fora do range; negatives: `steps=[]` (empty state ou render nulo explícito), estado inválido em runtime não quebra derivação.

## Coverage Corner 2 — Dependencies

**Q5 — done.** Imports do Mantine (`Stepper.tsx:1-28`, `StepperStep/StepperStep.tsx:1-18`) → substituto local:

| Import Mantine | Papel | Substituto local |
|---|---|---|
| `factory`, `useProps`, `useStyles`, `createVarsResolver`, `Box` (core) | sistema de estilo/fábrica | `forwardRef` + `cn` + tailwind-preset (convenção M0-M3) |
| `Stepper.context.ts` (`createSafeContext` com orientation/iconPosition) | propagar orientação para os steps | React context mínimo local OU props clonadas — decidir no plan (ADR D1 recomenda context mínimo como no Combobox M1) |
| `CheckIcon` (Checkbox), `Loader`, `Transition`, `UnstyledButton` | ícones/estados/click | `lucide-react` já instalado (Check/Loader2/X/CircleDashed — mesmos do build-step-card) ; sem Transition (animate-pulse CSS); step NÃO é botão (ADR D2) |
| `@radix-ui/react-hover-card` (tremor Tracker.tsx:4) | tooltip por bloco | NÃO transferir — Tracker é outro escopo |

**Veredito: zero dependências novas.** Reusos locais: `cn`, tokens `status-*` (via classes `text-success/destructive/primary/muted-foreground` — mesmas do build-timeline), `Timestamp` (`value/format` — verificado), `StatusDot`/`Badge` só na story de composição (DoD).

## Coverage Corner 3 — Tools

**Q6 — done.** Stories do Mantine (`Stepper.story.tsx`): `Usage`, `WithActivityStatePreservation`, `Unstyled`, `Vertical`, `RightIconPosition` — cobrem orientação e customização de ícone; nada de failed (não existe lá).

**Nossas stories (3+, padrão M0-M3 + axe sweep do Ladle):**
1. `BuildPipeline` — caso dashboard: 6 etapas queued→live, uma variante failed com retry slot (botão "Retry build").
2. `IngestPipeline` — caso theo-rag: pending/processing/ready/failed mapeado em etapas (partition→chunk→embed→index→ready), timestamps opcionais via `Timestamp`.
3. `ComposicaoStatus` — DoD: composição com `StatusDot`/`Badge` sem duplicar semântica.
4. `Horizontal` — orientação horizontal (onboarding curto).

**Registry:** descriptor `registry/stepper.json` no shape do M3 (`registry/trend-chart.json` como modelo); `registryDependencies` por introspecção real dos imports (esperado: nenhum obrigatório no componente; stories usam status-dot/badge mas stories não entram no descriptor). `registry:build` como ÚLTIMO passo pré-release (lição M1/M2).

## Coverage Corner 4 — Techniques

### Q1 — Modelo de estado (done)

Mantine deriva o estado por etapa de um ÚNICO índice: `state = active === index ? 'stepProgress' : active > index ? 'stepCompleted' : 'stepInactive'` (`Stepper.tsx:200` — reduce sobre children). Não existe estado explícito por etapa; **não existe estado de erro** (grep `error|failed` vazio em `StepperStep.tsx` — evidência negativa, EC-2). `StepperStep` recebe `state` clonado + emite `data-progress`/`data-completed` (`StepperStep.tsx:139-141`).

O consumidor real (dashboard `build-timeline.tsx` `phaseState()`) precisa de MAIS que índice: failed trava a fase corrente com X e as posteriores pending; cancelled marca a primeira. theo-rag idem (`failed` em qualquer etapa).

**Decisão (ADR D1): estado explícito por etapa** — `steps: Array<{ id, label, description?, status: 'pending'|'active'|'done'|'failed', timestamp?, retry? }>`. A derivação-por-índice vira helper puro exportado `deriveSteps(defs, activeIndex)` para o caso wizard simples — melhor dos dois mundos, testável isolado (padrão `linScale`/`niceMax` do M3).

### Q2 — Orientação + ícones + gap failed (done)

- Orientação no Mantine: prop `orientation?: 'vertical' | 'horizontal'` (`Stepper.tsx:87-88`, default horizontal), propagada via context; separadores: horizontal injeta `.separator` entre steps com `data-active` (`Stepper.tsx:236-244`); vertical usa `.verticalSeparator` dentro do step (`StepperStep.tsx:191-196`), seletores CSS `[data-orientation]` (`Stepper.module.css:35,47`). **Transferir o mecanismo data-attribute** (`data-orientation` no root + variantes tailwind), não o CSS (EC-4).
- Ícones por estado: `icon`/`completedIcon`/`progressIcon` com `StepFragmentComponent` (função por step). Nosso caso: ícones FIXOS por estado (Check/Loader2/X/CircleDashed — exatamente `build-step-card.tsx`), sem prop de customização no M4 (YAGNI; abre com 2º caso concreto).
- **Failed:** design vem do consumidor — ícone X `text-destructive`, label em destaque, `aria-label` com a causa (`build-step-card.tsx:47`: `` `${label} failed: ${step.error_class ?? 'unknown'}` ``), retry slot (`ReactNode`) renderizado apenas quando `status==='failed'`.
- Default de orientação NOSSO: **vertical** (ambos os casos reais são verticais; Mantine default horizontal serve wizard, não pipeline).

### Q3 — Contraponto Tracker (done)

Tremor Tracker = strip de blocos coloridos `data: {color, tooltip}[]` com HoverCard por bloco (`Tracker.tsx:10-14,66-69`) — visualização de DENSIDADE de status, não de progressão de etapas. Valida: nosso Stepper é composite de etapas RICAS (label+description+timestamp+retry); o caso "strip compacto" fica fora (StatusDot em linha já cobre).

### A11y (cross — Q1/Q2/Q4)

Mantine: **zero atributos ARIA** (grep `aria-|role=` vazio em Stepper.tsx/StepperStep.tsx; steps são UnstyledButton em div). NÃO transferir. Contrato nosso vem do consumidor + APG: `<ol aria-label>` (build-timeline.tsx:71) + `aria-current="step"` na etapa ativa + ícones `aria-hidden` + texto de estado acessível (não só cor — lição do StatusDot local).

### Consumer requirements (paths absolutos — ADR D3 do plan)

- `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-timeline.tsx` — PHASES `{id,label,description}`, máquina `phaseState`, `<ol className="space-y-3" aria-label>`; classes por estado (done: foreground; active: primary semibold; failed: destructive semibold; pending: muted).
- `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-step-card.tsx` — ícones por estado, truncamento com `title` (EC-14 deles), `aria-label` com erro, slot de timer.
- `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-timeline-live.tsx` — FICA no consumidor: SSE, agrupamento por fase, skeleton, terminal-empty (Red Team #122). Nosso composite é controlado (risco #2 do roadmap).
- `/home/paulo/Projetos/usetheo/theo-data/theo-rag/packages/core/src/contract/document/document-status.ts` — status público 5-state `pending/processing/ready/failed/deleting`; stages internos em `packages/core/src/domain/pipeline/stages/` (parse→chunk→embed→extract). Mapear status público → array de steps é responsabilidade do consumidor; nossa story IngestPipeline demonstra o mapa.

## Cross-cutting Comparison

| Dimensão | Mantine Stepper | tremor Tracker | dashboard build-timeline | **Nosso Stepper (proposta)** |
|---|---|---|---|---|
| Modelo de estado | índice único → derivação | array de cores | status único → `phaseState()` | **estado explícito por etapa** + helper `deriveSteps` |
| Estado de erro | ❌ inexistente | cor livre | ✅ failed + cancelled | ✅ `failed` + retry slot |
| Orientação | h/v via context + data-attrs | strip horizontal | vertical fixo | **h/v via `data-orientation`, default vertical** |
| Interatividade | click/wizard (matriz allow*) | hover tooltip | nenhuma | **nenhuma no M4** (read-only pipeline; ADR D2) |
| A11y | ❌ zero ARIA | ❌ | `<ol aria-label>` | **`<ol>` + `aria-current="step"` + erro em texto** |
| Timestamps | ❌ | ❌ | timer live (fica fora) | ✅ slot `Timestamp` opcional |
| Deps | sistema Mantine | radix hover-card | lucide | **zero novas** (lucide já instalado) |

## ADRs

### D1 — Estado explícito por etapa (não derivação-por-índice)

**Decision:** `StepperProps.steps` carrega `status` por etapa; helper puro `deriveSteps(defs, activeIndex)` exportado cobre o caso wizard-simples.

**Rationale:** os DOIS casos reais exigem failed em etapa arbitrária + estados mistos (dashboard `phaseState` produz done/active/failed/pending simultâneos; theo-rag failed em qualquer stage). A derivação-por-índice do Mantine (`Stepper.tsx:200`) não expressa isso. Alternativas consideradas: (a) índice único como Mantine — rejeitada, não cobre failed no meio; (b) dois modos (índice OU array) na API — rejeitada, duas fontes de verdade (KISS); (c) estado explícito + helper puro — escolhida, o helper dá o caminho de menor atrito sem bifurcar a API.

**Consequences:** componente 100% controlado (mitiga risco #2 do roadmap); testes do helper são unit puros (padrão M3).

### D2 — Sem navegação clicável no M4

**Decision:** steps NÃO são botões; sem `onStepClick`/matriz allow*.

**Rationale:** pipeline de build/ingest é read-only — nenhum dos dois consumidores clica em etapa. A matriz de seleção do Mantine (3 dos 6 its de comportamento) é complexidade de wizard sem caso concreto aqui (YAGNI). Alternativas: (a) portar onStepClick "para o futuro" — rejeitada (Regra 11); (b) read-only — escolhida. Wizard clicável abre como milestone próprio quando o studio precisar.

**Consequences:** a11y simplifica (lista semântica, não toolbar de botões); negative test pina "step não expõe role button".

### D3 — Nome público `Stepper` (composite), não `PipelineStatus`

**Decision:** componente `Stepper` em `src/components/composites/stepper/`; "PipelineStatus" é o caso de uso, não o nome.

**Rationale:** vocabulário da indústria (Mantine/MUI/Chakra: Stepper) maximiza descoberta no registry; o ROADMAP § M4 já usa "Stepper" como primeiro nome. Alternativas: `Timeline` (colide com caso feed/atividade, semântica diferente), `PipelineStatus` (acopla ao caso de uso e esconde o wizard futuro).

**Consequences:** registry item `stepper`; stories mostram os dois casos de uso reais.

## Recommendations for the project

1. API: `Stepper` root (`steps`, `orientation='vertical'`, `aria-label` obrigatório via prop `label`?—decidir no plan) + sub `Stepper.Step` para composição avançada OU render interno por array — plan decide com base no custo de teste (M0-M2 preferiram subs; aqui o array é o caso dominante dos dois consumidores).
2. Helper puro `deriveSteps` exportado e testado isolado (padrão `linScale`/`niceMax` M3).
3. Ícones fixos por estado (Check/Loader2/X/CircleDashed) — mesmos glifos lucide do build-step-card; `animate-spin` no active, `animate-pulse` opcional.
4. Timestamps: slot `timestamp?: ReactNode` por etapa (consumidor passa `<Timestamp value=... />`) — NÃO reimplementar formatação (Timestamp já resolve; timer live fica no consumidor).
5. Retry: slot `retry?: ReactNode` renderizado só em `status==='failed'` — não é botão nosso (ação é do consumidor).
6. Truncamento de label longo com `title` (porta EC-14 do build-step-card).
7. Registry `stepper.json` + `registry:build` por último (lição M1/M2).

## Blocked questions

(nenhuma — 6/6 done)

## Halt-loop progress (audit trail)

| Q | Status | Evidência-chave |
|---|---|---|
| Q1 | done | `Stepper.tsx:200` (derivação); `Stepper.context.ts:4-11`; `StepperStep.tsx:139-141` (data-attrs) |
| Q2 | done | `Stepper.tsx:87-88` (orientation); `Stepper.module.css:35,47`; grep error/failed vazio (EC-2, evidência negativa); `StepperStep.tsx:191-196` (verticalSeparator) |
| Q3 | done | `Tracker.tsx:10-14,66-69` (TrackerBlockProps/data) |
| Q4 | done | `Stepper.test.tsx:49-105` (6 its); `tracker.spec.ts:1` (Playwright — EC-1) |
| Q5 | done | imports `Stepper.tsx:1-28` + `StepperStep.tsx:1-18` → tabela Corner 2; zero deps novas |
| Q6 | done | `Stepper.story.tsx` (5 exports); modelo local `registry/trend-chart.json` (M3) |

## Related

- Plan: `.claude/knowledge-base/discoveries/plans/stepper-promotion-plan.md` (v1.1)
- Edge-case review: `.claude/knowledge-base/reviews/stepper-promotion-edge-cases-2026-07-15.md`
- Blueprint irmão (padrão de promoção): `.claude/knowledge-base/discoveries/blueprints/trendchart-promotion-blueprint.md`
- ROADMAP § M4
