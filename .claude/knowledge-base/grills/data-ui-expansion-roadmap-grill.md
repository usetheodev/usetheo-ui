---
slug: data-ui-expansion
date: 2026-07-14
generated_by: roadmap-init
questions_answered: 7
unresolved_dims: []
status: completed
---

# Roadmap grill: data-ui-expansion

### Q1/7: Problema-raiz

**Question:** Qual é o problema-raiz que esta expansão do design system resolve, e para quem dói hoje?

**Recommended:** Os dois consumidores de UI (dashboard do theo-cloud e theokit-studio) precisam construir telas de operação para theo-memory e theo-rag (listas de memórias, playgrounds de query, pipelines de ingest, analytics), mas o `@usetheo/ui` não cobre ~8 padrões genéricos de dados — então cada consumidor hand-rola a sua versão (o dashboard já tem 156 arquivos de componentes próprios; o studio já hand-rolou Breadcrumb com comentário reclamando da falta). A dor é duplicação divergente: mesmo padrão implementado 2x, com qualidade/a11y/tokens inconsistentes, e todo produto novo da família paga o custo de novo.

**User answer:** Aceito a recomendação (verbatim).

### Q2/7: Usuários primários

**Question:** Quem são os usuários primários desta expansão (papel, interno vs externo, um time vs vários)?

**Recommended:** Dois níveis. Diretos: os desenvolvedores frontend dos dois consumidores internos — time do dashboard do theo-cloud (produto maduro, DESIGN.md rígido, 51+ telas) e time do theokit-studio (greenfield, M5 em fixtures) — mais o próprio `@theokit/ui`, que compõe sobre estes primitives para a camada AI. Indiretos/externos: como o `@usetheo/ui` é Apache-2.0 com registry shadcn público (copy-paste via `npx shadcn add`), qualquer consumidor externo do registry também recebe os componentes — o que reforça a exigência de que sejam genéricos (zero acoplamento a domínio theo-memory/theo-rag; nada de "MemoryCard", e sim "DescriptionList").

**User answer:** Aceito a recomendação (verbatim).

### Q3/7: Escopo do V1 (in-scope)

**Question:** O que está dentro do escopo do V1 — o must-have para declarar esta expansão viva?

**Recommended:** Os dois tiers da análise, como escopo do V1:
- Tier 1 (criar do zero, genéricos e baratos): Breadcrumb, Slider (Radix), DescriptionList, JsonViewer (tree colapsável dependency-free), Combobox (sobre o cmdk já instalado).
- Tier 2 (promover do dashboard, código já provado em produção): TrendChart (SVG puro, de metric-trend-chart.tsx), Stepper/PipelineStatus (de build-timeline.tsx), FileDropzone (novo, mas padrão consolidado), virtualização no DataTable (de virtual-table.tsx, única dependência nova: @tanstack/react-virtual).

