# Blueprint: Monitors + automations (M13)

> Deep research (langfuse `domain/automations.ts` + `features/monitors/*` MIT-study; phoenix não tem engine de monitors) + contrato REAL do theo-cloud (M53 alert engine + webhook worker + histórico JÁ EXISTEM; Slack AUSENTE). Escopo honesto: threshold monitors + Slack/webhook automations reusando o worker existente; anomaly-sobre-média-móvel como extensão simples; ML de anomalia fora (nem o Langfuse faz).

**Slug:** `monitors-automations` · **Date:** 2026-07-15

## Context

ROADMAP § M13 (V2, gap P1). Depende de M11 (monitors leem/plotam as séries time-series do M11). Majoritariamente plataforma (theo-cloud Go + telas do lens); o DS só ganha componente SE recorrer em ≥2 telas.

## Objective

Fixar o contrato honesto de M13: o que já existe no backend, o gap real, o MVP sem workaround, e o gate do componente DS.

## Coverage Corner 1 — Integration Tests

Telas do lens (monitors + automations) testadas contra o backend real (evaluator M53 + webhook worker) + fixtures p/ o que for novo (Slack). Backend Go: testes de engine de anomaly (desvio sobre MA) e de dispatch Slack. Componente DS (se promovido): controlado, axe.

## Coverage Corner 2 — Dependencies

**O que JÁ existe no theo-cloud (NÃO reconstruir — Rule 9):**
- Engine de alertas M53 (`internal/lens_alert_evaluator/`): tick 60s, state machine fire-once-until-cleared + renotify, extração de métrica (error_rate/cost/p95) das séries de observability. Rotas CRUD `/v1/dashboard/lens/alert-rules` (`internal/routes/lens_alert_rules.go`).
- Webhook worker production-ready (`internal/workspace_webhook_worker/`): claim `FOR UPDATE SKIP LOCKED`, retry exponencial (2/4/8/15/30s), dead-letter em 9 tentativas, SSRF guard (`safehttp`).
- Histórico: `lens_fired_alerts` (breaches) + `workspace_webhook_deliveries` (tentativas de dispatch, status, resposta).
- Séries time-series server-side (`GET /v1/metrics/observability`) — o M11 as plota; o engine as avalia.

**O que FALTA (o gap real do M13):**
- **Slack action type** (AUSENTE — só copy de marketing): OAuth + storage cifrado do bot token + WebClient por projeto (padrão langfuse `SlackService.ts`). Risco #2 confirmado real.
- **Anomaly simples** (threshold-only hoje; Langfuse TAMBÉM é threshold-only): desvio sobre média móvel como extensão do evaluator (o ROADMAP já limita a isso; ML fora).
- **Framing "monitors"**: hoje "alert rules" = os monitors. Decisão de escopo: renomear/estender vs entidade nova.
- **Modelo de severity rico** (langfuse: OK/WARNING/ALERT/NO_DATA/UNKNOWN/PAUSED) vs o atual OK/TRIGGERED.

**Zero dep nova no DS.** Se um `SeverityBadge` for promovido, compõe o `Badge` já existente.

## Coverage Corner 3 — Tools

**Backend (Go):** reusa o webhook worker (Slack como novo action type que enfileira delivery); OAuth Slack via `@slack/oauth` (padrão langfuse). **Secret handling:** bot token cifrado at rest (nunca no corpo/log — regra inquebrável de issues/secrets).
**A11y/DS:** `SeverityBadge` (SE promovido) reusa `Badge` (variants success/warning/destructive/outline já existem) + `Badge.Dot`.
**North-star:** +0 ou +1 componente DS (condicional à recorrência ≥2 telas).

## Coverage Corner 4 — Techniques

- **Monitors (Q1):** estender o evaluator M53 — cada monitor = query de métrica sobre janela + threshold (alert/warning) + noData mode + state machine (já existe). Severity = resultado da métrica; status = estado do scheduler (ACTIVE/PAUSED/ERROR). Langfuse `computeSeverity.ts` + `applyStateMachine.ts` (padrão, threshold puro).
- **Anomaly simples (Q2):** desvio sobre média móvel — baseline = média das últimas N janelas; fire se |valor − média| > k·stddev (k configurável). Extensão do `computeSeverity` (branch: se anomalyConfig, compara com baseline; senão threshold). ML/zscore avançado FORA (nem Langfuse faz).
- **Automations (Q3):** trigger (monitor fired) + action (WEBHOOK já existe | SLACK novo). Slack como action type que enfileira no worker existente (reuso, não novo worker). Execution history = reusa `workspace_webhook_deliveries` + `lens_fired_alerts`. Langfuse `automations.ts` (trigger↔action↔execution desacoplados).
- **SeverityBadge (Q4):** SÓ quando a tela de monitors existir (aí recorre em alerts + monitors = ≥2 telas). Mapeia severity→variant do Badge. Não construir antes (YAGNI + regra-de-3).

