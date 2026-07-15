---
slug: adoption-dedup
milestone_id: M7
created_at: 2026-07-15
goal: Fechar o loop de reuso levando dashboard e studio a 0.22.0 com os hand-rolled deletados e o Tier-1 em telas reais, com o delta north-star registrado.
---

# Plan: Adoção e dedup nos consumidores (M7)

> **Version 1.1** (absorve EC-1 do edge-case review como checkpoint do T3.2) — Executa o blueprint do M7 (`adoption-dedup`, SHIPPABLE 100): sequência de PRs por consumidor (ADR D1 do blueprint — bump primeiro, dedup depois), 2 deleções secas de dead code verificado 2×, migração do pivot split (7 símbolos → `@theokit/ui`), Tier-1 do studio com casos de uso reais e o delta north-star medido com os comandos literais do baseline. CROSS-REPO: os commits de código acontecem nos repos dashboard/studio (ciclos próprios); esta lib recebe o audit north-star e o fechamento do milestone.

## Goal

Enable os dois consumidores a rodar `@usetheo/ui@0.22.0` com os hand-rolled correspondentes DELETADOS, measured by suites dos consumidores verdes (`pnpm vitest run` em cada repo, exit 0) e o delta north-star registrado em `.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` (baseline 46 símbolos/177 imports → alvo ≥ 50 símbolos e arquivos hand-rolled = 0).

## Context

