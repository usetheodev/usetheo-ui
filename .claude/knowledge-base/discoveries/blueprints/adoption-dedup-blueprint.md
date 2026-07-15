# Blueprint: Adoção e dedup nos consumidores (M7)

> **Version 1.0** — 2026-07-15
> **Slug:** `adoption-dedup`
> **Plan:** `.claude/knowledge-base/discoveries/plans/adoption-dedup-plan.md` (v1.1, SHIPPABLE 100)
> **Pesquisa:** cross-repo (dashboard + studio), citações spot-checked (3/3 confirmadas pelo orquestrador + verificação independente do achado de zero-callers).

## Context

ROADMAP § M7 (deps M0-M6). Descoberta 100% leitura dos consumidores (ADR D2/D3 do plan). Baseline capturado 2026-07-15.

## Objective

Fixar o custo real da migração do dashboard, o inventário de dedup com veredito por componente, o estado Tier-1 do studio e o north-star baseline reprodutível.

## Coverage Corner 1 — Integration Tests

**Q3 — done.** Mapa sítio→teste→risco (paths absolutos no relatório de pesquisa, resumo):

| Sítio de troca | Teste | Risco |
|---|---|---|
| lens.tsx (TrendChart) | `lens.test.tsx:80,99-118` asserta `data-testid` trend-* | **QUEBRA** — migrar seletores para `data-slot` (convenção da lib) |
| lens/dashboards + evaluators | assertions por `role=img`/aria-label | Sobrevivem (lib mantém `role="img"` + `${title} trend`) |
| BuildTimelineLive/StepCard | `build-*-{live,card,timer}.test.tsx` | QUEBRA parcial — assertions de ícone/label migram p/ `data-slot="stepper-*"`; lógica SSE sobrevive |
| trace-detail breadcrumb | `trace-detail.test.tsx:600-610` testids | QUEBRA a menos que o wrapper preserve testids |
| trace-detail `ancestors()` | `:560-573` (puro) | Sobrevive (helper fica no dashboard) |

Lição transversal: o maior custo de teste da adoção é a convenção `data-testid` (dashboard) vs `data-slot` (lib).

## Coverage Corner 2 — Dependencies

**Q4 — done.** Skew:

| Consumidor | @usetheo/ui | react | tailwind | Veredito |
|---|---|---|---|---|
| dashboard (`package.json:79`) | `^0.13.2` (8 minors atrás) | ^19 ✓ | ^4.3 ✓ | peers OK; **API não** — ver Corner 4 |
| studio (`packages/studio/package.json:16`) | `^0.17.0` | ^19.2 ✓ | ^4.3.2 ✓ | bump additive-only (0.18-0.21 só § Added) |

**Achado central do skew:** o custo do dashboard NÃO é o breaking 0.15.0 (neutralizado por guard local `alert-guard.tsx:16-19`; zero children nos demais slot-primitives — greps registrados). É o **pivot split**: 7 símbolos importados (`TheoUIProvider`, `violetForge`, `ThemeProvider`, `TokenUsageChart(+Point)`, `UsageMeter(+Metric)`) não existem em 0.21.0 — vivem em `@theokit/ui`, que o dashboard não tem. Ação: nova dep `@theokit/ui` + retarget de 7 imports em 8 arquivos, num PR ÚNICO antes de qualquer dedup.

## Coverage Corner 3 — Tools

**Q5 — done.** North-star por **símbolos únicos importados de `@usetheo/ui`** (comandos literais registrados no plano de pesquisa — reprodutíveis para o delta pós-adoção):

| Consumidor | Símbolos únicos | Linhas import | Arquivos |
|---|---|---|---|
| dashboard | **45** (7 órfãos pós-pivot) | 158 | 155 |
| studio | **9** | 19 | 19 |
| **União** | **46** | 177 | 174 |

Baseline a persistir em `knowledge-base/audits/` no implement do M7 (DoD b4).

## Coverage Corner 4 — Techniques

### Q1 — Tabela de migração do dashboard (done)

| Sítio | Mudança | Ação |
|---|---|---|
| `src/main.tsx:4`, `.storybook/preview.tsx:7` | TheoUIProvider/violetForge → @theokit/ui | dep nova + retarget |
| harness de teste (4 arquivos) | ThemeProvider/violetForge → @theokit/ui | retarget |
| `src/pages/memory.tsx:4`, `src/pages/billing.tsx:4` | TokenUsageChart/UsageMeter → @theokit/ui | retarget |
| 54 sítios `</Alert>` | via guard local — compila pós-0.15.0 | opcional: aposentar guard (fora do M7 mínimo) |
| demais 38 símbolos | existem em 0.21.0 (verificação símbolo a símbolo) | nenhum |

### Q2 — Inventário de dedup (done; vereditos verificados)

| Hand-rolled | Callers de produção | Veredito | Delta |
|---|---|---|---|
| `metric-trend-chart.tsx` | 3 páginas lens + 2 type-only | **MIGRAR → TrendChart** | rename componente + `yFormat`→`valueFormatter` + testids→data-slot |
| `build-timeline.tsx` (estático) | **ZERO** (só stories) | **DELETAR** (dead code) | — |
| `build-timeline-live.tsx` + `build-step-card.tsx` + timer | deployment-detail + timeline-tab | **MIGRAR render → Stepper** | orquestração SSE fica; card → `StepperStepData`; vocabulário `queued/running/succeeded`→`pending/active/done`; timer → slot `timestamp` |
| `virtual-table.tsx` | **ZERO** (só o próprio teste; verificado 2×: grep independente do orquestrador) | **DELETAR** (dead code) | — |
| `trace-detail/breadcrumb.tsx` | trace-detail/index.tsx | **MIGRAR → Breadcrumb** (`Link asChild` para crumbs clicáveis) | helper `ancestors()` + hooks ficam |

