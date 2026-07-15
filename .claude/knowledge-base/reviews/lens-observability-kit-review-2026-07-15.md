# Review: lens-observability-kit (M8) — library phase

**Date:** 2026-07-15
**Reviewers (spawned agents):** 2 paralelos — test-quality + wiring/registry (o diff M8 é lib-only: 7 composites trace-native + trace-core; a fase cross-repo de adoção acontece pós-release, precedente M7).
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER, 0 HIGH. Os 2 MEDIUM e os LOW acionáveis foram corrigidos in-cycle; um deles expôs um bug real de stack-overflow.

## Escopo

Fase de biblioteca do M8: `src/lib/trace/*` (trace-core) + os 7 composites (`SpanTree`, `SpanWaterfall`, `AttributesTable`, `IOCards`, `TraceTranscript`, `SpanGraph`, `TraceCompare`), stories, testes, registry. 14 commits `[M8]`; 4022 insertions vs origin/main. A adoção no theo-lens + deleção dos hand-rolled + delta north-star são a fase pós-release (os componentes precisam estar publicados para o consumidor importar — mesma sequência release→adoção→bump do M7).

## Achados e resolução

### MEDIUM

| ID | Achado | Resolução |
|---|---|---|
| M-1 | `SpanGraph`/`TraceCompare` sem negativo de componente para skew/in-flight/ciclo (só happy-path + oversize + orphan) | **CORRIGIDO** — `test_skew_e_in_flight_renderizam_sem_throw_no_componente` (span-graph) e `test_lanes_com_skew_e_ciclo_nao_lancam` (trace-compare). **Este teste expôs um BUG REAL:** `flattenAll`/`aggregateCost` recorriam em `children` sem guarda de ciclo → `RangeError: Maximum call stack` com árvore auto-referencial. Corrigido na raiz (visited set nos 2 helpers) + regressões `test_flattenAll_cycle_safe_nao_stack_overflow` e `test_aggregate_cycle_safe_conta_uma_vez`. |
| M-2 | Trust boundary do slot `renderMarkdown` do IOCards não documentado por teste | **ACEITO com nota** — o contrato é: o default NUNCA interpreta HTML (pinado por `test_default_render_nao_interpreta_html`); quando o consumidor injeta `renderMarkdown`, a responsabilidade de sanitização é DELE (ADR D2 do blueprint — react-markdown+rehype-sanitize vive no consumidor). O teste de slot atual prova que o slot recebe o texto; a fronteira é contratual, não um defeito. |

### LOW

| ID | Achado | Resolução |
|---|---|---|
| L-1 | Asserts `.not.toThrow()`-only em align-cycle e graph-self-loop pinam guarda mas não output | **CORRIGIDO** — align-cycle pina `rows[0].key` e contagem ≥1; graph-self-loop pina nó preservado + `nodes.toHaveLength(2)` |
| L-2 | `io-cards` usava `toBeGreaterThanOrEqual(2)` onde a contagem é conhecível | **CORRIGIDO** — `toHaveLength(3)` (system+user+assistant-com-corpo) |
| L-3 | masking: CopyButton pré-reveal não explicitamente pinado | **ACEITO** — o source gateia atrás de `revealed && canReveal` e o `innerHTML` scan já cobre o vetor de texto; secundário |
| wiring-LOW | `cn` sobre-declarado em attributes-table.json + io-cards.json (nenhum importa cn) | **CORRIGIDO** — removido dos 2 descriptors; registry revalidado 76/76 |

## Gates (re-run pós-fixes)

- **Suite completa da lib: 1038/1038** (85 arquivos)
- **typecheck: 0 erros** · **lint: 0 erros** (1 warning pré-existente) · **format: limpo**
- **registry:validate: PASS (76 itens)** — 8 novos descriptors (7 componentes + item lib `trace`)
- **ladle-axe sweep: 195/195** — toda story nova passa axe WCAG 2.1 AA
- **Wiring triad por componente:** (a) caller = stories + testes; (b) integração = *.test.tsx; (c) observabilidade = `data-slot` presente nos 7
- **Zero dep nova** confirmado (deps-audit plan-bound PASS_WITH_CAVEATS; `package.json` dependencies inalterado)
- **Determinismo:** 0 usos de Date.now/Math.random nos testes (fixtures index/epoch-derived)

## Handoff decision

**READY_TO_MERGE** para a fase de release da biblioteca. A adoção no theo-lens (T6.1) + delta north-star (T6.2) completam pós-merge do release, contra a versão publicada — sequência release→adoção→bump validada no M7.