Cada componente com o DoD padrão da lib: testes vitest + axe, story, entrada em registry/*.json válida, tokens-only, estados empty/loading/error onde aplicável. "Vivo" = os 9 componentes publicados e pelo menos 1 consumidor (studio ou dashboard) usando cada um de Tier 1 em tela real.

**User answer:** Aceito a recomendação (verbatim).

### Q4/7: Fora do escopo (out-of-scope)

**Question:** O que está explicitamente fora do escopo — tentador, mas não é para este projeto?

**Recommended:**
1. Componentes AI-nativos (Citations, answer ConfidenceBadge, Recall/Answer Playground, Chat) → pertencem ao @theokit/ui. Fronteira do split AI/não-AI, não se cruza.
2. Graph explorer (entidades/communities force-directed) → visualização de domínio pesada, exige lib de layout; fica no app até existir 2º caso concreto.
3. DatePicker completo → input type=datetime-local estilizado resolve o asOf bi-temporal por ora (parsimony rung 3).
4. Syntax highlighting no CodeBlock → shiki/prism quebraria o registry copy-pasteable; prop language já é forward-compat.
5. Wizard multi-step de connectors → theo-rag M12+, distante demais (YAGNI).
6. Features avançadas de tabela (column resize/reorder/pin, cell editing, row grouping) → nenhum consumidor pediu; esperar caso real.
7. Adoção de chart lib externa (Recharts/D3) → mantém-se o ADR "SVG puro, zero dep de chart".

**User answer:** Aceito a recomendação (verbatim).

### Q5/7: Restrições duras

**Question:** Quais são as restrições duras (stack, compliance, deadline, tamanho de time, runtime)?

**Recommended:**
1. Stack fixa: TypeScript strict, React function components, ESM-only, Tailwind (preset theoUIPreset), Radix para interações, cva para variantes, vitest + vitest-axe, biome, tsup. Peer deps: react/react-dom (19 nos consumidores).
2. Registry shadcn: todo componente precisa de entrada registry/*.json válida (registry:validate verde) e ser copy-pasteable — proíbe dependências pesadas por componente.
3. Dependências: política zero-dep-nova salvo justificada por ADR; única candidata do V1 é @tanstack/react-virtual. Licença Apache-2.0 (nada de copiar código GPL de referências).
4. Fronteira de camada: genérico e AI-agnóstico (AI fica no @theokit/ui); nada de nomes/props acoplados a theo-memory/theo-rag.
5. Contrato de consumidor: DESIGN.md do dashboard (tokens-only, a11y WCAG AA, axe zero critical, estados obrigatórios) é o teto de qualidade; breaking changes exigem semver + migração documentada (skew 0.13.2→0.15.x do dashboard precisa ser resolvido antes da adoção).
6. Processo: Cycle 6+1 (TDD-first, CHANGELOG, develop-only). Time = Paulo + Claude; sem deadline externo declarado — ritmo por milestones.

**User answer:** Aceito a recomendação (verbatim).

### Q6/7: Critério de sucesso do ship V1

**Question:** Qual é o critério de sucesso mensurável para o ship do V1 (um número, um comportamento, um benchmark)?

**Recommended:**
1. 9/9 componentes do escopo publicados numa release semver do @usetheo/ui, cada um com: teste vitest + axe (zero violations), story, entrada registry/*.json validando, e documentação de props.
2. Adoção real ≥ 1 consumidor por componente: os 5 de Tier 1 usados em tela real do theokit-studio (bloqueado hoje em Breadcrumb, sliders de playground, JSON do event inspector); os 4 de Tier 2 com o dashboard tendo substituído (ou aberto PR substituindo) o hand-rolled correspondente — a prova de reuso é a deleção de código duplicado no dashboard (~4 componentes hand-rolled removidos).
3. Zero regressão: typecheck/lint/test/registry:validate verdes; nenhum breaking não-documentado (checado contra o consumo do dashboard 0.15.x).

**User answer:** Aceito a recomendação (verbatim).

### Q7/7: Métrica north-star

**Question:** Qual é a métrica north-star — a que, quando se move, o time sabe que o projeto está vencendo?

**Recommended:** Taxa de reuso nos consumidores — medida como a redução de componentes de UI hand-rolled genéricos nos apps da família. Operacionalização: contagem de arquivos em dashboard/src/components/ (e equivalente no studio) que reimplementam padrão genérico coberto pela lib. Hoje: ~156 arquivos no dashboard (~10-15 padrões genéricos duplicados) e crescendo; vencendo = essa contagem cai a cada release da lib e nenhum padrão genérico novo nasce hand-rolled (quando um dev precisa de um componente de dados, o primeiro lugar onde olha — e encontra — é o @usetheo/ui). Proxy secundário: nº de telas dos produtos theo-memory/theo-rag construídas 100% com a lib, sem componente local novo.

**User answer:** Aceito a recomendação (verbatim).
