---
slug: severity-badge
milestone_id: M16
created_at: 2026-07-15
goal: Publicar SeverityBadge (mapeia enum de severidade → variant do Badge) no @usetheo/ui, reusando o Badge existente, e adotá-lo no alerts.tsx do theo-lens, zero dep nova.
---

# Plan: SeverityBadge (M16)

> **Version 1.0** — V3. Fonte: langfuse `MonitorSeverityBadge.tsx:37-72` (MIT). Reusa o `Badge` do DS (variants já existem). Adotável já no `alerts.tsx` (≥2 telas com monitors futuro). Zero dep, zero primitivo novo.

## Goal
Átomo de severidade reusável (alerts/monitors/anomalies), adoção imediata no alerts.tsx.

## Context
ROADMAP § M16 (V3). O lens já renderiza status de alerta com mapping local.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/components/composites/severity-badge/*`, `registry/severity-badge.json`. Editados: `src/index.ts`, `CHANGELOG.md`. Reuso: `Badge` (`src/components/primitives/badge/`).
### Current callers / dependents
Zero na lib (novo). Pós-adoção: `dashboard/src/pages/lens/alerts.tsx:38-43,224` (substitui `alertStatusVariant`).
### Domain glossary
severity = nível multi-estado (OK/WARNING/ALERT/NO_DATA/UNKNOWN/PAUSED); variant = estilo do Badge (success/warning/destructive/outline/etc.).
### Architecture boundaries affected
Controlado/puro: recebe `severity` (+ opcional label override) via prop; mapeia → Badge. Sem estado.

## Prior Art & Related Work
- V3 gap grill. langfuse `MonitorSeverityBadge.tsx`. `Badge` primitivo (variants existentes). `StatusIndicator` (composite existente — verificar não-duplicação no review).

## Objective
- [ ] `SeverityBadge` publicado (stories+axe+testes+registry)
- [ ] typecheck/lint/format 0; `registry:validate` PASS
- [ ] theo-lens: adoção em `alerts.tsx` (substitui mapping local) — 100% funcional
- [ ] North-star delta; zero dep nova

## Dependencies
Nenhuma dep NOVA (compõe `Badge`). `/deps-audit` plan-bound confirma.

## ADRs
### D1 — Mapa severity→variant fechado + override aberto
**Decision:** enum default `SeveritySeverity = "ok"|"warning"|"alert"|"no_data"|"unknown"|"paused"` → variant do Badge; prop opcional `label`/`variantMap` p/ override. **Rationale:** vocabulário pode divergir entre alerts/monitors (risco do ROADMAP). Alternativa: enum rígido (rejeitada — acopla).
### D2 — Reusa Badge, não novo primitivo (não duplica StatusIndicator)
**Decision:** compõe `Badge`; SeverityBadge é especialização de severidade multi-nível. **Rationale:** rung 4; StatusIndicator é dot de status, não badge de severidade rotulado. Verificado no review. Alternativa: estender StatusIndicator (rejeitada — semânticas distintas).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| vocabulário de severidade diverge | Medium | ADR D1: mapa override via prop | Claude |
| duplicar StatusIndicator | Low | verificado no review (dot vs badge rotulado multi-nível) | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: SeverityBadge (controlado, compõe Badge)
F2: registry + release-prep (F1)
F3: adoção alerts.tsx + north-star (F2 released)
```

## Phase 1: SeverityBadge
### T1.0 — SeverityBadge
#### Objective
`src/components/composites/severity-badge/`: prop `{ severity: Severity; label?: string; variantMap?; className? }`; mapeia severity→variant do Badge; label default derivado do enum (capitalizado); forwardRef; data-slot.
#### Why this step (action + reasoning)
Entrega o átomo; reusa Badge.
#### Evidence
langfuse `MonitorSeverityBadge.tsx:37-72`. `Badge` variants.
#### Files to edit
`src/components/composites/severity-badge/{severity-badge.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Badge` + `cn`; sem outros composites.
#### Deep Dives
severity desconhecida → variant neutro (outline) honesto, não crash; label override respeitado; alert→destructive, warning→warning, ok→success, paused/no_data/unknown→outline/muted.
#### Tasks
1. RED: testes (cada severity→variant certo, label default, override, desconhecida→neutro). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_alert_mapeia_destructive`
- `test_ok_mapeia_success`
- `test_warning_mapeia_warning`
- `test_severity_desconhecida_variant_neutro`
- `test_label_override_respeitado`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/severity-badge` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: Registry + release
### T2.0 — Registry + full gates
#### Objective
Item `severity-badge` (registry:ui, deps cn/badge/tailwind-preset); build+validate; full gates.
#### Why this step (action + reasoning)
DoD exige registry válido.
#### Evidence
Precedente M8-M15.
#### Files to edit
`registry/severity-badge.json` → build.
#### Deep file dependency analysis
deps: cn, badge, tailwind-preset.
#### Tasks
1. validate oráculo. 2. descriptor+build. 3. Full gates.
#### TDD
- `registry:build && validate` → 0; full suite verde
#### Concurrency tests
(none)
#### Acceptance Criteria
- registry:validate → 0
#### DoD
Pronto p/ review + release.

## Phase 3: Adoção + north-star
### T3.0 — Adoção alerts.tsx + north-star
#### Objective
No theo-lens: `alerts.tsx` usa `SeverityBadge` no lugar do `alertStatusVariant` local; suíte verde; north-star.
#### Why this step (action + reasoning)
DoD = adoção com dado real.
#### Evidence
`alerts.tsx:38-43,224`.
#### Files to edit
(cross-repo) `dashboard/src/pages/lens/alerts.tsx` + teste.
#### Deep file dependency analysis
mapear status do alerta → severity do SeverityBadge.
#### Deep Dives
disabled → paused/outline honesto; TRIGGERED → alert; OK → ok.
#### Tasks
1. Adotar. 2. Testes. 3. Full suite. 4. North-star.
#### TDD
- `cd dashboard && pnpm vitest run src/pages/lens/alerts` → 0 failed
#### Concurrency tests
(none)
#### Acceptance Criteria
- suíte do dashboard verde; north-star
#### DoD
Commits pushed; north-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| SeverityBadge publicado | T1.0 |
| Registry válido | T2.0 |
| Adoção alerts.tsx + north-star | T3.0 |
| Zero dep nova | T1.0, T2.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T3.0).**

## Global Definition of Done
- [ ] `pnpm test:run && typecheck && lint && format:check && registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] Suíte do dashboard verde pós-adoção; north-star
- [ ] CHANGELOG `[Unreleased]`; `/review` READY_TO_MERGE antes do release

## Failure scenarios (when I/O external)
(none — componente controlado)

## Critical paths (para mutation testing, se rodar)
`severity-badge.tsx` — o mapa severity→variant (incl. desconhecida→neutro).

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: story com todos os níveis (visual+axe). 2. build+registry. 3. Dashboard: alerts.tsx. 4. Wiring triad.