ROADMAP § M7 (deps M0-M6; M6 em release PR #7). Blueprint: custo real do skew do dashboard é o pivot split (7 símbolos de `@theokit/ui`, dep ausente), NÃO o breaking 0.15.0 (neutralizado por guard local); 2 dos 5 hand-rolled são dead code (zero callers, verificado 2×); studio precisa CRIAR o painel de params do playground (não existe tela); maior risco de teste é a convenção testid→data-slot em 2 suites do dashboard.

## Baseline Context (deep review of current state)

### Files that will be touched

| Repo/File | Estado (verificado 2026-07-15) | Invariants |
|---|---|---|
| dashboard `package.json:79` | `@usetheo/ui@^0.13.2`; SEM `@theokit/ui` | bump p/ ^0.22.0 + dep nova @theokit/ui |
| dashboard 8 arquivos do pivot (main.tsx:4, preview.tsx:7, test/render.tsx:5, 3 testes lens, memory.tsx:4, billing.tsx:4) | importam 7 símbolos órfãos em 0.22.0 | retarget para @theokit/ui |
| dashboard `metric-trend-chart.tsx` + 3 páginas lens + `lens.test.tsx` | MIGRAR → TrendChart (yFormat→valueFormatter; testid→data-slot) | suites verdes |
| dashboard `build-timeline-live.tsx`+`build-step-card.tsx`+timer + 2 páginas | MIGRAR render → Stepper (SSE fica; status queued/running/succeeded→pending/active/done) | suites verdes |
| dashboard `trace-detail/breadcrumb.tsx` + index | MIGRAR → Breadcrumb (Link asChild); `ancestors()`+hooks FICAM | trace-detail.test.tsx:600-610 adaptado |
| dashboard `build-timeline.tsx` (estático) + `virtual-table.{tsx,test.tsx}` + stories | **DELETAR** (zero callers 2×) | — |
| studio `packages/studio/package.json:16` | `^0.17.0` | bump ^0.22.0 (additive) |
| studio `pages/events/index.tsx:96-97` | `<pre>{JSON.stringify}` | JsonViewer + DescriptionList |
| studio `pages/playground/` | SEM painel de params | CRIAR painel com Slider+Combobox (ADR D3 do blueprint do M7) |
| (lib) `.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` (NEW) | — | baseline + delta com comandos literais |

### Current callers / dependents

Inventário completo file:line no blueprint (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` § Corner 4 Q2) — re-verificar cada call site imediatamente antes de cada PR (EC-2 do discovery: repos com ciclos próprios).

### Domain glossary

- **pivot split** — símbolos de tema/AI (`TheoUIProvider`, `violetForge`, `ThemeProvider`, `TokenUsageChart`, `UsageMeter`) que migraram para `@theokit/ui` no pivot; o dashboard em 0.13.2 ainda os importa de `@usetheo/ui`.
- **deleção seca** — remoção de arquivo com zero callers de produção (sem substituição em call site).
- **north-star** — símbolos únicos de `@usetheo/ui` importados por consumidor (comandos literais no blueprint do M7, Corner 3).

### Architecture boundaries affected

Nenhuma na lib (zero código novo aqui além do audit). Nos consumidores: −5 arquivos hand-rolled, +1 dep (@theokit/ui no dashboard).

## Prior Art & Related Work

- **Internal blueprint:** `.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — inventário com veredito por componente, tabela de migração, checklist Tier-1, comandos north-star.
- **Patterns skills:** (nenhuma — verificado).
- **Reference projects:** (não se aplica — adoção interna; deferral no ADR D2 do discovery plan).

## Objective

- [ ] Dashboard em `@usetheo/ui@^0.22.0` + `@theokit/ui` com os 7 retargets; suíte verde (PR-0).
- [ ] TrendChart, Stepper e Breadcrumb adotados no dashboard com os hand-rolled deletados; suites migradas para data-slot (PR-1..3).
- [ ] `build-timeline.tsx` estático e `virtual-table.{tsx,test.tsx}` deletados (PR-4).
- [ ] Studio em ^0.22.0; JsonViewer no event inspector + DescriptionList em detail; painel de params do playground com Slider+Combobox (PR-0..2 studio).
- [ ] Delta north-star registrado em audit na lib.

## Dependencies

### Existing — use as-is

| Package | Version | Ecosystem | Why |
|---|---|---|---|
| `@usetheo/ui` | `^0.22.0` | npm | O produto deste roadmap |
| `@theokit/ui` | latest publicada | npm | Destino dos 7 símbolos do pivot (dashboard) |

### New — to be introduced

| Package | Version | Ecosystem | Rule 9 rationale | Why this one |
|---|---|---|---|---|
| `@theokit/ui` (no dashboard) | latest | npm | Não é lib de terceiro — é a camada AI do próprio ecossistema; única fonte dos símbolos movidos | pivot split |

### Removed

| Package | Last version | Why removed |
|---|---|---|
| (none) | | |

## ADRs

### D1 — Sequenciamento por PRs pequenos, bump primeiro (consome blueprint ADR D1)

**Decision:** dashboard PR-0 (bump+retarget) → PR-1 TrendChart → PR-2 Stepper → PR-3 Breadcrumb → PR-4 deleções; studio PR-0 → PR-1 inspector → PR-2 playground. Cada PR = 1 task com a suíte do consumidor como oracle.

**Rationale:** bump é pré-condição de todo dedup; PRs pequenos mantêm as suites como prova e o review dos repos consumidores viável.

**Alternatives considered:** PR único por repo (rejeitado — quebras de suites misturadas); dedup via copy-paste antes do bump (rejeitado — duplica a fonte que o M7 deleta).

### D2 — Deleções secas sem substituto (consome blueprint ADR D2)

**Decision:** `build-timeline.tsx` estático e `virtual-table.*` saem como dead code.

**Rationale:** zero callers verificado 2× (grep independente); Rule 2 mede deleção. **Alternatives:** migrá-los "por completude" (rejeitado — YAGNI; a lib já cobre os casos forward-looking).

### D3 — Playground ganha o caso de uso junto (consome blueprint ADR D3)

**Decision:** Slider/Combobox entram criando o painel de params (temperature/top-p/model picker).

**Rationale:** DoD b3 pede uso REAL; adoção decorativa violaria o north-star. **Alternatives:** bloquear Tier-1 até o studio criar a tela (rejeitado — o M7 fecha exatamente esse loop).

### D4 — Wiring triad adaptada ao cross-repo

**Decision:** (a) caller = telas reais dos consumidores; (b) integration = suites dos consumidores verdes; (c) métrica = delta north-star no audit.

**Rationale:** o M7 É o pilar (a) do roadmap inteiro — a prova material do north-star. **Alternatives:** exigir a tríade da lib (rejeitado — não há código novo na lib).

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Repos consumidores têm ciclos/reviews próprios — PRs podem esperar | Medium | PRs pequenos e independentes (D1); M7 aceita "PRs merged OU abertos" (DoD do ROADMAP) | Paulo |
| Suites do dashboard acopladas a testids (2 suites) | Medium | Migração de seletores DENTRO do PR do componente (mapa de suites no blueprint do M7, Corner 1) | Claude |
| `@theokit/ui` latest pode ter divergido dos 7 símbolos | Medium | PR-0 verifica símbolo a símbolo no barrel da @theokit/ui antes do retarget | Claude |
| Inventário do blueprint pode ter envelhecido (EC-2 do discovery) | Low | Re-verificação por grep imediatamente antes de cada PR | Claude |

## Unresolved Questions

(none — every decision is resolved at plan time)

## Dependency Graph

```
T1.0 (audit baseline, lib) → Dashboard: T2.0 bump → {T2.1 TrendChart → T2.2 Stepper → T2.3 Breadcrumb} → T2.4 deleções
                           → Studio: T3.0 bump → T3.1 inspector → T3.2 playground
→ T4.0 (delta north-star, lib) → Final Validation
```

## Phase 1: Baseline (lib)

### T1.0 — Audit north-star baseline

#### Objective
`.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` com baseline + comandos literais.

#### Why this step (action + reasoning — ReAct discipline)
1. **What:** persiste os números do blueprint (46/177/174 + por repo) com os comandos reprodutíveis.
2. **Why now:** o delta do T4.0 precisa do baseline registrado ANTES da adoção (irrecuperável depois). Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Corner 3) e D4.

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Corner 3, comandos executados 2026-07-15).

