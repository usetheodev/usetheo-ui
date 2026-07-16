---
slug: cost-token-visibility
milestone_id: M15
created_at: 2026-07-15
goal: Publicar TokenCostBreakdown (breakdown de tokens input/output/cache + custo) + PriceBreakdown (tabela de preço por-unidade/1K/1M) no @usetheo/ui, controlados/puros, e adotá-los em span/trace detail do theo-lens, com zero dependência nova.
---

# Plan: Cost & token visibility (M15)

> **Version 1.0** — V3. Fontes: phoenix `SpanTokenCosts.tsx`/`{Session,Trace}TokenCostsDetails.tsx` (breakdown por span/session/trace, ELv2 study-only) + langfuse `PriceBreakdownTooltip.tsx` (tabela de preço, MIT). Componentes controlados; o lens JÁ tem inputTokens/outputTokens/costUsd → adoção real. Zero dep nova.

## Goal
Fechar o gap de visibilidade de custo (os 2 concorrentes têm breakdown detalhado). 2 componentes, adoção imediata.

## Context
ROADMAP § M15 (V3). Dado de custo/tokens já no backend do lens.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/components/composites/{token-cost-breakdown,price-breakdown}/*`, `registry/*`. Editados: `src/index.ts`, `CHANGELOG.md`. Reuso: `cn`, `Badge`, padrão de formatação de custo do M9 (`formatDurationMs`-like).
### Current callers / dependents
Zero na lib (novos). Pós-adoção: `dashboard/src/pages/lens/trace-detail`/`span-detail` (inputTokens/outputTokens/costUsd já existem — `compare-core.ts:19-20`, `trace-detail.test.tsx:58`).
### Domain glossary
token breakdown = input/output/cache tokens (+ total); cost = custo em USD; price table = preço por-unidade/1K/1M por tipo de uso. Zeros honestos (0 real ≠ ausente=em-dash).
### Architecture boundaries affected
Ambos controlados/puros: recebem números via props, renderizam. Sem fetch (o consumidor traz os dados).

## Prior Art & Related Work
- V3 gap grill (`.claude/knowledge-base/grills/v3-sota-components-feature-grill.md`) — evidência file:line.
- phoenix `app/src/components/trace/SpanTokenCosts.tsx`, `{Session,Trace}TokenCostsDetails.tsx` (ELv2 study-only).
- langfuse `web/src/features/models/components/PriceBreakdownTooltip.tsx`, `PricePreview.tsx` (MIT).
- Padrão de custo honesto do M9 (`SessionSummary` — sums de zero honestos).

## Objective
- [ ] `TokenCostBreakdown` + `PriceBreakdown` publicados (stories+axe+testes+registry)
- [ ] Suíte da lib verde; typecheck/lint/format 0; `registry:validate` PASS
- [ ] theo-lens: adoção em span/trace detail (dado já existe) — 100% funcional com evidência
- [ ] North-star delta; zero dep nova

## Dependencies
Nenhuma dep NOVA (compõe primitivos existentes). `/deps-audit` plan-bound confirma.

## ADRs
### D1 — Controlados/puros, zeros honestos (padrão M9)
**Decision:** ambos recebem números via props; 0 real renderiza 0, ausente renderiza em-dash. **Rationale:** honestidade de métrica (regra do owner, padrão M9/SessionSummary). Alternativa: tratar 0 como ausente (rejeitada — mente).
### D2 — TokenCostBreakdown como `<dl>`/tabela a11y; PriceBreakdown responsivo
**Decision:** TokenCostBreakdown = `<dl>` (label→valor) ou `<table>`; PriceBreakdown = `<table>` de preço (colapsa em densidade baixa como langfuse). **Rationale:** a11y + paridade. Alternativa: só texto (rejeitada — perde estrutura sr).
### D3 — Zero dep; formatação reusa o padrão existente
**Decision:** formatação de custo/tokens reusa helpers existentes (ou um helper puro local mínimo); sem lib. **Rationale:** rung 4/5. Alternativa: lib de formatação (rejeitada — YAGNI).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| cache tokens nem sempre presentes | Low | campo opcional; ausente = em-dash honesto | Claude |
| precisão float de custo | Low | formatação consistente ($0.0000) reusando padrão M9 | Claude |
| duplicar `MetricCard` | Low | TokenCostBreakdown é breakdown multi-campo específico, não card único — verificado no review | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: TokenCostBreakdown (controlado)
F2: PriceBreakdown (controlado)
F3: registry + release-prep (F1,F2)
F4: adoção lens (span/trace detail) + north-star (F3 released)
```

## Phase 1: TokenCostBreakdown
### T1.0 — TokenCostBreakdown
#### Objective
`src/components/composites/token-cost-breakdown/`: props `{ inputTokens?, outputTokens?, cacheTokens?, totalTokens?, costUsd? }` (todos opcionais number); renderiza breakdown `<dl>`/tabela; zeros honestos, ausente=em-dash; forwardRef; data-slot.
#### Why this step (action + reasoning)
Entrega o breakdown de tokens/custo (gap phoenix); consome dado já existente no lens.
#### Evidence
V3 grill; phoenix `SpanTokenCosts.tsx`. Padrão M9 (zeros honestos).
#### Files to edit
`src/components/composites/token-cost-breakdown/{token-cost-breakdown.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `cn` (+ formatação local pura ou helper existente). Sem outros composites.
#### Deep Dives
todos ausentes → empty honesto; total ausente mas input+output presentes → soma exibida como derivada (rotulada); custo 0 real → $0.0000.
#### Tasks
1. RED: testes (campos presentes, zero honesto, ausente=em-dash, empty). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_renderiza_input_output_cache_e_custo`
- `test_zero_real_mostra_zero_nao_em_dash`
- `test_ausente_mostra_em_dash`
- Negativo: `test_todos_ausentes_empty_honesto`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/token-cost-breakdown` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: PriceBreakdown
### T2.0 — PriceBreakdown
#### Objective
`src/components/composites/price-breakdown/`: props `{ prices: Record<string, number>; unit?: string }` (preço por tipo de uso); renderiza tabela por-unidade/1K/1M; responsivo (colapsa); a11y; forwardRef.
#### Why this step (action + reasoning)
Complementa o breakdown com a tabela de preço (gap langfuse).
#### Evidence
langfuse `PriceBreakdownTooltip.tsx:16-114`.
#### Files to edit
`src/components/composites/price-breakdown/{price-breakdown.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `cn`; sem outros composites.
#### Deep Dives
prices vazio → empty honesto; escala 1/1K/1M computada por multiplicação simples (pura).
#### Tasks
1. RED: testes (linhas por preço, escala 1K/1M, empty). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_uma_linha_por_preco`
- `test_escala_1k_1m_correta` — preço × 1000 / × 1e6
- Negativo: `test_prices_vazio_empty`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/price-breakdown` → 0 failed (axe)
- `python3 .claude/skills/implement/scripts/mini_review.py cost-token-visibility --phase 2` → PASS OR gates diretos verdes
#### DoD
Barrel + CHANGELOG.

## Phase 3: Registry + release
### T3.0 — Registry + full gates
#### Objective
Itens `token-cost-breakdown` + `price-breakdown` (registry:ui, deps cn/tailwind-preset); build+validate; full suite/typecheck/lint/format.
#### Why this step (action + reasoning)
DoD exige registry válido.
#### Evidence
Precedente M8-M14.
#### Files to edit
`registry/{token-cost-breakdown,price-breakdown}.json` → build.
#### Deep file dependency analysis
deps: cn, tailwind-preset (+ badge se usado).
#### Tasks
1. RED: validate oráculo. 2. GREEN. 3. Full gates.
#### TDD
- `pnpm registry:build && registry:validate` → 0; full suite verde
#### Concurrency tests
(none)
#### Acceptance Criteria
- registry:validate → 0
#### DoD
Pronto p/ review + release.

## Phase 4: Adoção + north-star
### T4.0 — Adoção span/trace detail + north-star
#### Objective
No theo-lens: adotar `TokenCostBreakdown` em span/trace detail (inputTokens/outputTokens/costUsd já existem); suíte do dashboard verde; north-star.
#### Why this step (action + reasoning)
DoD do M15 = adoção com dado real (evidência).
#### Evidence
`compare-core.ts:19-20`, `trace-detail.test.tsx:58`.
#### Files to edit
(cross-repo) `dashboard/` span/trace detail + testes; bump se necessário (já em 0.26.0 — usar a versão da V3 quando publicada).
#### Deep file dependency analysis
mapear os campos de token/custo do span → props do TokenCostBreakdown.
#### Deep Dives
span sem breakdown → em-dash honesto (não 0 falso).
#### Tasks
1. Adotar em span/trace detail. 2. Testes. 3. Full suite. 4. North-star.
#### TDD
- `cd dashboard && pnpm vitest run <alvo>` → 0 failed
- `test_span_detail_mostra_token_cost_breakdown`
#### Concurrency tests
(none)
#### Acceptance Criteria
- suíte do dashboard verde; north-star audit
#### DoD
Commits pushed; north-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| TokenCostBreakdown publicado | T1.0 |
| PriceBreakdown publicado | T2.0 |
| Registry válido | T3.0 |
| Adoção lens + north-star | T4.0 |
| Zero dep nova | T1.0, T3.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T4.0).**

## Global Definition of Done
- [ ] `pnpm test:run && typecheck && lint && format:check && registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] Suíte do dashboard verde pós-adoção; north-star no audit
- [ ] CHANGELOG `[Unreleased]`; `/review` READY_TO_MERGE antes do release

## Failure scenarios (when I/O external)
(none — componentes controlados; sem I/O no DS)

## Critical paths (para mutation testing, se rodar)
`token-cost-breakdown.tsx` (lógica de zero-honesto vs em-dash) e `price-breakdown.tsx` (escala 1K/1M) — onde mutantes sobrevivem.

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: stories dos 2 com tema (visual+axe). 2. build+registry limpos. 3. Dashboard: span/trace detail com breakdown real. 4. Wiring triad.
