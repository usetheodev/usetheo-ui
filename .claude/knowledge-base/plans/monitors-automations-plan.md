---
slug: monitors-automations
milestone_id: M13
created_at: 2026-07-15
goal: Evoluir os alerts do lens em monitors (threshold + anomaly-sobre-média-móvel) + automations (Slack + webhook custom) com histórico de execução, reusando o engine de alertas M53 e o webhook worker existentes do theo-cloud (Rule 9), plotando as séries via os charts do M11, e promovendo SeverityBadge ao @usetheo/ui só se recorrer em ≥2 telas.
---

# Plan: Monitors + automations (M13)

> **Version 1.0** — Executa o blueprint do M13 (`.claude/knowledge-base/discoveries/blueprints/monitors-automations-blueprint.md` — DISCOVER completo): threshold monitors (já existem como alert rules) + anomaly-sobre-MA (extensão honesta; Langfuse é threshold-only) + Slack action type (OAuth + token cifrado) reusando o webhook worker production-ready. Majoritariamente theo-cloud (Go + React); o DS ganha `SeverityBadge` SÓ se severity recorrer em monitors + alerts (regra-de-3).

## Goal

Fechar o gap operacional (alertar antes do incidente) que o Langfuse-core tem, reusando o máximo do backend existente e sem workarounds.

## Context

ROADMAP § M13 (V2, gap P1). Depende de M11 (a tela de monitors plota as séries via `PercentileChart`/`Histogram`/`TrendChart`). Blueprint DISCOVER SHIPPABLE. **IMPLEMENT gated:** exige (a) M11 publicado+adotado no lens; (b) backend novo no theo-cloud (Slack OAuth, anomaly-MA).

## Baseline Context (deep review of current state)

### Files that will be touched

**theo-cloud (majoritário) — backend Go + lens React:**

| Arquivo/módulo | Estado atual | Papel no M13 |
|---|---|---|
| `internal/lens_alert_evaluator/{evaluator,logic}.go` | engine M53: tick 60s, fire-once-until-cleared, extração error_rate/cost/p95 | ESTENDER com anomaly-sobre-MA (branch em computeSeverity) |
| `internal/workspace_webhook_worker/worker.go` | worker production-ready (retry/dead-letter/SSRF) | REUSAR: Slack como novo action type que enfileira delivery |
| `internal/routes/lens_alert_rules.go` | CRUD `/v1/dashboard/lens/alert-rules` | ESTENDER: campo anomaly + action type |
| `dashboard/src/pages/lens/alerts.tsx` | form threshold + `alertStatusVariant` (status badge) | evolui p/ monitors (threshold+anomaly, plota séries M11) |
| (novo) `dashboard/src/pages/lens/automations.tsx` | inexistente | tela de automations (action Slack/webhook + histórico) |
| (novo) Slack: OAuth flow + token cifrado | AUSENTE (só copy) | `@slack/oauth`, WebClient por projeto (padrão langfuse) |

**@usetheo/ui (condicional, este repo):**

| Arquivo | Papel |
|---|---|
| (novo, SE recorrer) `src/components/composites/severity-badge/` | mapeia MonitorSeverity→variant do `Badge` (reusa Badge existente) |

### Current callers / dependents

Backend: o evaluator M53 já roda em `cmd/main.go:1305-1327`. Lens: `alerts.tsx` já consome as rotas. O DS `SeverityBadge` (se criado) seria consumido por `alerts.tsx` + `monitors` (≥2 telas → gate satisfeito).

### Domain glossary

**Glossário:** monitor = regra que avalia uma métrica sobre janela e emite severity; threshold = comparação simples (valor vs limite); anomaly-sobre-MA = |valor − média móvel| > k·stddev; automation = trigger (monitor fired) + action (webhook/Slack); execution history = tabela de runs (`lens_fired_alerts` + `workspace_webhook_deliveries`); severity = OK/WARNING/ALERT/NO_DATA/UNKNOWN/PAUSED.

### Architecture boundaries affected

Backend (theo-cloud): o evaluator/worker são infra; anomaly e Slack estendem-nos sem novo subsistema (Rule 9). Lens: telas consomem as rotas + plotam via DS. DS: `SeverityBadge` é apresentação pura (mapping severity→variant), controlado.

## Prior Art & Related Work