#### Files to edit
```
.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md — (NEW)
```

#### Deep file dependency analysis
- Artefato documental; nenhum código.

#### Deep Dives
(nenhum)

#### Tasks
1. Persistir baseline.

#### TDD
```
RED: test_northstar_baseline_file_exists() — `test -f .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md && grep -c "46" $_` ≥ 1 (gate documental)
VERIFY: grep -q "comandos" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -cE "46|177|174" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` ≥ 3 (baseline por repo + união) e `grep -c "grep -rhozE" $_` ≥ 1 (comandos literais)

#### DoD
- [ ] Commitado na lib

## Phase 2: Dashboard (cross-repo — commits no repo dashboard)

### T2.0 — PR-0: bump 0.22.0 + @theokit/ui + retarget dos 7

#### Objective
Dashboard compila e suíte verde em `@usetheo/ui@^0.22.0`.

#### Why this step (action + reasoning)
1. **What:** verifica os 7 símbolos no barrel da `@theokit/ui` latest; adiciona a dep; retarget dos imports nos 8 arquivos; bump; roda a suíte; documenta a migração 0.15.0 como no-op (guard) no corpo do PR — cumpre DoD b1.
2. **Why now:** pré-condição de todo dedup (D1). Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Corner 2 e Q1).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Corner 2, skew; Q1, tabela sítio→ação com file:line).

#### Files to edit
```
(dashboard) package.json — deps
(dashboard) src/main.tsx, .storybook/preview.tsx, src/test/render.tsx, 3 testes lens, src/pages/memory.tsx, src/pages/billing.tsx — retarget
```

#### Deep file dependency analysis
- Harness de teste (render.tsx) afeta TODAS as suítes — retarget primeiro, rodar tudo.

