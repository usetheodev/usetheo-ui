---
generated_by: roadmap-feature
slug: v3-sota-components
date: 2026-07-15
status: completed
milestones_added: [M14, M15, M16, M17, M18, M19]
---

# V3 SOTA components — feature grill

## Q1 — O que e por que agora

Fechar os gaps de componente SOTA restantes vs Arize/Phoenix/Langfuse. Gatilho: após a V2 (M9 Sessions, M11 Analytics, M12 Annotation — todos publicados+adotados+flipados), o owner pediu "criar os milestones para todos os componentes" faltantes. Base: gap analysis component-by-component (2 agentes paralelos sobre langfuse MIT-core + phoenix ELv2 study-only vs os 29 composites atuais).

## Q2 — Dependências

Todos dependem apenas do **DS baseline @ 0.26.0** (M12 [x]). São componentes puros/controlados independentes entre si; M18 reusa `AnnotationConfig` do M12. Nenhum depende de M10/M13 (platform-gated).

## Q3 — Definition of done (por milestone, ver ROADMAP)

Padrão: cada componente publicado (stories + axe + testes + registry) = 100% funcional como artefato de DS; adoção no theo-lens **onde houver superfície com dado real** (evidência), senão o entregável é o componente testado/visível em Ladle. North-star delta; zero dep nova (salvo diff-core do M14, decidido no deps-audit).

## Q4 — Riscos novos (transversais)

1. **Componentes sem superfície de adoção ainda** (PromptVersionDiff, CommentThread, TagInput) — adoção plena gated no backend de plataforma. Mitigação: componentes controlados por props (padrão M12), migração aditiva; o entregável do DS é 100% funcional independente.
2. **Tentação de puxar libs pesadas** (diff-core, editor de template) — mitigação: parsimony rung 4/5 (LCS puro / overlay sobre Textarea), decidido por milestone.

## Evidência do gap analysis (component-by-component)

**DS-now confirmados (viraram M14-M19), com fonte:**

| Componente | Fonte SOTA (file:line) | Milestone |
|---|---|---|
| DiffView + PromptVersionDiff | langfuse `PromptVersionDiffDialog.tsx:59-142`; phoenix `PromptVersionDiffView.tsx:89-120` | M14 |
| DatasetItemDiff | langfuse `DatasetItemDiffView.tsx:16-67` | M14 |
| TokenCostBreakdown | phoenix `SpanTokenCosts.tsx:1-40` + `{Session,Trace}TokenCostsDetails.tsx` | M15 |
| PriceBreakdown | langfuse `PriceBreakdownTooltip.tsx:16-114`, `PricePreview.tsx:6-80` | M15 |
| SeverityBadge | langfuse `MonitorSeverityBadge.tsx:37-72` | M16 |
| CommentThread / InlineComment | langfuse `InlineCommentBubble.tsx:1-70`, `CommentableJsonView.tsx:1-31` | M17 |
| TagInput | langfuse `tag/` + `SetPromptVersionLabels/index.tsx:30-80` (o input, não o store) | M17 |
| EvaluatorForm | phoenix `CodeEvaluatorForm.tsx:10-44` | M18 |
| AnnotationSummaryGroup | phoenix `AnnotationSummaryGroup.tsx`, `SessionAnnotationSummaryGroup.tsx` | M18 |
| ChatMessageCard | phoenix `ChatTemplateMessageCard.tsx` | M19 |
| MessageBranchSelector | phoenix `MessageBranchSelector.tsx` + `MessageBranch{,Next,Previous}.tsx` | M19 |
| PromptTemplateEditor | phoenix `templateEditor/TemplateEditor.tsx:59-116` | M19 |

**Backend-gated (DEFERRED — não viraram milestones; não seriam 100% funcionais sem plataforma):**
`ExecutionHistoryTable` (langfuse `AutomationExecutionsTable.tsx:30-177`), `HeatmapCard` (langfuse `score-analytics/cards/HeatmapCard.tsx`), `VersionHistoryPanel` (langfuse `DatasetVersionHistoryPanel.tsx`), `PlaygroundOutput`/streaming (phoenix playground, 46 arquivos), `ExperimentMetricsChart` (phoenix `ExperimentsMetricsCharts.tsx`), `PromptLabelManager` (store gated).

**Falsos-positivos evitados (NÃO são gaps — só primitivos compostos inline):** `ScoreRow`, `ExperimentMetadataSection`, `DistributionNumericCard`, `DatasetItemMediaAttachments`. Phoenix "embeddings/UMAP point-cloud" = **falso gap** (busca no repo: zero refs; é table+annotations, não visualizador).

## Nota de escopo (owner correction, 2026-07-15)

Escopo = **`@usetheo/ui` (design system) + adoção no consumidor frontend (theo-lens)**. NÃO inclui backend de plataforma (repos `theo`/BFF Go). M10 (prompt store) e M13 (monitors engine) permanecem platform-gated. V3 é 100% no escopo do DS.
