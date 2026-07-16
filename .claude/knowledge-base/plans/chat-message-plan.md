---
slug: chat-message
milestone_id: M19
created_at: 2026-07-15
goal: Publicar ChatMessageCard (mensagem role + parts) + MessageBranchSelector (navegar alternativas) + PromptTemplateEditor (editor com autocomplete de variáveis) no @usetheo/ui compondo primitivos existentes, com zero dependência nova.
---

# Plan: Chat & message components (M19)

> **Version 1.0** — V3. Fontes: phoenix `ChatTemplateMessageCard.tsx`, `MessageBranchSelector.tsx`, `templateEditor/TemplateEditor.tsx` (ELv2 study-only). Controlados/puros; PromptTemplateEditor = overlay sobre `Textarea` (rung 5, não CodeMirror). Compõe `code-block`/`io-cards`/`Badge`/`Button`/`Textarea`. Zero dep nova.

## Goal
Formalizar o padrão chat/agent (Phoenix tem rico). 3 componentes.

## Context
ROADMAP § M19 (V3). O transcript do lens já mostra mensagens.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/components/composites/{chat-message-card,message-branch-selector,prompt-template-editor}/*`, `registry/*`. Editados: `src/index.ts`, `CHANGELOG.md`. Reuso: `code-block`, `io-cards` (ou `JsonViewer`), `Badge`, `Button`, `Textarea`, `cn`. Tipos `ChatMessage`/`ToolCall` do trace-core (já exportados) onde couber.
### Current callers / dependents
Zero na lib (novos). Adoção: `dashboard/src/pages/lens/trace-detail` transcript (mensagens já existem) p/ ChatMessageCard.
### Domain glossary
chat message = {role, content, toolCalls?, toolResults?}; branch = alternativa de resposta (regenerate); template = string com variáveis {{var}}/{var}.
### Architecture boundaries affected
Todos controlados/puros: ChatMessageCard (message via prop), MessageBranchSelector (index+count+onNav), PromptTemplateEditor (value+onChange+variables). Sem fetch/streaming (plataforma).

## Prior Art & Related Work
- V3 gap grill. phoenix `ChatTemplateMessageCard.tsx`, `MessageBranchSelector.tsx`, `TemplateEditor.tsx`. trace-core (`ChatMessage`/`ToolCall`). `code-block`, `io-cards`.

## Objective
- [ ] `ChatMessageCard` + `MessageBranchSelector` + `PromptTemplateEditor` publicados (stories+axe+testes+registry)
- [ ] typecheck/lint/format 0; `registry:validate` PASS
- [ ] North-star delta; zero dep nova
- [ ] Adoção avaliada (transcript) senão componente 100% funcional

## Dependencies
Nenhuma dep NOVA. `/deps-audit` plan-bound confirma.

## ADRs
### D1 — PromptTemplateEditor = overlay sobre Textarea (rung 5, não CodeMirror)
**Decision:** editor = `Textarea` + detecção de `{{var}}`/`{var}` + dropdown simples de sugestões de variáveis; sem lib de editor. **Rationale:** parsimony rung 5; CodeMirror seria dep pesada (ADR anti-lib). Alternativa: CodeMirror (rejeitada — 500kB+). 
### D2 — ChatMessageCard reusa code-block/io-cards p/ parts estruturados
**Decision:** texto simples inline; tool-calls/results via `code-block`/`io-cards` (ou JsonViewer). **Rationale:** DRY (reusa render estruturado do M8). Alternativa: render próprio (rejeitada — duplica io-cards).
### D3 — Todos controlados; streaming é plataforma
**Decision:** MessageBranchSelector recebe index+count+onPrev/onNext (controlado); streaming/regenerate é backend. **Rationale:** fronteira DS. Alternativa: incluir fetch (rejeitada — plataforma).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| autocomplete puxar editor pesado | Medium | ADR D1: overlay simples sobre Textarea (rung 5) | Claude |
| render de tool-calls estruturados | Low | ADR D2: reusa io-cards/code-block | Claude |
| ChatMessageCard duplicar trace-transcript | Low | ChatMessageCard é card de UMA mensagem (átomo); transcript é feed — verificado no review | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: ChatMessageCard (controlado, reusa code-block/io-cards)
F2: MessageBranchSelector (controlado, compõe Button)
F3: PromptTemplateEditor (overlay sobre Textarea)
F4: registry + release-prep (F1,F2,F3)
F5: adoção avaliada (transcript) + north-star (F4 released)
```

## Phase 1: ChatMessageCard
### T1.0 — ChatMessageCard
#### Objective
`src/components/composites/chat-message-card/`: props `{ role: string; content?: string; toolCalls?: ToolCall[]; toolResults?: unknown[]; className? }`; card com badge de role + content (texto) + tool-calls/results via code-block/io-cards; forwardRef; data-slot.
#### Why this step (action + reasoning)
Átomo de mensagem; reusa render do M8.
#### Evidence
phoenix `ChatTemplateMessageCard.tsx`. `code-block`/`io-cards`.
#### Files to edit
`src/components/composites/chat-message-card/{chat-message-card.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Badge`, `code-block`/`JsonViewer`, `cn`.
#### Deep Dives
role badge (user/assistant/tool/system); só content → texto; tool-calls → code-block; content vazio + sem tools → empty honesto.
#### Tasks
1. RED: testes (role badge, content, tool-calls render, empty). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_renderiza_badge_de_role`
- `test_content_texto_renderizado`
- `test_tool_calls_via_code_block`
- Negativo: `test_sem_content_e_sem_tools_empty`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/chat-message-card` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: MessageBranchSelector
### T2.0 — MessageBranchSelector
#### Objective
`src/components/composites/message-branch-selector/`: props `{ index: number; count: number; onPrev: () => void; onNext: () => void; disabled? }`; "‹ i/N ›" com botões; borda honesta (prev disabled em 0, next em N-1); forwardRef; data-slot.
#### Why this step (action + reasoning)
Navegação de alternativas (gap phoenix).
#### Evidence
phoenix `MessageBranchSelector.tsx`.
#### Files to edit
`src/components/composites/message-branch-selector/{message-branch-selector.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Button`, `cn`.
#### Deep Dives
count<=1 → não renderiza (ou desabilitado); index 0 → prev disabled; index N-1 → next disabled.
#### Tasks
1. RED: testes (i/N, prev/next emitem, bordas disabled). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_mostra_index_e_count` — "2 / 5"
- `test_next_emite_onNext`
- `test_index_zero_prev_disabled`
- `test_index_ultimo_next_disabled`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/message-branch-selector` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 3: PromptTemplateEditor
### T3.0 — PromptTemplateEditor
#### Objective
`src/components/composites/prompt-template-editor/`: props `{ value: string; onChange: (v: string) => void; variables?: string[]; disabled?; className? }`; `Textarea` + detecção de `{{var}}`/`{var}` + lista/hint de variáveis disponíveis; overlay simples (rung 5); forwardRef; data-slot.
#### Why this step (action + reasoning)
Editor de template (gap phoenix); overlay leve, zero dep.
#### Evidence
phoenix `templateEditor/TemplateEditor.tsx:59-116`. ADR D1.
#### Files to edit
`src/components/composites/prompt-template-editor/{prompt-template-editor.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Textarea`, `Badge`, `cn`; helper puro de extração de variáveis (`extractVars`).
#### Deep Dives
extrai variáveis usadas do texto (`{{x}}`); mostra quais das `variables` faltam/estão usadas; digitar emite onChange; disabled.
#### Tasks
1. RED: testes (extractVars puro, onChange, hint de variáveis, disabled). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_extractVars_extrai_mustache_e_fstring` (helper puro)
- `test_digitar_emite_onChange`
- `test_mostra_variaveis_disponiveis`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/prompt-template-editor` → 0 failed (axe)
- `python3 .claude/skills/implement/scripts/mini_review.py chat-message --phase 3` → PASS OR gates diretos verdes
#### DoD
Barrel + CHANGELOG.

## Phase 4: Registry + release
### T4.0 — Registry + full gates
#### Objective
Itens `chat-message-card` + `message-branch-selector` + `prompt-template-editor`; build+validate; full gates.
#### Why this step (action + reasoning)
DoD exige registry válido.
#### Evidence
Precedente M8-M18.
#### Files to edit
`registry/{chat-message-card,message-branch-selector,prompt-template-editor}.json` → build.
#### Deep file dependency analysis
chat-message-card deps: cn, badge, code-block, tailwind-preset; message-branch-selector deps: cn, button, tailwind-preset; prompt-template-editor deps: cn, textarea, badge, tailwind-preset.
#### Tasks
1. validate oráculo. 2. descriptors+build. 3. Full gates.
#### TDD
- `registry:build && validate` → 0; full suite verde
#### Concurrency tests
(none)
#### Acceptance Criteria
- registry:validate → 0
#### DoD
Pronto p/ review + release.

## Phase 5: Adoção (avaliar) + north-star
### T5.0 — Adoção transcript (se casar) + north-star
#### Objective
Avaliar adoção do `ChatMessageCard` no transcript do trace-detail (mensagens já existem); se não casar limpo, adoção diferida honesta; north-star (+3 componentes).
#### Why this step (action + reasoning)
Honestidade: adoção real onde há superfície.
#### Evidence
`trace-detail` transcript (lens).
#### Files to edit
(cross-repo, se aplicável) `dashboard/`; senão north-star do DS.
#### Deep file dependency analysis
o `TraceTranscript` do DS já é usado no lens — avaliar se ChatMessageCard complementa sem duplicar.
#### Deep Dives
não duplicar o TraceTranscript; adotar só se houver ganho real.
#### Tasks
1. Avaliar transcript. 2. Adotar SE casar. 3. North-star.
#### TDD
- Se adotar: `cd dashboard && pnpm vitest run <alvo>` → 0
- Sempre: north-star
#### Concurrency tests
(none)
#### Acceptance Criteria
- componentes 100% funcionais; adoção registrada (real ou diferida honesta)
#### DoD
North-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| ChatMessageCard publicado | T1.0 |
| MessageBranchSelector publicado | T2.0 |
| PromptTemplateEditor publicado | T3.0 |
| Registry válido | T4.0 |
| Adoção avaliada + north-star | T5.0 |
| Zero dep nova | T1.0, T4.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T5.0).**

## Global Definition of Done
- [ ] `pnpm test:run && typecheck && lint && format:check && registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] CHANGELOG `[Unreleased]`; `/review` READY_TO_MERGE antes do release
- [ ] Adoção registrada (real ou diferida honesta)

## Failure scenarios (when I/O external)
(none — componentes controlados; streaming/regenerate é plataforma)

## Critical paths (para mutation testing, se rodar)
`prompt-template-editor` (extractVars) e `message-branch-selector` (bordas disabled).

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: stories dos 3 (visual+axe). 2. build+registry. 3. Wiring triad.