**⚠️ Sinal para o M6:** o consumidor que motivou a promoção do virtual-table NÃO tem call site vivo — a justificativa do M6 repousa nos casos forward-looking do ROADMAP (audit views, memórias/chunks do theo-rag em escala), não no dashboard atual. Registrado no plano do M6 (Drawbacks v1.2) e surfaced ao humano.

### Q6 — Tier-1 studio (done)

- [x] Breadcrumb no shell (`shell.tsx:1,11-38,198` — adotado no M0)
- [ ] Slider no playground — FALTA; **o playground hoje não tem NENHUM parâmetro range/select** (greps vazios): o caso de uso precisa ser CRIADO, não trocado
- [ ] Combobox no playground — FALTA (grep vazio)
- [ ] JsonViewer no event inspector — FALTA; alvo concreto: `pages/events/index.tsx:96-97` (`<pre>{JSON.stringify(...)}</pre>`)
- [ ] DescriptionList em detail views — FALTA; nenhum `<dl>` em pages/ (grep vazio)

## Cross-cutting Comparison

| Dimensão | Dashboard | Studio |
|---|---|---|
| Skew | 8 minors + pivot split (7 símbolos) | 4 minors, additive |
| Trabalho | 1 PR bump/retarget + 3 PRs de dedup (TrendChart, Stepper, Breadcrumb) + 2 deleções secas | 1 PR bump + 3-4 PRs de adoção Tier-1 (2 exigem criar o caso de uso) |
| Risco de teste | testids→data-slot (2 suites) | baixo (telas novas) |

## ADRs

### D1 — Sequenciamento: bump primeiro, dedup depois, por consumidor

**Decision:** dashboard: PR-0 (bump 0.21.0 + dep @theokit/ui + retarget dos 7 + suites verdes) → PR-1 TrendChart → PR-2 Stepper → PR-3 Breadcrumb → PR-4 deleções secas (build-timeline estático + virtual-table + testes órfãos). Studio: PR-0 bump → PR-1 JsonViewer+DescriptionList (event inspector/detail) → PR-2 playground (Slider+Combobox — cria o caso de uso).

**Rationale:** o bump é pré-condição de TODO dedup (os componentes novos não existem em 0.13.2); PRs pequenos por componente mantêm as suites como prova (Q3); deleções secas por último (zero risco).

**Alternatives considered:** um PR gigante por repo (rejeitado — quebras de teste de 2 suites diferentes misturadas; review impossível); dedup antes do bump com copy-paste do registry (rejeitado — duplica a fonte que o M7 existe para deletar).

### D2 — Deleções secas contam para o north-star como dedup, não adoção

**Decision:** `build-timeline.tsx` (estático) e `virtual-table.tsx` saem como dead code (zero callers verificados 2×) — sem substituto no call site (não há call site).

**Rationale:** Rule 2 (completude) mede deleção de duplicados; manter dead code para "migrar depois" é o anti-pattern que o M7 fecha. **Alternatives:** migrar os arquivos mortos para a lib "por completude" (rejeitado — YAGNI; a lib JÁ tem Stepper/DataTable-virtualized pelos casos forward-looking do roadmap).

### D3 — Playground do studio ganha o caso de uso junto da adoção

**Decision:** Slider/Combobox entram criando o painel de parâmetros do playground (temperatura/top-p/model picker) — o DoD b3 pede "uso real", e o playground hoje não tem params.

**Rationale:** adoção decorativa (import sem tela real) violaria o espírito do north-star. **Alternatives:** marcar Tier-1 como bloqueado até o studio criar a tela (rejeitado — o M7 é exatamente o milestone de fechar esse loop; coordenar com o ciclo do studio).

## Recommendations for the project

1. `/to-plan adoption-dedup` estrutura por PRs do ADR D1 (cada PR = 1 task com suite verde como AC).
2. Persistir o baseline north-star (46 símbolos / 177 imports / 174 arquivos + comandos literais) em `knowledge-base/audits/adoption-northstar-baseline.md` no primeiro task.
3. Migração de seletores: PR-1/PR-2 do dashboard incluem a troca testid→data-slot nas 2 suites afetadas.
4. O PR-0 do dashboard documenta a migração 0.15.0 como no-op (guard) — cumpre o DoD b1 "documentada e aplicada".

## Blocked questions

(nenhuma — 6/6 done)

## Halt-loop progress (audit trail)

| Q | Status | Evidência-chave |
|---|---|---|
| Q4 | done | package.jsons (skew 0.13.2 / 0.17.0; peers OK) |
| Q1 | done | 45 símbolos; 7 órfãos do pivot; guard alert-guard.tsx:16-19; greps de children vazios |
| Q2 | done | inventário file:line; 2 dead-code verificados 2× |
| Q3 | done | mapa teste→risco (testid vs data-slot) |
| Q5 | done | comandos literais + 46/177/174 |
| Q6 | done | shell.tsx:11 ✓; 4 gaps com greps registrados |

## Related

- Plan: `.claude/knowledge-base/discoveries/plans/adoption-dedup-plan.md` (v1.1)
- Edge-case review: `.claude/knowledge-base/reviews/adoption-dedup-edge-cases-2026-07-15.md`
- Sinal cruzado: plano M6 `.claude/knowledge-base/plans/datatable-virtualized-plan.md` (Drawbacks v1.2)
- ROADMAP § M7
