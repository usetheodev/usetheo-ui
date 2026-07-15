# Blueprint: Sessions ricas (M9)

> Contratos de `SessionSummary` + `SessionTimeline` validados contra 2 fontes (phoenix `SessionDetailsTracesView` ⚠️ ELv2 study-only, langfuse `session/TraceRow` MIT) + o contrato REAL do theo-lens (traces-list já filtrável por `session_id`). UI-only — zero backend novo (risco R1 resolvido no discover).

**Slug:** `sessions-rich` · **Date:** 2026-07-15

## Context

ROADMAP § M9 (V2, gap P0). Gap analysis (`.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`): sessions é o maior stub — ambos concorrentes têm sessão rica. O lens `sessions.tsx` (134 LoC) é só uma lista.

## Objective

Fixar contratos genéricos de 2 componentes DS + o plano de session detail no lens sobre dados já disponíveis.

## Coverage Corner 1 — Integration Tests

Q: como testar sem backend novo? Deliverable: os componentes são puros/controlados (dados via props); a tela do lens testa a agregação + o fetch dos traces por sessão. Fixtures: lista de traces de uma sessão (com erro, custos, timestamps).

## Coverage Corner 2 — Dependencies

**Tipo `SessionTraceItem` (interseção lens Trace + phoenix trace + langfuse trace):**

```ts
interface SessionTraceItem {
  id: string;              // traceId
  name?: string;
  startTime: bigint | string;
  endTime?: bigint | string | null;  // ou durationMs derivado
  status?: "OK" | "ERROR";
  model?: string;
  costUsd?: number;
  totalTokens?: number;
}
```

Todos os campos vêm da traces-list do lens (`{traceId,name,startTimeUnixNano,durationMs,costUsd,totalTokens,statusCode,model,sessionId}`). **Zero dep nova** — reusa `computeTraceBounds`/`computeBarLayout` do trace-core (M8) para a barra temporal; `formatDurationMs`/`spanCostUsd` idem.

## Coverage Corner 3 — Tools

**A11y:** SessionTimeline é uma lista de linhas selecionáveis (`role="list"`/`listitem` + botões com aria-current); SessionSummary é um `<dl>` de métricas. axe por story.
**North-star:** +2 componentes (SessionSummary, SessionTimeline) + `aggregateSession` helper.

## Coverage Corner 4 — Techniques

- **SessionSummary (Q1):** agrega de uma lista de `SessionTraceItem` → `{ traceCount, spanMs (janela total = max end − min start), totalCostUsd, totalTokens, errorCount, models[] }`. Phoenix mostra numTraces + latency + cost; nós somamos honestamente (custo/tokens ausentes contam 0, nunca NaN; erro pela contagem de status ERROR). Presentational: cards/dl de métricas.
- **SessionTimeline (Q2):** lista temporal (ordenada por startTime) — cada trace uma linha: timestamp + name + barra de duração relativa à janela da sessão (`computeBarLayout` sobre `computeTraceBounds` da lista) + status + custo/tokens. Selecionável (`selectedId`/`onSelect`). Langfuse TraceRow = timestamp+name+latency; nós adicionamos a barra e o status honesto.

## ADRs

### D1 — UI-only sobre a traces-list (sem `/sessions/{id}`)

**Decision:** os componentes recebem `SessionTraceItem[]` via props; a tela do lens busca os traces da sessão via `GET /v1/dashboard/lens/traces?session_id=X` (endpoint existente) e agrega client-side com `aggregateSession`.

**Rationale:** o discover confirmou que NÃO há rota `/sessions/{id}` no BFF; criar backend é fora do escopo do M9 (seria um milestone de engine). A traces-list já carrega todos os campos necessários. Alternativas: novo endpoint de session-detail (rejeitada — backend-heavy, fora do escopo UI); agregação no BFF (rejeitada — mesma razão, e a lista já basta).

### D2 — Barra temporal reusa o trace-core do M8

**Decision:** `SessionTimeline` usa `computeTraceBounds`/`computeBarLayout`/`formatDurationMs` do M8 (nível trace, não span — a matemática é a mesma: janela + posição percentual).

**Rationale:** DRY + zero dep nova (rung 4 da parsimony). Alternativa: helper próprio de session-layout (rejeitada — duplicaria a matemática do bar-layout).

## Recommendations

`/to-plan sessions-rich`: Fase 1 tipos+`aggregateSession` (puro, TDD); Fase 2 SessionSummary; Fase 3 SessionTimeline; Fase 4 registry+release; Fase 5 adoção no lens (session detail page + deleção do stub-como-lista, virando session detail rico).

## Blocked questions

(none)

## Related

- Gap analysis: `.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`
- Trace-core reusado (M8): `src/lib/trace/`