#### Deep Dives
- Se um dos 7 símbolos divergiu na @theokit/ui (risco #3), HALT do task e surface ao humano com o diff.

#### Tasks
1. Verificação símbolo a símbolo; 2. deps+retarget; 3. suíte.

#### TDD
```
RED: test_dashboard_compiles_on_0_22() — no repo dashboard: `pnpm typecheck` FALHA antes do retarget (7 símbolos órfãos) e PASSA depois
VERIFY: (dashboard) pnpm typecheck && pnpm vitest run
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (dashboard) `pnpm typecheck` exit 0 e `pnpm vitest run` exit 0
- [ ] (dashboard) `grep -c '"@usetheo/ui": "\^0.22' package.json` == 1

#### DoD
- [ ] `gh pr list -R usetheodev/theo-cloud --search "usetheo/ui 0.22"` lista o PR-0 com a nota 0.15.0 no corpo

### T2.1 — PR-1: TrendChart substitui metric-trend-chart

#### Objective
3 páginas lens no TrendChart da lib; `metric-trend-chart.{tsx,test.tsx}` deletados.

#### Why this step (action + reasoning)
1. **What:** troca imports (rename + `yFormat`→`valueFormatter`), migra `lens.test.tsx` de testids `trend-*` para `data-slot="trend-chart*"`, deleta o componente + teste local.
2. **Why now:** primeiro dedup (componente promovido DESTE arquivo — delta mínimo). Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2 e Q3).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2 linha 1, deltas; Q3, suites afetadas: lens.test.tsx QUEBRA, dashboards/evaluators sobrevivem).

#### Files to edit
```
(dashboard) src/pages/lens.tsx, lens/evaluators.tsx, lens/dashboards.tsx, lens/dashboards/widgets.ts, components/lens/lens-series.ts — imports/props
(dashboard) src/pages/lens.test.tsx — seletores data-slot
(dashboard) src/components/lens/metric-trend-chart.{tsx,test.tsx} — DELETE
```

#### Deep file dependency analysis
- `lens-series.ts` importa type — `TrendSeries` da lib é assinatura idêntica (blueprint).

#### Deep Dives
(nenhum)

#### Tasks
1. Imports+props; 2. seletores; 3. delete; 4. suíte.

#### TDD
```
RED: test_lens_uses_lib_trendchart() — (dashboard) `grep -r "metric-trend-chart" src/` retorna vazio APÓS o task (e a suíte lens passa com data-slot)
VERIFY: (dashboard) pnpm vitest run src/pages/lens* && git log --diff-filter=D --name-only -1 | grep metric-trend-chart
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (dashboard) `grep -rl "metric-trend-chart" src/ | wc -l` == 0
- [ ] (dashboard) `pnpm vitest run src/pages/lens` exit 0

#### DoD
- [ ] `gh pr list -R usetheodev/theo-cloud --search "TrendChart"` lista o PR-1

### T2.2 — PR-2: Stepper substitui build-step-card no render do live

#### Objective
`build-timeline-live` renderiza via `Stepper` da lib; `build-step-card.{tsx,test.tsx}` deletados; timer vira slot timestamp.

#### Why this step (action + reasoning)
1. **What:** mapeia `BuildStep[]`→`StepperStepData[]` (vocabulário queued/running/succeeded→pending/active/done; failed igual; causa no description — padrão da lib), `BuildStepTimer` entra pelo slot `timestamp`, migra assertions do card para data-slot.
2. **Why now:** segundo dedup; SSE/agrupamento FICAM (fronteira fixada no blueprint do M7). Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2 linha 3).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2, delta detalhado; Q3, suites live/card/timer).

#### Files to edit
```
(dashboard) src/components/deploy/build-timeline-live.tsx — render via Stepper
(dashboard) src/components/deploy/build-step-card.{tsx,test.tsx} — DELETE
(dashboard) build-timeline-live.test.tsx — seletores stepper-*
```

