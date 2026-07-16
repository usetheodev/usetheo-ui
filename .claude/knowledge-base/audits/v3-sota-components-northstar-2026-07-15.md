# North-star delta — V3 SOTA components (M14–M19)

**Date:** 2026-07-15 · **Milestones:** M14 Diff · M15 Cost & token · M16 SeverityBadge · M17 Collaboration · M18 Eval authoring · M19 Chat & message

## Pilar (c) — símbolos únicos importados de `@usetheo/ui` (dashboard)

Método idêntico aos audits anteriores (regex robusto a imports multi-linha).

| Consumidor | Baseline (pós-V2, 0.26.0) | Pós-V3 (0.27.0) | Δ |
|---|---|---|---|
| dashboard | 66 | **69** | +3 (SeverityBadge + TokenCostBreakdown adotados) |

**Publicados no `@usetheo/ui@0.27.0` (npm `latest` + registry em `main`):** 13 componentes V3.
**Adotados no theo-lens com dado real (evidência):** 2 — `SeverityBadge` (`alerts.tsx`), `TokenCostBreakdown` (`trace-detail/span-detail.tsx`).

## Pilar (a) — adoção real vs adoção diferida (honesto)

| Milestone | Componente(s) | Adoção | Status |
|---|---|---|---|
| **M16** | `SeverityBadge` | `alerts.tsx` substitui `alertStatusVariant` local (mapper puro `alertSeverity`) | ✅ **adotado** (dado real: status/enabled do alert) |
| **M15** | `TokenCostBreakdown` (+`PriceBreakdown`) | `span-detail.tsx` substitui as células bespoke de token+custo (cache=read+creation, custo 4dp, ausente→em-dash) | ✅ **adotado** (dado real: inputTokens/outputTokens/costUsd do span) |
| **M14** | `DiffView`+`PromptVersionDiff`+`DatasetItemDiff` | prompt/dataset versioning não existe no backend; `trace-compare` faz diff ESTRUTURAL de spans (não texto) | 🔶 **diferido honesto** — sem superfície de text-diff; componentes 100% funcionais (Ladle+testes) |
| **M17** | `TagInput`+`CommentThread` | backend de comments/tags não existe (gated, explícito no DoD) | 🔶 **diferido honesto** — componentes controlados 100% funcionais com fixtures |
| **M18** | `EvaluatorForm`+`AnnotationSummaryGroup` | edição de config de evaluator precisa de store backend; `evaluators.tsx` é display | 🔶 **diferido honesto** — componentes 100% funcionais |
| **M19** | `ChatMessageCard`+`MessageBranchSelector`+`PromptTemplateEditor` | `TraceTranscript` já renderiza o feed de mensagens; adotar `ChatMessageCard` duplicaria (regra do owner: sem adoção decorativa) | 🔶 **diferido honesto** — átomos 100% funcionais |

**Decisão de honestidade (regra do owner):** NÃO forçar adoção decorativa onde não há superfície real. As DoDs da V3 previram isso explicitamente ("adoção no lens onde houver superfície; onde não houver, componente 100% funcional em Ladle é o entregável"). M15/M16 tinham dado real → adotados. M14/M17/M18/M19 aguardam backend/superfície → adoção aditiva futura (migração como M12).

## Evidência de 100% funcional

- **DS (`@usetheo/ui`):** full suite **1300/1300**; **publicado npm `0.27.0`** (dist-tag `latest`); tag `v0.27.0` + GitHub release; registry **97 itens** em `main` (canal shadcn canônico); review consolidado READY_TO_MERGE.
- **theo-lens (dashboard):** suíte completa **1698/1698 passed** (8 skipped pré-existentes) pós-adoção M15/M16; `pnpm typecheck` 0; `pnpm lint` 0.
- **Mappers puros unit-testados** nas adoções: `alertSeverity` (M16), e o wiring de cache=read+creation com em-dash honesto (M15).
- **Zero dependência nova** em ambos os repos.
