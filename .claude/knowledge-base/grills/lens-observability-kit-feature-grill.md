---
slug: lens-observability-kit
generated_by: roadmap-feature
date: 2026-07-15
status: completed
---

# Grill — Lens Observability Kit (M8)

## Q1 — O que é / por que agora / onde mora
**Resposta (usuário):** Kit completo NO @usetheo/ui — "Tudo aqui (revisitar out-of-scope)".
**Contexto:** gap-analysis pós-V1 (nível Arize) mapeou ~1.850 LoC hand-rolled no theo-lens:
waterfall 208, span-tree 433, transcript 300, io-cards 283, attributes 177, span-graph 141, compare 312.
**Por que agora:** V1 (M0–M7) concluído; a adoção/dedup provou o playbook; o lens é o
próximo grande consumidor com duplicação mensurável.
**Decisão estratégica registrada:** a linha do out-of-scope "Componentes AI-nativos →
@theokit/ui" será amendada — componentes trace/observability-aware entram no escopo
deste repo como M8 (registro no CHANGELOG § Changed).

## out_of_scope_overlap
removed_from_out_of_scope: "Componentes AI-nativos (Citations, answer ConfidenceBadge, Recall/Answer Playground, Chat)" — PARCIAL: a remoção se aplica ao recorte observability/tracing; Chat/Citations/Playground continuam fora (ver nota no ROADMAP).

## Q2 — Dependências
**Resposta (usuário):** M2 + M6 + M7 (recomendado aceito).
**Racional:** JsonViewer/DescriptionList (M2) p/ payloads de span; DataTable virtualizado
(M6) p/ listas de traces/attributes; adoção/dedup (M7) — consumidores já em 0.22.x e o
playbook de promoção+deleção validado. Todas [x] → M8 elegível imediatamente.

## Q3 — Definition of Done
**Resposta (usuário):** 7 componentes + adoção no lens (recomendado aceito).
- [ ] 7 componentes trace-native publicados (stories + axe + testes + registry válido):
      SpanWaterfall, SpanTree, TraceTranscript, AttributesTable (masking), IOCards,
      SpanGraph, TraceCompare
- [ ] theo-lens adota os 7 e deleta os hand-rolled (~1.850 LoC, SHAs no audit)
- [ ] North-star delta registrado (baseline 48 símbolos → pós-M8)
- [ ] Zero nova dependência de chart (ADR SVG puro mantido)
- [ ] Release semver + consumidores bumpados

## Q4 — Riscos novos
**Resposta (usuário):** API-lock + fronteira borrada (recomendado aceito).
- R1 (API-lock): generalizar APIs a partir de UM consumidor trava contratos errados.
  Mitigação: validar shapes contra 2º caso real (Phoenix / OTel GenAI semconv) no discover.
- R2 (fronteira): revisitar o out-of-scope borra o split AI/não-AI e abre precedente.
  Mitigação: nota explícita no ROADMAP delimitando o que CONTINUA fora (Chat, Citations,
  Recall/Answer Playground).

## Step 5 — SOTA delta
**Resposta (usuário):** Sim — Phoenix + Langfuse.
- phoenix (Elastic 2.0 ⚠️ study-only) e langfuse (MIT core, ee/ excluído) clonados
  shallow em references/; _catalog.md appended com added_for_milestone: M8.