## ADRs

### D1 — Reusar o engine M53 + webhook worker, não reconstruir (Rule 9)

**Decision:** M13 ESTENDE o `lens_alert_evaluator` (anomaly branch) e adiciona Slack como action type que enfileira no `workspace_webhook_worker` existente. Nenhum engine/worker novo.

**Rationale:** o backend já tem state machine, retry, dead-letter, histórico, SSRF guard — reconstruir seria violar Rule 9 e re-trabalho. Alternativa: novo subsistema de monitors (rejeitada — duplica o engine M53 maduro).

### D2 — MVP threshold + anomaly-sobre-MA; ML de anomalia FORA

**Decision:** V1 = threshold monitors (já existe) + anomaly simples (desvio sobre média móvel). ML/forecasting fora.

**Rationale:** o próprio Langfuse é threshold-only; anomaly-sobre-MA é a extensão honesta mínima que o ROADMAP pede; ML seria over-engineering (YAGNI) e backend-pesado sem evidência de necessidade. Alternativa: zscore/forecast (rejeitada — nem a referência faz; risco #1 do ROADMAP).

### D3 — Slack como action type reusando o worker; token cifrado at rest

**Decision:** Slack = novo action type (OAuth bot token cifrado, WebClient por projeto) que enfileira delivery no worker existente. Não um caminho de entrega separado.

**Rationale:** padrão langfuse `SlackService`; reusa retry/dead-letter/histórico do worker (Rule 9). Secret handling cifrado (regra inquebrável). Alternativa: Slack via webhook genérico do usuário (aceitável como fallback, mas o valor é a integração nativa). Alternativa: OAuth por-mensagem (rejeitada — overhead; token único reusado).

### D4 — Componente DS (SeverityBadge) só com recorrência ≥2 telas (regra-de-3)

**Decision:** NÃO promover `SeverityBadge`/`AutomationForm` ao DS até a tela de monitors existir (aí severity recorre em alerts + monitors). Até lá, mapping local nas telas.

**Rationale:** hoje só `alerts.tsx` tem badge de status (`alertStatusVariant`); promover agora = YAGNI (padrão especulativo). O ROADMAP já grava essa regra. Alternativa: promover já (rejeitada — 1 tela só).

## Recommendations

`/to-plan monitors-automations` (a executar PÓS-MERGE do PR #12 + adoção do M11):
1. **Backend (theo-cloud, Go):** estender evaluator com anomaly-sobre-MA (TDD Go); Slack action type + OAuth + token cifrado, enfileirando no worker existente.
2. **Lens (theo-cloud, React):** tela de monitors (threshold + anomaly, plotando as séries do M11 via `PercentileChart`/`TrendChart`); tela de automations (action Slack/webhook + histórico via as tabelas existentes).
3. **DS (este repo), condicional:** SE severity recorrer em monitors + alerts, promover `SeverityBadge` (reusa `Badge`) via o ciclo normal.

## Blocked questions

- **Framing monitors vs alerts** (renomear/estender vs entidade nova) — decisão de escopo do owner na fase PLAN; ambas viáveis sobre o engine M53. Não bloqueia o DISCOVER.

## Dependency / sequencing (honesto)

M13 IMPLEMENT está **bloqueado** por: (a) **merge do PR #12** (a tela de monitors plota via os charts do M11, que precisam estar publicados/adotados); (b) **backend novo** (Slack OAuth, anomaly-sobre-MA) no theo-cloud. O DISCOVER (este blueprint) está COMPLETO e não-bloqueado. PLAN detalhado + IMPLEMENT seguem pós-merge.

## Related

- Gap analysis: `.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`
- Referências: `langfuse/packages/shared/src/domain/automations.ts`, `langfuse/packages/shared/src/features/monitors/processor/{computeSeverity,applyStateMachine}.ts`, `langfuse/packages/shared/src/server/services/SlackService.ts`
- Backend real (theo-cloud): `internal/lens_alert_evaluator/`, `internal/workspace_webhook_worker/`, `internal/routes/lens_alert_rules.go`, `dashboard/src/pages/lens/alerts.tsx`
- Depende de: M11 (`PercentileChart`/`Histogram` para plotar as séries dos monitors)