#### Deep file dependency analysis
- `build-step-timer.tsx` FICA (alimenta o slot timestamp).

#### Deep Dives
(nenhum)

#### Tasks
1. Mapper; 2. render; 3. delete card; 4. suites.

#### TDD
```
RED: test_timeline_live_renders_lib_stepper() — (dashboard) live test asserta [data-slot="stepper-step"] e `grep -r "build-step-card" src/` vazio ao final
VERIFY: (dashboard) pnpm vitest run src/components/deploy/
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (dashboard) `grep -rl "build-step-card" src/ | wc -l` == 0 e `pnpm vitest run src/components/deploy` exit 0

#### DoD
- [ ] PR aberto com a deleção incluída

### T2.3 — PR-3: Breadcrumb da lib no trace-detail

#### Objective
Breadcrumb hand-rolled do trace-detail substituído (`Link asChild` para crumbs clicáveis); helper `ancestors()` e hooks preservados no dashboard.

#### Why this step (action + reasoning)
1. **What:** re-render sobre `Breadcrumb.List/Item/Link/Page/Separator`; preserva testids no wrapper OU migra `trace-detail.test.tsx:600-610`.
2. **Why now:** fecha o Tier-1 do dashboard. Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2 linha 5).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2 e Q3, trace-detail).

#### Files to edit
```
(dashboard) src/pages/lens/trace-detail/breadcrumb.tsx — reescrito sobre a lib (mantém ancestors + hooks) OU deletado com lógica movida
(dashboard) trace-detail.test.tsx — seletores
```

#### Deep file dependency analysis
- `useSelection`/`useSpanKeyboardNav` são exports do mesmo arquivo — mover para módulo próprio se o arquivo for deletado.

#### Deep Dives
(nenhum)

#### Tasks
1. Re-render; 2. seletores; 3. suíte.

#### TDD
```
RED: test_trace_breadcrumb_uses_lib() — (dashboard) trace-detail asserta [data-slot] do Breadcrumb da lib (ou aria-current="page") e o markup hand-rolled some
VERIFY: (dashboard) pnpm vitest run src/pages/lens/trace-detail*
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (dashboard) `pnpm vitest run src/pages/lens/trace-detail` exit 0 com asserts no primitive da lib

#### DoD
- [ ] `gh pr list -R usetheodev/theo-cloud --search "Breadcrumb"` lista o PR-3

### T2.4 — PR-4: deleções secas

#### Objective
`build-timeline.tsx` (estático) + stories e `virtual-table.{tsx,test.tsx}` removidos.

#### Why this step (action + reasoning)
1. **What:** deleção pura (D2); re-verifica zero callers por grep no momento do PR.
2. **Why now:** por último — zero risco, zero dependência.

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q2, zero callers verificado 2×); re-grep no ato (EC-2).

#### Files to edit
```
(dashboard) src/components/deploy/build-timeline.tsx + build-timeline.stories.tsx — DELETE
(dashboard) src/components/data/virtual-table.{tsx,test.tsx} — DELETE
```

#### Deep file dependency analysis
- Grep de importadores DEVE voltar vazio antes do delete (gate do task).

#### Deep Dives
(nenhum)

#### Tasks
1. Re-grep; 2. delete; 3. suíte total.

