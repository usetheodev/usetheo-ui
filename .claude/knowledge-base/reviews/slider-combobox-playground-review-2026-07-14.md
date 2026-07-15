# Review: slider-combobox-playground

**Date:** 2026-07-14/15
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (trail em `.claude/agents/review-slider-combobox-playground-2026-07-14/`; YAMLs válidos 5/5 — lição M0 aplicada nos prompts)
**Findings:** 30 total (BLOCKER: 1, HIGH: 4, MEDIUM: 8, LOW: 12, INFO: 5) — **BLOCKER + 4 HIGH + 5 MEDIUMs FIXADOS em `5fd4be7f`**; demais documentados
**Verdict:** **READY_TO_MERGE**

## Resolução dos findings acionáveis (todos re-verificados por suite 734/734 + validation exit 0)

| Finding | Sev | Resolução |
|---|---|---|
| F-xval-1 ≡ F-arch-2 ≡ F-dom-4 — limitação de clipping (`overflow:hidden`) do listbox inline não documentada (consequência do ADR D2 + AC do plano) | BLOCKER | **FIXADO**: JSDoc do Combobox documenta a limitação e o caminho futuro (variante popover) |
| F-wire-1 — `registry/r/combobox.json` stale (buildado antes do fix ARIA do T3.3) | HIGH | **FIXADO**: registry rebuildado e commitado; consumidores recebem o adapter |
| F-dom-1 — `text-caption` não existe na typescale (classe no-op) | HIGH | **FIXADO**: `text-body-sm` (token real) em slider.tsx + stories |
| F-dom-2 — mark click não movia o thumb em modo uncontrolled | HIGH | **FIXADO**: fallback de estado interno; regressão pinada por `aria-valuenow` |
| F-xval-2 — `VALIDATION_GATE_PASSED` emitido com run_validation FAIL (falso positivo de lockfile) | HIGH | **FIXADO na causa-raiz**: gate de file-size agora isenta lockfiles/gerados (followup #7); re-run exit 0 — a promise é literalmente verdadeira |
| F-arch-1 — aria-controls apontava o wrapper, não o elemento `role=listbox` | MEDIUM | **FIXADO**: listId vive no elemento da lista (mesmo adapter); loading slot assume o id durante fetch (corrige também aria-valid-attr-value na story Loading) |
| F-tests-1 — `role="combobox"` não assertado | MEDIUM | **FIXADO**: assert no teste de abertura |
| F-tests-2 — sem regressão do empty-listbox na suite do combobox | MEDIUM | **FIXADO**: teste dedicado (role=presentation + axe) |
| F-dom-3 — thumbs de range com o mesmo aria-label | MEDIUM | **FIXADO**: sufixo posicional `(n of N)`; teste pina nomes distintos |
| F-xval-4 — combobox.tsx editado no T3.3 sem declaração de arquivo | MEDIUM | Documentado: fix de a11y pego pelo sweep axe (mesma task da story); registrado aqui e no log |

## Documentados (não bloqueiam)

- **F-xval-3 (MEDIUM):** plan v1.2 amendment (ground truth cmdk) — legítimo em substância (source verificado; testes de T2.1 já nasceram v1.2); deficiência de ordering do audit trail registrada; plano re-atestado (2caf2073…).
- **LOWs:** aria-label "Suggestions" sem override (i18n futura); marks horizontais-only; oráculos frouxos em 3 testes (Enter→"algum FRUITS"); `useEffect` vs `useLayoutEffect` nos adapters (1 frame); `ComboboxEmptyProps` não exportado; labels do QueryPlayground sem htmlFor (spans descritivos + aria-label nos controles cobrem AT). Todos com nota nos YAMLs dos agentes.
- **INFO:** adapters de atributos avaliados por 2 agentes como **solução correta** (React não reescreve attrs de vdom constante; idempotentes; pinados por teste); drift de contagem de testes no plano (cobertura excede o planejado).

## Cross-validation summary

Tasks 7/7 rastreadas ([T{N.M}]); 6 fully + T2.2 partial→**fechado** pelo fix batch (AC de documentação de overflow). Coverage Matrix 8/8. CHANGELOG ✅. DoD bullet 3 do M1 satisfeito (QueryPlayground story + axe em teste). Checkpoint↔git consistente nas duas direções.

## Quality gates (pós-fixes)

`pnpm test:run` **734/734** · typecheck 0 · lint 0 · registry **63 itens** válidos (artefatos frescos) · `pnpm build` OK (Slider+Combobox no dist) · `run_validation.py` **exit 0** · code-quality **PASS_WITH_CAVEATS (89** — soft floor ambiental D2 sem rede) · wiring triad 2/2 símbolos per ADR D3.

## Handoff decision

**READY_TO_MERGE** → `/release` (minor 0.17.0).
