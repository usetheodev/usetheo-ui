# Review: stepper-promotion (M4)

**Date:** 2026-07-15
**Reviewers (spawned agents):** 5 — architecture, tests, wiring, cross-validation, domain-frontend (definições em `.claude/agents/review-stepper-promotion-2026-07-15/`)
**Findings:** 25 total (BLOCKER: 0, HIGH: 0, MEDIUM: 4, LOW: 5, INFO: 16)
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER/HIGH; os 4 MEDIUMs e 4 dos 5 LOWs foram FIXADOS no mesmo ciclo (commit `fix(review)`) com regressão RED-GREEN; 1 LOW aceito com nota.

> Consolidação manual (precedente M0: `consolidate_findings.py` descartou YAMLs silenciosamente; agentes instruídos a YAML com strings quoted e a consolidação feita pelo orquestrador).

## MEDIUM findings — todos FIXADOS

### F-arch-1 (≡ F-dom-2) — guard EC-1 com `in` aceita chaves do prototype chain
- **Found by:** architecture + domain-frontend (dedup)
- **File:** `src/components/composites/stepper/stepper.tsx:99`
- `status: "toString"` passava no guard (`"toString" in ICON === true` via Object.prototype), `ICON[status]` → undefined/método herdado → crash/lixo no render.
- **Fix:** `Object.hasOwn(ICON, s.status)`; regressão `test_prototype_key_status_degrades_safely` (RED antes do fix).

### F-arch-2 — superfície de fallback incoerente (data-state cru vs visual sanitizado)
- **Found by:** architecture (+ domain-frontend)
- **Fix:** o status sanitizado agora dirige TUDO (data-state, aria-current, failed-text, retry) — contrato de degradação total; pinado em `test_unknown_status_falls_back_to_pending_visual` (data-state === "pending").

### F-dom-1 — leitor de tela não distinguia done de pending
- **Found by:** domain-frontend
- No cenário primário (BuildPipelineFailed: done/done/failed/pending×3, SEM active) o SR ouvia 6 labels idênticos + 1 "failed".
- **Fix:** `SR_STATE_TEXT` — sr-only " — completed"/" — not started"/" — failed" por estado (active anunciado por `aria-current`); regressão `test_done_and_pending_states_communicated_in_text`.

### F-tests-1 — mapa estado→glifo não pinado (mutation-weak)
- **Found by:** tests
- **Fix:** `test_icon_per_state_rendered_aria_hidden` agora asserta `lucide-check`/`lucide-loader-circle`/`lucide-x`/`lucide-circle-dashed` por posição.

## LOW findings

| ID | Resumo | Ação |
|---|---|---|
| F-tests-2 | Negative EC-1 assertava só "tem svg" | FIXADO — asserta glifo pending + data-state |
| F-tests-3 | Texto failed não escopado ao label | FIXADO — assertion no slot `stepper-label` |
| F-tests-4 | `description` nunca assertada | FIXADO — par present/absent (`test_description_*`) |
| F-dom-3 | Canal da causa de falha regressado vs fonte (`build-step-card` expunha error_class) | FIXADO — JSDoc na `description` + story BuildPipelineFailed mostra o padrão ("registry: 401 Unauthorized…") |
| F-xval-1 | Contrato de implementação commitado junto do T1.1 (não declarado em Files-to-edit) | ACEITO — artefato mandatório do cycle-implement (convenção M0-M3); nota para planos futuros |

## INFO (destaques)

- F-arch-3..10: SOLID/convenções irmãs (trend-chart) espelhadas exatamente; barrel aditivo; registry alfabético e com `dependencies: ["lucide-react"]` correto (precedente data-table); CHANGELOG conforme Rule 6.
- F-xval-2: story `BuildPipelineFailed` vs nome `BuildPipeline` do plano — delta de identificador aceito (nome mais específico).
- F-xval-3: suíte total 825 = 796 + 25 autorais + 4 do axe sweep (previsto no plano); pós-fixes: **829** (+4 novos da review).
- F-xval-4: `registryDependencies` por introspecção real (cn+tailwind-preset) supera o palpite "vazio" do plano.
- F-wire-2: inversão alfabética pré-existente (`env-var-editor` > `env`) no index — fora do escopo; housekeeping futuro.

## Edge-case coverage

- Plan edges/negatives: 11/11 cobertos (1 etapa, todas done, clamp ±, steps vazio, não-botão, EC-1 unknown+prototype-key, EC-2 multi-active, truncate EC-14, retry ausente, timestamp ausente) + description pair e sr-state adicionados pela review.

## Cross-validation summary

- Plan tasks: 5/5 fully implemented (T1.1 `fc076c1b`, T1.2 `3efcff49`, T2.1 `749aa452`, T2.2 `8b08bf6c`, T2.3 `8cfb69e6`); 0 divergências de conteúdo; plano NÃO editado pós-implement (ground truth preservado); ADRs 4/4 respeitados; Coverage Matrix 6/6 verificada.

## Quality gates summary (re-run pós-fixes)

- `pnpm test:run`: **829 passed / 0 failed**
- `pnpm typecheck`: PASS · `pnpm lint`: PASS (0 warnings)
- `pnpm registry:build && registry:validate`: PASS (67 itens; `registry/r/stepper.json` regenerado do fonte pós-fix — disciplina build-por-último)
- Wiring triad (ADR D4): 5/5 símbolos pilar (a); pilar (b) co-localizado (falso negativo de ferramenta coberto por ADR — followup #5); pilar (c) 6/6 data-slots assertados
- `/code-quality`: PASS_WITH_CAVEATS (89 — só `symbol_fab_unverifiable_typescript` ambiental)

## Spawned agents (audit trail)

- `.claude/agents/review-stepper-promotion-2026-07-15/{architecture,tests,wiring,cross-validation,domain-frontend}.md` + `findings/*.yaml`

## Handoff decision

**READY_TO_MERGE** → `/release` (0.20.0 — minor, § Added não-vazio).
