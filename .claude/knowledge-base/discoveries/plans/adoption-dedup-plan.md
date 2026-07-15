# Discovery Plan: Adoção e dedup nos consumidores (M7)

> **Version 1.1** (2026-07-15 — absorve EC-1; EC-2 documentado) — Mapear com evidência o estado REAL de adoção nos dois consumidores (dashboard `@usetheo/ui@0.13.2` skew; studio) para fixar: o custo da migração do breaking 0.15.0, o inventário completo de call sites dos hand-rolled a deletar (metric-trend-chart, build-timeline, virtual-table, breadcrumb), o estado do Tier-1 no studio e a contagem north-star baseline — sem incógnita para o `/to-plan` do M7.

**Slug:** `adoption-dedup`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 2h (ADR D1)

## Context

ROADMAP § M7 (deps M0-M6; M6 em pré-stage aguardando PR #6). Pré-staging durante o gate — artefatos `.claude/` apenas, não commitados (ADR D4 da família). Este milestone é CROSS-REPO: o trabalho de código acontece no dashboard e no studio (repos com ciclos próprios); o que a lib entrega é o plano de adoção com PRs preparados + a contagem north-star em `knowledge-base/audits/`. A descoberta é 100% leitura (nenhuma referência SOTA — consumidores internos via ADR D3 da família).

Regras consumidas: `rules/architecture.md § 3`, `rules/testing.md` (migração exige testes dos consumidores verdes), Rule 2 (Completude — deleção dos duplicados é o critério, não o import).

## Objective

Blueprint que fixe: (a) diff de API 0.13.2→corrente que afeta o dashboard (breaking 0.15.0 children-rejection + renames), (b) inventário file:line de TODOS os call sites dos 4 hand-rolled no dashboard, (c) estado real do Tier-1 no studio (o que já usa / o que falta), (d) contagem north-star baseline com método reprodutível.

- [ ] All research questions answered with citations (paths absolutos dos consumidores)
- [ ] Tabela de migração 0.15.0 populated
- [ ] North-star baseline com comando reprodutível
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope

| Alvo | Escopo | Reason |
|---|---|---|
| (interno) `CHANGELOG.md` + `src/index.ts` da lib | diff de API 0.13.2→0.21.0 | Fonte do custo de migração |
| (consumidor — ADR D3) dashboard | `package.json`, call sites de `@usetheo/ui`, dos 4 hand-rolled e dos 6 usos dos slots-primitives do breaking 0.15.0 | DoD b1/b2 |
| (consumidor — ADR D3) studio | `package.json`, shell/playground/event-inspector/detail-views | DoD b3 (Tier-1) |

### Out-of-Scope (explicit)

| Item | Why |
|---|---|
| Escrever código de migração nos consumidores | É o implement do M7 (cross-repo), não a descoberta |
| `.claude/knowledge-base/references/*` | Sem referência SOTA — milestone de adoção interna (deferral coberto pelo ADR D2) |
| theo-memory/theo-rag como consumidores diretos de UI | Consomem via dashboard/studio |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** lib (CHANGELOG diff) 0.25h; dashboard 1h (inventário é o grosso); studio 0.5h; síntese 0.25h. Total 2h.

**Rationale:** o dashboard concentra o risco (skew de 8 minors + breaking). Alternativas: split igual (desperdiça no studio, que já adota Tier-1 parcialmente), pular o diff da lib (rejeitada — o custo de migração é o DoD b1).

**Stop condition — per question:** Fase A vazia após 3 variantes de grep → BLOCKED; próxima. **Per project:** budget exaurido → BLOCKED honesto; nunca COMPLETE parcial.

### D2 — Sem coverage corner de referência SOTA (deferral justificado)

**Decision:** os 4 corners são preenchidos com os CONSUMIDORES como alvo (tests = suites dos consumidores; deps = versões/skew; tools = método da contagem north-star; techniques = padrões de substituição 1:1).

**Rationale:** milestone de adoção interna — a "referência" é o próprio ecossistema; clonar SOTA de "migração" não responde nenhuma questão concreta (YAGNI).

### D3 — Consumidores lidos via path absoluto (família M0-M6)

**Decision:** idem M0-M6.

### D4 — Nenhum commit até o merge do PR #6

**Decision:** artefatos UNCOMMITTED (precedente M4-M6).

## Research Questions

| # | Question | Corner | Alvo | Fase A (broad) | Fase B (deep) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Que APIs da lib mudaram entre 0.13.2 e 0.21.0 que o dashboard USA (breaking 0.15.0: quais dos 6 slot-primitives o dashboard passa children? renames? novos peers)? | techniques | lib + dashboard | Grep imports `@usetheo/ui` no dashboard | Cruzar com CHANGELOG 0.14-0.21 | Tabela sítio→mudança→ação de migração |
| Q2 | Inventário COMPLETO de call sites dos 4 hand-rolled no dashboard (metric-trend-chart, build-timeline, build-step-card, virtual-table, breadcrumb hand-rolled) — quem importa, com que props, e o delta para o componente da lib? | techniques | dashboard | Grep imports por arquivo | Read dos call sites | Lista file:line → componente da lib → deltas de prop |
| Q3 | Que testes dos consumidores cobrem os sítios de substituição (suites que provam a migração verde) e quais quebrariam? | tests | dashboard + studio | Glob `*.test.tsx` vizinhos dos call sites | Read seletivo | Mapa sítio→teste→risco |
| Q4 | Skew de versões e deps: dashboard `@usetheo/ui@?` real, studio `@?`; peers (react, tailwind) compatíveis com 0.21.0? | deps | ambos | Read package.json | Confirmar peers | Tabela de skew |
| Q5 | Método da contagem north-star: como contar "componentes da lib em uso real" reprodutivelmente (grep de imports? por tela?) e qual o baseline HOJE? | tools | ambos | Definir comando + rodar | Registrar números | Comando + baseline por consumidor |
| Q6 | Estado do Tier-1 no studio: Breadcrumb no shell (já em 22c1777?), Slider/Combobox no playground, JsonViewer no event inspector, DescriptionList em detail views — o que JÁ está e o que falta? | techniques | studio | Grep imports por componente | Read das telas | Checklist DoD b3 com evidência |

**Consumer requirements:** paths absolutos `/home/paulo/Projetos/usetheo/theo-cloud/theo-cloud/dashboard/` e `/home/paulo/Projetos/usetheo/theokit-tools/theokit-studio/`.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q3 | Covered |
| Dependencies | Q4 | Covered |
| Tools | Q5 | Covered |
| Techniques | Q1, Q2, Q6 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop checkpoints (para /discover-execute)

- Q4 antes de Q1 (o skew define o intervalo de CHANGELOG a ler); Q2 antes de Q3 (os sítios definem os testes).
- Toda citação `path:linha` verificada por Read na mesma iteração.
- Q5: o comando da contagem DEVE ser reprodutível (registrado literal) — a mesma linha roda pós-adoção para o delta.
- Ausências (ex.: studio sem Combobox ainda) registradas com o grep executado.
- **EC-1:** Q4 varre TODOS os package.json dos workspaces (find, excluindo node_modules) — não só o raiz.

## Acceptance Criteria

- [ ] 6/6 questões `done` (ou `blocked` honesto)
- [ ] Citações resolvem em disco (`check_reference_citations.py` PASS — sem refs SOTA, zero paths de referência)
- [ ] 4 corners populados (`check_research_coverage.py` PASS)
- [ ] ≥ 1 ADR (estratégia de sequenciamento dos PRs de adoção)
- [ ] North-star baseline numérico com comando
- [ ] `/discover-confidence adoption-dedup` ≥ SHIPPABLE_WITH_CAVEATS (89)

## Global Definition of Done

Blueprint em `.claude/knowledge-base/discoveries/blueprints/adoption-dedup-blueprint.md` ≥ SHIPPABLE_WITH_CAVEATS; alimenta o `/to-plan` do M7 — que dispara após M6 released.