- Blueprint M13 (`.claude/knowledge-base/discoveries/blueprints/monitors-automations-blueprint.md`): ADRs D1-D4, contrato real.
- Referências: `langfuse/packages/shared/src/{domain/automations.ts,features/monitors/processor/*,server/services/SlackService.ts}`.
- Backend real: `internal/lens_alert_evaluator/`, `internal/workspace_webhook_worker/`, `internal/routes/lens_alert_rules.go`.
- M11 (charts para plotar as séries dos monitors), M9 (annotation por sessão reusa infra — indireto).
- Playbook de adoção M7/M8/M9/M11/M12.

## Objective

- [ ] Backend: evaluator com anomaly-sobre-MA (TDD Go) + Slack action type (OAuth + token cifrado) reusando o worker
- [ ] Lens: tela de monitors (threshold+anomaly, plota séries via charts M11) + tela de automations (Slack/webhook + histórico)
- [ ] DS (condicional): `SeverityBadge` promovido SE severity recorrer em monitors + alerts
- [ ] North-star delta; zero dep nova no DS
- [ ] Release semver + adoção no lens

## Dependencies

| Dependência | Ecosistema | Uso | Rule 9 |
|---|---|---|---|
| `@slack/oauth` + `@slack/web-api` | theo-cloud (novo) | OAuth Slack + WebClient (padrão langfuse) | lib madura auditada; não reinventar OAuth/Slack |
| engine M53 + webhook worker | theo-cloud (existente) | reuso (não reconstruir) | Rule 9 — reuso |
| `Badge` do @usetheo/ui | DS (existente) | SeverityBadge compõe | reuso |

`/deps-audit` roda na fase PLAN do theo-cloud (as libs Slack são backend, fora do manifesto do DS). **Zero dep nova no DS.**

## ADRs

### D1 — Reusar engine M53 + webhook worker; framing = estender alerts→monitors (default revisável)

**Decision:** ESTENDER o `lens_alert_evaluator` e o `workspace_webhook_worker` (não reconstruir). Framing default: "alert rules" evoluem para "monitors" (mesma tabela/rotas estendidas), não entidade nova.

**Rationale:** o engine M53 é maduro (state machine, retry, dead-letter, histórico); reconstruir viola Rule 9 + re-trabalho. Alternativa: entidade "monitor" separada (rejeitada por default — duplica o engine; **revisável pelo owner** se houver razão de modelagem). Alternativa: reconstruir worker (rejeitada — o existente é production-ready).

### D2 — MVP threshold + anomaly-sobre-média-móvel; ML de anomalia FORA

**Decision:** anomaly = desvio sobre média móvel (baseline das últimas N janelas; fire se |valor−média| > k·stddev). ML/forecast fora.

