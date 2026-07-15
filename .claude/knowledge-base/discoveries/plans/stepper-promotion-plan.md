# Discovery Plan: Stepper / PipelineStatus — promoção do build-timeline (M4)

> **Version 1.1** (2026-07-15 — absorve EC-1/EC-2/EC-3 como checkpoints; EC-4 documentado no ADR D2) — Investigar o Stepper do Mantine (anatomia composta, máquina de estados por etapa, orientações) e o Tracker do tremor (sequência de status compacta) como referências SOTA para promover o padrão `build-timeline` do dashboard theo-cloud a um composite genérico `Stepper` no @usetheo/ui — estados pending/active/done/failed por etapa, orientações vertical/horizontal, timestamps opcionais e retry slot — validado contra os dois casos reais (build pipeline do dashboard; ingest pipeline do theo-rag).

**Slug:** `stepper-promotion`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 2.5h (ADR D1)

## Context

ROADMAP § M4 (deps: M0 ✅). Descoberta executada standalone via `cycle-discover` em pré-staging enquanto o PR #4 (M3, 0.19.0) aguarda merge — artefatos apenas em `.claude/` (precedente ADR D4 do plano M2/M3: nenhum commit de `src/` até o merge). Alvo do DoD: `Stepper` composite com estados por etapa (pending/active/done/failed), orientações horizontal/vertical, timestamps opcionais, suporte a etapa com erro + retry slot, e story de composição com `StatusDot`/`Badge` existentes.