#### TDD
```
RED: test_dead_code_removed() — (dashboard) `grep -rE "build-timeline'|virtual-table" src/ --include='*.ts*'` vazio pós-delete; `pnpm vitest run` exit 0
VERIFY: (dashboard) pnpm typecheck && pnpm vitest run
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (dashboard) `pnpm typecheck && pnpm vitest run` exit 0 sem os 4 arquivos

#### DoD
- [ ] `gh pr list -R usetheodev/theo-cloud --search "dead code"` lista o PR-4

## Phase 3: Studio (cross-repo)

### T3.0 — PR-0: bump ^0.22.0

#### Objective
Studio em 0.22.0 (skew additive — sem retarget).

#### Why this step (action + reasoning)
1. **What:** bump + suíte. 2. **Why now:** pré-condição do Tier-1 (JsonViewer/DescriptionList/FileDropzone só existem ≥0.18).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Corner 2: studio 0.17.0, additive-only).

#### Files to edit
```
(studio) packages/studio/package.json — bump
```

#### Deep file dependency analysis
- 9 símbolos em uso — todos existem em 0.22.0.

#### Deep Dives
(nenhum)

#### Tasks
1. Bump; 2. suíte.

#### TDD
```
RED: test_studio_green_on_0_22() — (studio) `pnpm vitest run` exit 0 pós-bump
VERIFY: (studio) pnpm typecheck && pnpm vitest run
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (studio) `pnpm typecheck && pnpm vitest run` exit 0 em ^0.22.0

#### DoD
- [ ] `gh pr list -R usetheodev/theokit-studio --search "0.22"` lista o PR-0

### T3.1 — PR-1: JsonViewer no event inspector + DescriptionList em detail

#### Objective
`pages/events/index.tsx:96-97` troca `<pre>` por `JsonViewer`; detail view ganha `DescriptionList`.

#### Why this step (action + reasoning)
1. **What:** substituição no call site concreto identificado + composição DetailPanel (padrão da story do M2).
2. **Why now:** os dois alvos Tier-1 com call site EXISTENTE. Cita o blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q6).

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q6, alvo concreto com file:line; gaps com greps).

#### Files to edit
```
(studio) packages/studio/src/pages/events/index.tsx — JsonViewer + DescriptionList
(studio) testes vizinhos — asserts
```

#### Deep file dependency analysis
- Payloads de evento reais (JSONB) — collapsed por profundidade como default.

#### Deep Dives
(nenhum)

#### Tasks
1. Substituição; 2. asserts; 3. suíte.

#### TDD
```
RED: test_event_inspector_uses_jsonviewer() — (studio) events page asserta [data-slot="json-viewer"] e o <pre> some
VERIFY: (studio) pnpm vitest run packages/studio/src/pages/events
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (studio) `grep -rc "JSON.stringify(event" packages/studio/src/pages/events | wc -l` == 0 e `pnpm vitest run packages/studio/src/pages/events` exit 0

#### DoD
- [ ] `gh pr list -R usetheodev/theokit-studio --search "JsonViewer"` lista o PR-1

### T3.2 — PR-2: painel de params do playground (Slider + Combobox)

#### Objective
Playground ganha painel real (temperature/top-p via Slider; model picker via Combobox).

#### Why this step (action + reasoning)
1. **What:** CRIA o painel (D3) ligado ao estado do playground; testes de comportamento.
2. **Why now:** fecha o Tier-1; uso real, não decorativo.

#### Evidence
blueprint do M7 (`.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` — Q6, playground sem params com greps vazios) e ADR D3.

#### Files to edit
```
(studio) packages/studio/src/pages/playground/ — painel novo + wiring ao estado
(studio) testes do playground — comportamento
```

#### Deep file dependency analysis
- Estado do playground existente define onde os params entram (ler no ato). **EC-1:** se não existir caminho de request para wiring REAL, HALT e surface ao humano (painel decorativo violaria D3).

#### Deep Dives
(nenhum)

#### Tasks
1. Painel; 2. wiring; 3. testes.

#### TDD
```
RED: test_playground_params_panel_controls_request() — (studio) mover Slider muda o valor enviado/exibido; Combobox seleciona modelo
VERIFY: (studio) pnpm vitest run packages/studio/src/pages/playground
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] (studio) `pnpm vitest run packages/studio/src/pages/playground` exit 0 com asserts em `[data-slot="slider"]` e combobox