**Rationale:** o próprio Langfuse é threshold-only; anomaly-sobre-MA é a extensão honesta mínima do ROADMAP; ML seria YAGNI e backend-pesado (risco #1). Alternativa: zscore/forecast (rejeitada — além da referência).

### D3 — Slack como action type reusando o worker; bot token cifrado at rest

**Decision:** Slack = action type (OAuth bot token cifrado, WebClient por projeto) que enfileira delivery no worker existente.

**Rationale:** padrão langfuse `SlackService`; reusa retry/dead-letter/histórico (Rule 9); secret handling cifrado (regra inquebrável — token nunca em log/corpo). Alternativa: caminho de entrega Slack separado (rejeitada — duplica o worker).

### D4 — `SeverityBadge` no DS só com recorrência ≥2 telas (regra-de-3)

**Decision:** promover `SeverityBadge` ao DS SÓ quando a tela de monitors existir (aí recorre em alerts + monitors). Até lá, mapping local.

**Rationale:** hoje só `alerts.tsx` tem badge de status; promover antes = YAGNI. Alternativa: promover já (rejeitada — 1 tela). O gate é verificado na Fase 3.

## Drawbacks & Risks

| Drawback / Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| Slack OAuth + secret handling é backend real | High | ADR D3: reusa worker + padrão langfuse; token cifrado at rest; nunca em log/corpo | Claude/owner |
| anomaly-sobre-MA pode gerar falsos positivos | Medium | k configurável + janela de baseline configurável; começa conservador; threshold continua default | Claude |
| framing monitors-vs-alerts | Medium | ADR D1 default (estender) revisável pelo owner na abertura da fase de implementação | owner |
| IMPLEMENT gated no merge+publish+adoção do M11 | High | sequenciamento explícito (Dependency Graph); PLAN não-bloqueado, IMPLEMENT pós-adoção | Claude |
| SeverityBadge pode nunca recorrer (se monitors reusa a tela de alerts) | Low | ADR D4: gate ≥2 telas; se não recorrer, fica mapping local (honesto, sem YAGNI) | Claude |

## Unresolved Questions

- **Framing monitors-vs-alerts** — default D1 (estender), revisável pelo owner ao iniciar a implementação. Não bloqueia o PLAN; afeta nomes de rota/tabela, não a arquitetura de reuso.

## Dependency Graph

```
[GATE] merge PR #12 ✅ → publish npm (token) → adoção M11 no lens (charts disponíveis)
   ↓
F1: backend anomaly-sobre-MA (theo-cloud Go, TDD) — estende evaluator M53
F2: backend Slack action type (OAuth + token cifrado) — reusa worker
F3: lens tela de monitors (threshold+anomaly, plota séries via charts M11)   [dep F1]
F4: lens tela de automations (Slack/webhook + histórico)                     [dep F2]
F5: DS SeverityBadge — SÓ SE severity recorrer em monitors+alerts (≥2 telas) [dep F3]
F6: release + adoção + north-star + flip M13
```

## Phase 1: Backend anomaly-sobre-MA (theo-cloud, Go)

### T1.0 — Extensão do evaluator com anomaly

#### Objective
Estender `computeSeverity`/`logic.go` com branch anomaly: baseline = média móvel das últimas N janelas; emite ALERT/WARNING se |valor−média| > k·stddev. Config no alert rule (`anomaly_enabled`, `anomaly_window_n`, `anomaly_k`).

#### Why this step (action + reasoning — ReAct discipline)
É a única capacidade de detecção nova; travar a lógica pura (baseline/desvio) primeiro, com TDD Go, elimina retrabalho nas telas.

#### Evidence
Blueprint (Corner 4 Q2; ADR D2). Langfuse `computeSeverity.ts` (threshold branch a espelhar). Backend real `logic.go:66-95` (extração de métrica).

#### Files to edit
- `internal/lens_alert_evaluator/logic.go` (+ anomaly), `internal/routes/lens_alert_rules.go` (campos), migração de schema (colunas anomaly), testes Go `*_test.go`.

#### Deep file dependency analysis
Reusa a série já buscada (cache por tenant/janela); não toca no worker. Sem dep externa nova (Go stdlib math p/ média/stddev).

#### Deep Dives
Baseline com N janelas insuficientes → NO_DATA honesto (não fire); stddev zero (série constante) → sem falso positivo; janela sem tráfego → 0 honesto.

#### Tasks
1. RED: teste Go da função pura de anomaly (baseline, desvio, edges vazio/constante).
2. GREEN: função + integração no evaluator.
3. REFACTOR + migração de schema.

#### TDD
- `Test_anomaly_fires_quando_desvio_excede_k_stddev` — série com pico > k·stddev → ALERT
- `Test_anomaly_nao_fires_dentro_da_banda` — variação normal → OK
- `Test_anomaly_baseline_insuficiente_retorna_no_data` — < N janelas → NO_DATA (não fire)
- `Test_anomaly_stddev_zero_nao_falso_positivo` — série constante → OK
- Negativo: `Test_anomaly_janela_vazia_zero_honesto` — sem tráfego → 0, não NaN

#### Concurrency tests
`Test_evaluator_anomaly_multi_tenant_sem_corrida` — o evaluator já é multi-replica (claim FOR UPDATE SKIP LOCKED); anomaly não introduz estado compartilhado novo (usa a série cacheada read-only). Verificar que o cálculo é puro por rule.

#### Acceptance Criteria
- `cd theo-cloud && go test ./internal/lens_alert_evaluator/...` → PASS
- migração aplica limpo (up/down)

#### DoD
Testes Go verdes; CHANGELOG do theo-cloud.

## Phase 2: Backend Slack action type (theo-cloud, Go)

### T2.0 — Slack OAuth + action type reusando o worker

#### Objective
Slack action type: OAuth flow (`@slack/oauth`), bot token cifrado at rest, WebClient por projeto; a action enfileira delivery no `workspace_webhook_worker` (novo tipo de payload Slack).

#### Why this step (action + reasoning)
Fecha o gap de automation (Slack ausente); reusa o worker (Rule 9) em vez de novo caminho.

#### Evidence
Blueprint (Corner 3; ADR D3). Langfuse `SlackService.ts` (OAuth + WebClient). Worker real `workspace_webhook_worker/worker.go`.

#### Files to edit
- `internal/slack/` (novo: OAuth + WebClient), rotas OAuth, `internal/workspace_webhook_worker/` (dispatch Slack), storage cifrado do token, testes Go.

#### Deep file dependency analysis
Reusa o worker (claim/retry/dead-letter/histórico); adiciona um dispatcher Slack. Token cifrado via utilitário de cripto existente do theo-cloud.

#### Deep Dives
Token inválido/revogado → delivery falha → retry/dead-letter do worker (já existe); nunca logar o token; canal deletado → erro honesto no histórico.

#### Tasks
1. RED: teste do dispatcher Slack (mock WebClient) + cifra/decifra do token.
2. GREEN: OAuth + dispatcher + storage cifrado.
3. WIRING: enfileira no worker; histórico via as tabelas existentes.

#### TDD
- `Test_slack_action_enfileira_delivery_no_worker` — action Slack → linha em deliveries
- `Test_slack_token_cifrado_at_rest` — token nunca em claro no storage
- `Test_slack_delivery_falha_vai_para_retry` — erro → retry/dead-letter do worker
- Negativo: `Test_slack_token_nunca_em_log` — assert token ausente dos logs

#### Concurrency tests
Reusa a concorrência do worker (já testada); `Test_slack_dispatch_idempotente_por_delivery` — mesma delivery não duplica post.

#### Acceptance Criteria
- `go test ./internal/slack/... ./internal/workspace_webhook_worker/...` → PASS
- nenhum secret em log (grep no teste)

#### DoD
Testes Go verdes; CHANGELOG do theo-cloud; secret handling auditado.

## Phase 3: Lens — telas de monitors + automations (theo-cloud React) + gate do DS

### T3.0 — Tela de monitors (plota séries via charts M11) + automations + decisão SeverityBadge

#### Objective
Tela de monitors (threshold+anomaly, plotando as séries via `PercentileChart`/`Histogram`/`TrendChart` do M11 já adotados) + tela de automations (action Slack/webhook + histórico via as tabelas existentes). Avaliar recorrência de severity: se monitors + alerts renderizam severity → promover `SeverityBadge` ao DS (Fase 3.1); senão mapping local (honesto).

#### Why this step (action + reasoning)
É a entrega visível (DoD do M13); consome F1/F2 e os charts do M11 adotados.

#### Evidence
DoD do ROADMAP § M13; blueprint (Corner 4; ADR D4); `alerts.tsx` (padrão de tela + status badge).

#### Files to edit
(theo-cloud) `dashboard/src/pages/lens/{monitors,automations}.tsx` (+ testes), rotas; (SE recorrer) `@usetheo/ui` `src/components/composites/severity-badge/`.

#### Deep file dependency analysis
monitors plota via os charts do M11 (dep: M11 adotado); automations lê histórico via as tabelas existentes; SeverityBadge (se criado) reusa `Badge`.

#### Deep Dives
severity NO_DATA/UNKNOWN honestos (não verde falso); histórico vazio → empty honesto ("nunca disparou"); Slack não conectado → CTA de conectar, não erro.

#### Tasks
1. monitors screen (threshold+anomaly, charts M11). 2. automations screen (Slack/webhook + histórico). 3. **Gate DS:** contar telas com severity → decidir SeverityBadge (Fase 3.1) vs mapping local. 4. Testes de integração.

#### TDD
- Oráculo: `cd dashboard && pnpm vitest run src/pages/lens/monitors src/pages/lens/automations` → 0 failed
- `test_monitor_plota_serie_via_percentile_chart` — a tela usa o chart do M11
- `test_automation_historico_lista_execucoes` — histórico via as tabelas existentes
- `test_severity_nodata_nao_verde_falso` — NO_DATA renderiza honesto

#### Concurrency tests
(none — telas single-threaded; a concorrência mora no backend, coberta em F1/F2)

#### Acceptance Criteria
- `cd dashboard && pnpm vitest run` → 0 failed
- decisão SeverityBadge registrada (recorrência ≥2 telas sim/não) com evidência

#### DoD
Telas verdes; decisão do DS documentada.

### T3.1 (CONDICIONAL) — `SeverityBadge` no DS (só se recorrência ≥2 telas)

#### Objective
SE severity recorre em monitors + alerts: `src/components/composites/severity-badge/` mapeando MonitorSeverity→variant do `Badge`; controlado; stories+axe+testes+registry. Adotar nas 2 telas.

#### Why this step (action + reasoning)
Regra-de-3 satisfeita → promoção legítima (não YAGNI).

#### Evidence
ADR D4; `Badge` existente (variants success/warning/destructive/outline).

#### Files to edit
`src/components/composites/severity-badge/*`, `src/index.ts`, `registry/severity-badge.json`.

#### TDD
- `test_severity_badge_mapeia_alert_para_destructive` etc. + axe
- Oráculo: `pnpm vitest run src/components/composites/severity-badge` + `registry:validate`

#### Concurrency tests
(none — single-threaded)

#### Acceptance Criteria
- testes+axe verdes; `registry:validate` PASS; adotado nas 2 telas

#### DoD
Barrel+CHANGELOG do DS; registry válido.

## Phase 4: Release + adoção + north-star + flip

### T4.0 — Release e fechamento do M13

#### Objective
Release do theo-cloud (backend+lens) + release do DS SE SeverityBadge foi criado; north-star; flip M13.

#### Why this step (action + reasoning)
Fecha o DoD do M13 com evidência.

#### Evidence
Playbook M7/M8/M9/M11/M12.

#### Files to edit
CHANGELOGs; ROADMAP.md (flip M13); run-file.

#### TDD
- Oráculo: suítes completas (theo-cloud + DS) verdes; monitors/automations funcionais contra o backend real.

#### Concurrency tests
(none)

#### Acceptance Criteria
- suítes verdes; north-star no audit; M13 [x]

#### DoD
Commits pushed; flip registrado com SHA.

## Coverage Matrix

| Claim do Goal / DoD | Tasks |
|---|---|
| anomaly-sobre-MA no backend | T1.0 |
| Slack action type (OAuth+token cifrado) reusando worker | T2.0 |
| tela de monitors (threshold+anomaly, charts M11) | T3.0 |
| tela de automations (Slack/webhook + histórico) | T3.0 |
| SeverityBadge no DS (condicional ≥2 telas) | T3.1 |
| north-star + flip M13 | T4.0 |
| zero dep nova no DS | T3.1 (compõe Badge) |

**Coverage: 100% — todo claim mapeado (T1.0, T2.0, T3.0, T3.1 condicional, T4.0).**

## Global Definition of Done

- [ ] Backend theo-cloud: `go test ./...` verde (anomaly + Slack); nenhum secret em log
- [ ] Lens: `pnpm vitest run` verde (monitors + automations); plota via charts M11
- [ ] DS (se SeverityBadge): suíte+axe+`registry:validate` verdes; zero dep nova
- [ ] CHANGELOGs atualizados; north-star no audit; ROADMAP M13 [x]

## Failure scenarios (when I/O external)

- **Slack API timeout/5xx** → o worker existente já faz retry exponencial + dead-letter (reuso); histórico registra o erro. Coberto em T2.0 (`Test_slack_delivery_falha_vai_para_retry`).
- **Token Slack revogado** → delivery falha → retry → dead-letter; UI mostra "reconectar Slack" (CTA honesto).
- **Série de observability indisponível** → monitor emite NO_DATA (não fire falso); coberto em T1.0.

## Concurrency signals

O backend é multi-replica (evaluator M53 + worker com claim FOR UPDATE SKIP LOCKED). Testes de concorrência em T1.0/T2.0 (anomaly puro por rule; dispatch Slack idempotente por delivery). As telas do lens são single-threaded.

## Critical paths (para mutation testing, se rodar)

`internal/lens_alert_evaluator/logic.go` (branch anomaly — baseline/desvio/edges) e `internal/slack/` (cifra do token — secret handling) são onde mutantes sobrevivem silenciosamente.

## Sequencing gate (honesto)

Este PLAN está COMPLETO e não-bloqueado. **IMPLEMENT (F1+) está gated** por: (1) publish npm do 0.26.0 (token) + adoção do M11 no lens (a tela de monitors plota via os charts do M11); (2) libs Slack no theo-cloud. F1/F2 (backend) podem iniciar assim que o owner confirmar o framing (ADR D1) e o M11 estiver adotado; F3 depende do M11 adotado.

## Final Phase: Integration Validation (MANDATORY)

1. Backend: monitors disparam contra séries reais; Slack posta em canal de teste; histórico registra.
2. Lens: telas de monitors/automations manualmente no dev server contra o backend.
3. DS (se SeverityBadge): story renderiza; axe; registry.
4. Wiring triad: caller real (telas), integração (suítes), observabilidade (histórico de execução + data-slot).
