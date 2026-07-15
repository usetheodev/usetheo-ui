# SOTA Gap Analysis — theo observability vs Arize/Phoenix/Langfuse

**Date:** 2026-07-15 · **Método:** 3 agentes paralelos sobre os repos clonados (phoenix ⚠️ ELv2 study-only, langfuse MIT-core) + inventário do theo-lens real. Evidência por path.

## Correção honesta (Rule 3)

Eu havia dito "estamos longe de SOTA". A evidência **contradiz isso parcialmente**: a distância depende de QUAL artefato se mede.

- **@usetheo/ui (o design system — o que o M8 entregou):** só os 7 primitivos de trace. Um DS shippa componentes reutilizáveis, não uma plataforma — então "longe de SOTA de plataforma" é esperado e correto por design.
- **theo-lens (o PRODUTO na theo-cloud):** **já tem ~21 áreas de produto** e cobre a maioria do que Phoenix/Langfuse-core têm. **NÃO está longe** — está ~65-70% de paridade funcional.

O gap real, portanto, não é "construir um kit maior" — é **fechar features de plataforma específicas** e, onde fizer sentido, promover os componentes recorrentes ao DS.

## Camada 1 — o que o theo-lens JÁ TEM (paridade existente)

| Área | theo-lens | Phoenix | Langfuse-core | Veredicto |
|---|---|---|---|---|
| Trace detail (tree/waterfall/transcript/attrs/IO/graph) | ✅ rico (M8) | ✅ | ✅ | **paridade** |
| Trace list + filtros avançados (facets) | ✅ `traces/filter-bar.tsx` | ✅ DSL | ✅ search-bar | **paridade** |
| Saved views | ✅ `traces/saved-views.tsx` | ❌ (Phoenix não tem!) | ✅ | **à frente do Phoenix** |
| Peek side-panel | ✅ `traces/peek-sheet.tsx` | ~ | ~ | **paridade** |
| Trace compare (deltas honestos) | ✅ `compare.tsx` (M8) | ❌ (só experimentos) | ~ | **à frente do Phoenix** |
| Datasets | ✅ `datasets.tsx` | ✅ | ✅ | **paridade básica** |
| Experiments (dataset × variante, compare runs) | ✅ `experiments.tsx` | ✅ | ✅ | **paridade básica** |
| Playground / replay | ✅ `playground.tsx` (4 variantes) | ✅ | ✅ | **paridade (capped a 4)** |
| Evaluators (rule + LLM-judge, score-over-time) | ✅ `evaluators.tsx` | ✅ | ✅ | **paridade básica** |
| Guardrails + alerts (threshold + webhook) | ✅ `guards.tsx`+`alerts.tsx` | ❌ | ✅ monitors | **paridade** |
| Labeling queue (human-in-the-loop → dataset) | ✅ `labeling-queue.tsx` | ~ (annotation in-trace) | ✅ annotation-queues | **paridade** |
| Custom dashboards (KPI/trend/top-N) | ✅ `dashboards.tsx` (M66) | ✅ | ✅ widgets | **paridade básica** |
| Cost tracking (per-span/trace/dashboard) | ✅ espalhado | ✅ | ✅ | **paridade (sem página dedicada)** |
| Ask copilot (conversational sobre o trace) | ✅ `ask.tsx` (M61) | ❌ | ❌ (só /ee/) | **à frente de ambos (core)** |

## Camada 2 — GAPS reais vs SOTA (priorizados por valor × esforço)

### P0 — gaps que os dois concorrentes têm e nós não (ou é stub)

| Gap | Phoenix | Langfuse | theo-lens hoje | Camada do fix |
|---|---|---|---|---|
| **Sessions view rica** (agrupar traces por sessão/usuário + métricas + replay temporal) | ✅ SessionDetails + SessionsTable | ✅ sessions + user detail | ⚠️ STUB (só lista sessionId+count) | plataforma + DS (`SessionTimeline`) |
| **Prompt management / versioning** (versões imutáveis, labels prod/staging, diff) | ✅ PromptVersionsList + labels | ✅ prompt-history + labels + diff | ❌ AUSENTE | plataforma + DS (`PromptDiff`, `VersionLabelPicker`) |
| **Annotation configs + tipos** (categorical/continuous/freeform, score configs nomeados) | ✅ AnnotationConfigDialog | ✅ score-configs | ⚠️ labeling-queue tem label/score/note mas sem config store | plataforma + DS (`AnnotationInput` triplo) |
| **Métricas time-series ricas** (latência p50/p95/p99, tokens, custo, erro, score-trend, top-models) | ✅ 11+ chart types | ✅ widget library (Big Number/TS/Pie/Bar/Histogram) | ⚠️ dashboards fixos (KPI/trend/top-N) | DS (`Histogram`, `PercentileChart`) |

### P1 — SOTA quality-of-life

| Gap | Evidência SOTA | theo-lens | Camada |
|---|---|---|---|
| **Monitors / anomaly detection + automations** (threshold + Slack/webhook) | Langfuse `monitors/` + `automations/` | ⚠️ alerts existe mas sem anomaly nem Slack | plataforma |
| **Comments / threads / tags** em traces | Langfuse `comments/` + `tag/` | ❌ | plataforma + DS (`CommentThread`) |
| **RBAC-gated features** (roles: owner/admin/member/viewer) | Langfuse `rbac/` | ? (auth existe; feature-gating?) | plataforma |
| **Playground escalável** (>4 variantes; A/B de prompt) | Arize unlimited | ⚠️ capped VARIANT_CAP=4 | plataforma |
| **Global search / command-K** de traces | Phoenix GlobalSearch, Langfuse command-k | ? | DS (`CommandPalette` já existe!) + plataforma |

### P2 — enterprise (Langfuse deixa em /ee/ — pode esperar)

RBAC resource-level, SSO/SAML/SCIM, billing, white-label, audit-log viewer, multi-tenant org hierarchy. **Não priorizar** — nem o core do Langfuse expõe.

## Recomendação — o gap é de PLATAFORMA, não de DS

O M8 (DS) está correto e completo para seu escopo. Os gaps SOTA são **features de produto no theo-lens**, com componentes de UI recorrentes que devem ser promovidos ao `@usetheo/ui` conforme aparecem (o playbook M0–M8 já provado).

**V2 sugerido (macro-roadmap por valor decrescente):**

1. **M9 — Sessions ricas**: promover `SessionTimeline`/`SessionSummary` ao DS + tela de session replay no lens (o maior stub, ambos concorrentes têm).
2. **M10 — Prompt management**: `PromptDiff` + `VersionLabelPicker` no DS + versioning/labels no lens (gap 100% ausente, ambos têm).
3. **M11 — Analytics time-series SOTA**: `Histogram`/`PercentileChart` no DS + dashboards com drill-down (Langfuse tem widget library completa).
4. **M12 — Annotation platform**: `AnnotationInput` (categorical/continuous/freeform) + score-configs no lens.
5. **M13 — Monitors + automations**: anomaly + Slack/webhook (Langfuse core tem).

Cada milestone segue o Cycle completo (discover→plan→implement→review→release→adoção) — o mesmo rigor do V1.

## Honestidade sobre a medição

- theo-lens ≈ **65-70% de paridade funcional com Langfuse-core** (o mais completo dos 3); mais perto de Phoenix (que não tem saved-views nem trace-compare).
- O que falta é **profundidade** (sessions/prompt/analytics são stubs ou ausentes), não amplitude.
- **Nenhum benchmark de performance/escala foi medido** — paridade aqui é de FEATURES, não de throughput de ingestão (isso seria um `/analysis` separado, contra os backends).