#### DoD
- [ ] `gh pr list -R usetheodev/theokit-studio --search "playground"` lista o PR-2

## Phase 4: Fechamento (lib)

### T4.0 — Delta north-star

#### Objective
Audit atualizado com os números pós-adoção (mesmos comandos).

#### Why this step (action + reasoning)
1. **What:** re-roda os comandos do T1.0 nos dois repos; registra delta + lista de arquivos deletados. 2. **Why now:** DoD b4; fecha D4 pilar (c).

#### Evidence
T1.0 baseline.

#### Files to edit
```
.claude/knowledge-base/audits/adoption-northstar-2026-07-15.md — seção delta
```

#### Deep file dependency analysis
- Documental.

#### Deep Dives
(nenhum)

#### Tasks
1. Re-medição; 2. delta.

#### TDD
```
RED: test_northstar_delta_recorded() — `grep -c "delta" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` ≥ 1 com números pós-adoção
VERIFY: grep -q "hand-rolled deletados" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md
```

#### Concurrency tests

(none — single-threaded)

#### Acceptance Criteria
- [ ] `grep -c "delta" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` ≥ 1 com números por repo e SHAs dos PRs listados

#### DoD
- [ ] Commitado na lib

## Coverage Matrix

| # | Gap / Requirement (fonte) | Task(s) | Resolution |
|---|---|---|---|
| 1 | Dashboard bump 0.13.2→corrente com migração 0.15.0 documentada e aplicada (M7 DoD b1) | T2.0 | Bump + retarget dos 7 + nota no-op do guard no PR |
| 2 | metric-trend-chart, build-timeline, virtual-table e breadcrumb substituídos/deletados (M7 DoD b2) | T2.1, T2.2, T2.3, T2.4 | 3 migrações + 2 deleções secas (vereditos do blueprint) |
| 3 | Studio Tier-1 em uso real (M7 DoD b3) | T3.0, T3.1, T3.2 | Breadcrumb já ✅ (M0); JsonViewer/DescriptionList no inspector; Slider/Combobox no painel criado |
| 4 | Contagem north-star baseline vs pós-adoção em knowledge-base/audits (M7 DoD b4) | T1.0, T4.0 | Comandos literais + delta |
| 5 | Risco cross-repo (PRs em repos com ciclos próprios) | T2.0, T2.1, T2.2, T2.3, T2.4, T3.0, T3.1, T3.2 | PRs pequenos independentes; DoD aceita "merged OU abertos" |

**Coverage: 5/5 gaps covered (100%)**

## Global Definition of Done

- [ ] `pnpm vitest run` exit 0 nos DOIS repos consumidores (comandos por task)
- [ ] `grep -rlE "metric-trend-chart|build-step-card|virtual-table" <dashboard>/src | wc -l` == 0 (5 hand-rolled fora: 3 migrados + 2 dead)
- [ ] `grep -cE "baseline|delta" .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md` ≥ 2
- [ ] `git diff --stat v0.22.0..HEAD -- src/` vazio na lib (código intocado; só audit)
- [ ] `grep -c "pull/" .claude/knowledge-base/roadmap-runs/M7-*.md` ≥ 7 (PRs listados no run-file)

## Failure scenarios (when I/O external)

(none — no external I/O touched; instalação npm dos consumidores é o fluxo normal de deps)

## Final Phase: Integration Validation (MANDATORY)

### Execution

```
(dashboard) pnpm typecheck && pnpm vitest run
(studio) pnpm typecheck && pnpm vitest run
(lib) test -f .claude/knowledge-base/audits/adoption-northstar-2026-07-15.md
```

### Acceptance Criteria

- [ ] Ambas as suítes de consumidor exit 0
- [ ] Audit com delta presente
- [ ] Failure scenarios: `(none)` declarado

### If Validation Fails

1. Task do PR afetado volta; 2. Fix no repo consumidor; 3. Re-run; 4. Documentar.
