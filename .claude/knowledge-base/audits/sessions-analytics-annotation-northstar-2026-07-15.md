# North-star delta — M9 Sessions + M11 Analytics + M12 Annotation

**Date:** 2026-07-15 · **Milestones:** M9 (sessions-rich) + M11 (analytics-timeseries) + M12 (annotation-platform)

## Pilar (c) — símbolos únicos importados de `@usetheo/ui`

Método idêntico ao audit M8 (`lens-observability-northstar-2026-07-15.md`) — regex robusto a imports multi-linha:

```python
re.finditer(r"import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['\"]@usetheo/ui['\"]", text, re.S)
```

| Consumidor | Baseline (pós-M8) | Pós-M9+M11+M12 | Δ |
|---|---|---|---|
| dashboard | 55 | **66** | +11 (8 componentes/tipos novos + tipos correlatos) |
| studio | 14 | 14 | 0 (não tocado) |
| **união** | 59 | **~70** | +componentes sessions/analytics/annotation |

**8 símbolos novos M9/M11/M12 adotados no dashboard** (medido, reproduzível 2026-07-15):
`SessionSummary`, `SessionTimeline`, `SessionTraceItem` (M9) · `Histogram`, `PercentileChart`, `PercentileBucket` (M11) · `AnnotationInput`, `AnnotationConfig` (M12).

## Pilar (a) — adoção real (não decorativa)

Os componentes substituíram/evoluíram código de produção em 3 telas do theo-lens:

| Componente da lib | Adoção | Tela |
|---|---|---|
| `SessionSummary` + `SessionTimeline` | nova tela de session detail (métricas agregadas + replay temporal) sobre a traces-list por `session_id` | `/observability/sessions/:sessionId` (nova rota) |
| `PercentileChart` (banda) | **migração**: overlay de latência de 3 linhas planas → banda sombreada p50/p95/p99 | dashboards (`p95_latency` widget) |
| `Histogram` | novo painel de distribuição de `durationMs` binada client-side | dashboards (board) |
| `AnnotationInput` (3 tipos) | resolve form do labeling-queue troca 3 inputs free-form por config-driven sobre score-configs fixture | `/observability/labeling-queue` |

## Evidência de 100% funcional

- **DS (`@usetheo/ui`):** full suite 1123/1123; publicado npm `0.26.0` (dist-tag `latest`); tags v0.24.0/v0.25.0/v0.26.0 + 3 GitHub releases.
- **theo-lens (dashboard):** suíte completa **1696/1696 passed** (8 skipped pré-existentes) pós-adoção; `pnpm typecheck` 0; `pnpm lint` 0; `pnpm build` de produção OK.
- **Mappers puros unit-testados** nas 3 adoções: `toSessionItem` (Trace→SessionTraceItem, endTime ns via BigInt), `latencyPercentileBuckets`/`durationsFromTraces` (M11), `toResolveBody` (M12) — fronteira honesta, sem I/O.
- **Zero dependência nova** em ambos os repos.

## Notas de honestidade

- M11 é **migração real** (removeu o caminho de 3 linhas do widget `p95_latency`), não adição paralela; `latencySeries` permanece só onde a Overview page ainda o usa (fora do escopo).
- M12 usa **score-configs fixture client-side** — mitigação sancionada do ROADMAP (backend score-config store não existe; confirmado no discover). Componente é config-driven; migração para backend futuro é aditiva.
- `AnnotationInput` categorical usa `aria-labelledby` (fix in-cycle do review L-1) — nome acessível único, sem duplicação.