Fonte a promover (verificada 2026-07-15): dashboard `src/components/deploy/build-timeline.tsx` (117 LoC — lista `<ol>` vertical estática, máquina `phaseState(index, status)` derivando `'pending'|'active'|'done'|'failed'|'cancelled'` por etapa a partir de um único `BuildStatus`), `build-step-card.tsx` (ícone de status + label truncado + timer + `aria-label` com classe do erro) e `build-timeline-live.tsx` (agrupamento por fase, SSE — o streaming FICA no consumidor; risco #2 do roadmap mitiga com componente controlado). Não existe Stepper/timeline local; vocabulário de status já existe em `StatusDot`/`StatusIndicator` (risco #1: reusar tokens `status-*`, não criar paleta).

Regras consumidas: `rules/testing.md § 4.1` (edge + negative), `rules/parsimony-ladder.md` (rungs 1-5 — zero deps novas esperadas; estudo SOTA antes da escrita), `rules/architecture.md § 3` (API pública mínima).

## Objective

Blueprint que fixe: anatomia composta e máquina de estados do Stepper (derivação `active index` → estado por etapa vs estado explícito por etapa), orientações, contrato de acessibilidade (lista ordenada vs `aria-current="step"`), fronteira controlado-vs-live, shape de testes (unit+axe+edge+negative) e entry de registry — sem incógnita para o `/to-plan` do M4.

- [ ] All research questions answered with citations to `.claude/knowledge-base/references/`
- [ ] Cross-cutting comparison table populated (mantine × tremor × build-timeline)
- [ ] Recommendations com ≥ 1 proposta concreta por questão
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/mantine/` | `packages/@mantine/core/src/components/Stepper/` (Stepper.tsx, Stepper.context.ts, StepperStep/, StepperCompleted/, Stepper.test.tsx, Stepper.story.tsx) | Única referência SOTA clonada com Stepper completo (anatomia composta + orientação + estados por etapa) |
| `.claude/knowledge-base/references/tremor/` | `src/components/Tracker/` (Tracker.tsx, tracker.spec.ts, tracker.stories.tsx) | Contraponto minimalista: sequência de status como visualização compacta (mesma família do nosso caso pipeline) |
| (interno) | `src/components/primitives/status-dot/`, `src/components/composites/status-indicator/`, `src/components/primitives/timestamp/`, `src/components/primitives/badge/` | Reuso obrigatório do vocabulário de status (risco #1 do roadmap) + timestamps opcionais + story de composição do DoD |
| (consumidor externo — ADR D3 M0-M2 reaplicado) | dashboard `src/components/deploy/{build-timeline,build-step-card,build-timeline-live}.tsx`; theo-rag `packages/core/src/contract/document/document-status.ts` + `packages/core/src/domain/pipeline/stages/` | Os dois casos reais do DoD (build pipeline; ingest pipeline) |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `.claude/knowledge-base/references/mantine/` fora de `components/Stepper/` | Demais componentes suportam outros milestones; hooks/estilos globais do Mantine não se transferem (CSS modules vs tailwind-preset) |
| Adotar `@mantine/core` como dependência | Decisão do roadmap: composite próprio nos nossos tokens (registry copy-pasteable); a referência é blueprint de design (mesmo ADR D2 do M2) |
| SSE/streaming/estado live (`build-timeline-live.tsx` como FEATURE) | Risco #2 do roadmap: componente controlado; streaming é responsabilidade do consumidor — o arquivo é lido só para DELIMITAR a fronteira |
| `BuildStepTimer` (cronômetro live do dashboard) | Estado interno com relógio — fica no consumidor; nosso slot recebe `Timestamp`/texto pronto |
| `.claude/knowledge-base/references/{shadcn-ui,base-ui,react-json-view,react-dropzone,tanstack-virtual,data-table-filters}/` | shadcn/base-ui NÃO têm stepper/timeline (verificado 2026-07-15 — ausência registrada); demais suportam M5-M6 |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** mantine Stepper 1.25h; tremor Tracker 0.25h; interno (status vocabulary + timestamp) 0.5h; consumidores externos (dashboard + theo-rag) 0.5h. Total 2.5h.

**Rationale:** o Stepper do Mantine é a única anatomia composta completa disponível — maior fatia (estados, orientação, contexto, testes). Tracker é leitura curta (1 arquivo + spec). Alternativas consideradas: split igual entre mantine e tremor (desperdiça — Tracker é ~100 LoC), pular tremor (perde o contraponto compacto que valida a decisão composite-vs-primitive), estudar libs não clonadas via web (rejeitada — referências locais bastam e o allowlist de web é para gaps).

**Stop condition — per question (mandatory):** Fase A vazia após 3 variantes de grep → BLOCKED "Fase A exhausted"; próxima questão. Nunca preencher com hotspots alheios.

**Stop condition — per project (mandatory):** budget exaurido → questões restantes BLOCKED; todos exauridos → `<promise>BLUEPRINT_BLOCKED</promise>` — nunca COMPLETE parcial.

**Anti-pattern:** fabricar Fase B (Unbreakable Rule 3).

**Consequences:** BLOCKED honestos viram seed da próxima descoberta.

### D2 — Mantine/tremor são blueprint de DESIGN, não fonte de código

**Decision:** estudar anatomia/estados/a11y/testes para informar implementação própria; NUNCA copiar código (MIT permite, mas o alvo usa nossos tokens/convenções — forwardRef, data-slot, cn, tailwind-preset).

**Rationale:** roadmap trava composite próprio + registry copy-pasteable; o valor das referências é o MAPA de decisões de API e edge cases que produção acumulou (Don't Reinvent *mal*). Alternativas: adotar dep (rejeitada — roadmap), portar só o build-timeline sem estudo SOTA (rejeitada — o build-timeline é caso ESPECÍFICO; generalizar sem contraponto SOTA produz API errada).

**Consequences:** blueprint entrega decisões de API com citação, não diffs de código.

### D3 — Consumidores externos lidos, não citados como referência

**Decision:** dashboard e theo-rag via path absoluto na seção "Consumer requirements" (mesmo ADR D3 dos M0-M2).

**Rationale/Consequences:** idem M0-M2 (golden rule de citações valida apenas paths sob `knowledge-base/references/`).

### D4 — Nenhum commit de código enquanto PR #4 está aberto

**Decision:** esta descoberta produz apenas artefatos `.claude/` (plan, blueprint); nenhum arquivo de `src/`/`registry/` é criado ou commitado até o merge do PR #4.

**Rationale:** commits em `develop` entram no PR develop→main aberto (verificado por cronologia git na review do M2). Alternativas: esperar o merge parado (desperdiça a janela), branch efêmera (viola single-trunk).

**Consequences:** `/to-plan` e ciclos seguintes do M4 só disparam após o merge do PR #4.

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Qual a anatomia composta e o modelo de estado do Stepper do Mantine (`active` index único derivando estado por etapa vs estado explícito por step; papel do `Stepper.context.ts`; `allowNextStepsSelect`/click)? | techniques | `.claude/knowledge-base/references/mantine/` | Grep `active\|state=\|getStepFragment` em `packages/@mantine/core/src/components/Stepper/Stepper.tsx` | Read `Stepper.tsx` + `Stepper.context.ts` + `StepperStep/StepperStep.tsx` | Decisão: derivar por índice (caso dashboard) vs aceitar estado por etapa (caso failed no meio) — assinatura mínima para o nosso |
| Q2 | Como o Mantine trata orientação (`orientation="vertical\|horizontal"`), ícones por estado (completedIcon/progressIcon), e o estado de erro (`color`? não há `error` nativo?) — o que falta para nosso requisito failed+retry slot? | techniques | `.claude/knowledge-base/references/mantine/` | Grep `orientation\|completedIcon\|iconPosition` em `Stepper/` | Read `StepperStep/StepperStep.tsx` + `Stepper.module.css` (seletores de orientação) | Tabela requisito DoD → suportado no Mantine? → gap nosso (failed, retry slot, timestamps) |
| Q3 | Como o Tracker do tremor modela uma sequência de status (array de `{color, tooltip}`? density) e o que isso valida sobre manter nosso Stepper como composite de ETAPAS ricas vs strip compacto? | techniques | `.claude/knowledge-base/references/tremor/` | Grep `interface\|type Tracker` em `src/components/Tracker/Tracker.tsx` | Read `Tracker.tsx` | Contraste de escopo: o que o Stepper NÃO precisa cobrir (strip compacto fica para StatusDot em linha) |
| Q4 | Que comportamentos os testes SOTA pinam (Stepper.test.tsx: render de steps, active, click callbacks; tracker.spec.ts) e o que nosso shape de teste deve cobrir (incl. axe, edge: 1 etapa, todas done; negative: índice fora do range, estado inválido)? | tests | `.claude/knowledge-base/references/mantine/` + `.claude/knowledge-base/references/tremor/` | Glob `Stepper/Stepper.test.tsx` + `Tracker/tracker.spec.ts` (verificados) | Read dos dois test files; extrair assertions de comportamento | Lista comportamento→assertion; marcar edges e negatives; contrato a11y a pinar (`aria-current="step"`? lista ordenada?) |
| Q5 | Deps: o que o Stepper do Mantine puxa (context factory, CSS module, hooks internos) que NÓS substituímos por primitivas locais (cn, tokens `status-*`, `Timestamp`) — confirmando zero deps novas? | deps | `.claude/knowledge-base/references/mantine/` | Grep `^import` em `Stepper/Stepper.tsx` e `StepperStep/StepperStep.tsx` | Mapear cada import → equivalente local (cn/cva/tokens) ou "não transferir" | Tabela import → substituto local → veredito (esperado: zero novas) |
| Q6 | Registry + stories: que casos o `Stepper.story.tsx` do Mantine demonstra (orientação, ícones, click) e como declarar `stepper` no nosso registry (registryDependencies por introspecção: status-dot? badge? timestamp?)? | tools | `.claude/knowledge-base/references/mantine/` | Grep `export const` em `Stepper/Stepper.story.tsx` | Mapear stories → nossos 3+ stories (build pipeline, ingest pipeline, composição StatusDot/Badge do DoD); draft do descriptor no shape local (`registry/trend-chart.json` como modelo M3) | Lista de stories + draft do descriptor |

**Consumer requirements (per D3, fora do budget):**

- Read `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-timeline.tsx` — máquina `phaseState` (done antes do active; failed trava fase corrente; cancelled na primeira), PHASES canônicas com label+description → shape `steps: {id, label, description?}[]` + derivação por status OU estado explícito.
- Read `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-step-card.tsx` — ícone por estado (Check/Loader2/X/CircleDashed), truncamento EC-14, `aria-label` com classe do erro → contrato de erro por etapa.
- Read `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/src/components/deploy/build-timeline-live.tsx` — o que FICA no consumidor (SSE, agrupamento por fase, skeleton, terminal-empty Red Team #122) → fronteira controlado-vs-live do nosso composite.
- Read `/home/paulo/Projetos/usetheo/theo-data/theo-rag/packages/core/src/contract/document/document-status.ts` — contrato público 5-state (`pending/processing/ready/failed/deleting`) + stages internos (`parse→chunk→embed→extract` em `packages/core/src/domain/pipeline/stages/`) → segundo caso real: mapear status público → etapas do Stepper.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4 | Covered |
| Dependencies | Q5 | Covered |
| Tools | Q6 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop checkpoints (para /discover-execute)

- Uma questão só é `done` com ≥ 1 citação `path:linha` verificada por Read na mesma iteração (nunca de memória).
- Q1/Q2 antes de Q4 (testes se leem com a anatomia já mapeada); Q3 e Q5/Q6 são independentes.
- Consumer requirements lidos ANTES das Recommendations (a API proposta deve citar os dois casos reais).
- Cada iteração atualiza o bloco de progresso do blueprint (questão → done/blocked + citações).
- **EC-1:** o `tracker.spec.ts` do tremor é Playwright e2e contra Storybook — ler como inventário de comportamento, NUNCA como shape de assertion transferível; o shape unit/RTL vem do Mantine + padrões M0-M3.
- **EC-2:** Mantine NÃO tem estado error/failed nativo (grep vazio verificado) — Q2 registra a ausência como evidência negativa honesta; o design do failed vem de `build-step-card.tsx` (consumidor real).
- **EC-3:** do `Stepper.test.tsx`, extrair só os 6 `it(` de comportamento próprio — `tests.itSupportsSystemProps` (harness `@mantine-tests/core`) não conta como cobertura SOTA na comparison table.

## Acceptance Criteria

- [ ] 6/6 questões `done` (ou `blocked` com razão honesta) — `grep -c '^| Q' blueprint` cobre todas
- [ ] Todas as citações de referência do blueprint resolvem em disco (`check_reference_citations.py` PASS)
- [ ] 4 coverage corners populados no blueprint (`check_research_coverage.py` PASS)
- [ ] ≥ 1 ADR no blueprint (decisão de API: derivação-por-índice vs estado-explícito é a decisão central)
- [ ] Comparison table mantine × tremor × build-timeline presente
- [ ] `/discover-confidence stepper-promotion` ≥ SHIPPABLE_WITH_CAVEATS (89)

## Global Definition of Done

Blueprint em `.claude/knowledge-base/discoveries/blueprints/stepper-promotion-blueprint.md` com verdict ≥ `SHIPPABLE_WITH_CAVEATS` por `/discover-confidence` (thresholds: `rules/discover-blueprint-thresholds.txt`; golden rule: `rules/discover-blueprint-golden-rule.md`). O blueprint alimenta o `/to-plan` do M4 — que só dispara após o merge do PR #4 (ADR D4).
