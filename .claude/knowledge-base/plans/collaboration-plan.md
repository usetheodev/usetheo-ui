---
slug: collaboration
milestone_id: M17
created_at: 2026-07-15
goal: Publicar CommentThread (thread de comentários + composer, controlado) + TagInput (tags via combobox, controlado) no @usetheo/ui compondo primitivos existentes, com zero dependência nova.
---

# Plan: Collaboration (M17)

> **Version 1.0** — V3. Fontes: langfuse `comments/` (`InlineCommentBubble.tsx`, `CommentableJsonView.tsx`) + `tag/` (MIT). Componentes controlados; backend de comments/tags não existe (adoção plena diferida — honesto). Compõe `Combobox`/`Badge`/`Textarea`/`Button`/`Avatar`. Zero dep nova.

## Goal
Fechar o gap de colaboração humana (Langfuse-core tem comments+tags). 2 componentes controlados.

## Context
ROADMAP § M17 (V3). Backend de comments/tags ausente → adoção plena gated; componentes DS-now.

## Baseline Context (deep review of current state)
### Files that will be touched
Novos: `src/components/composites/{comment-thread,tag-input}/*`, `registry/*`. Editados: `src/index.ts`, `CHANGELOG.md`. Reuso: `Combobox`, `Badge`, `Textarea`, `Button`, `Avatar`, `Timestamp`, `cn`.
### Current callers / dependents
Zero na lib (novos). Adoção plena requer backend de comments/tags (diferida honestamente).
### Domain glossary
comment = {id, author, body, createdAt}; thread = lista ordenada + composer; tag = string livre; TagInput = adicionar/remover com combobox de sugestões.
### Architecture boundaries affected
Ambos controlados: `CommentThread` recebe `comments[]` + `onSubmit(body)`; `TagInput` recebe `value: string[]` + `onChange`. Sem fetch (consumidor traz/persiste).

## Prior Art & Related Work
- V3 gap grill. langfuse `comments/`+`tag/`. Primitivos: `Combobox` (M-anterior), `Badge`, `Textarea`, `Button`, `Avatar`, `Timestamp`.

## Objective
- [ ] `CommentThread` + `TagInput` publicados (stories+axe+testes+registry)
- [ ] typecheck/lint/format 0; `registry:validate` PASS
- [ ] North-star delta; zero dep nova
- [ ] Adoção diferida honestamente (backend gated) — componentes 100% funcionais em Ladle com fixtures

## Dependencies
Nenhuma dep NOVA. `/deps-audit` plan-bound confirma.

## ADRs
### D1 — Controlados por props; adoção plena aditiva pós-backend (padrão M12)
**Decision:** `CommentThread` (comments+onSubmit) e `TagInput` (value+onChange) controlados; backend futuro é aditivo. **Rationale:** honestidade (backend não existe); padrão M12 (config-driven, fixtures). Alternativa: esperar backend (rejeitada — componente é o entregável do DS).
### D2 — Compõe primitivos; zero primitivo/dep novo
**Decision:** reusa Combobox/Badge/Textarea/Button/Avatar/Timestamp. **Rationale:** rung 4. Alternativa: inputs crus (rejeitada — perde tema/a11y).

## Drawbacks & Risks
| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| backend de comments/tags não existe (adoção plena gated) | Medium | ADR D1: controlado, migração aditiva; entregável do DS é 100% funcional | Claude |
| threading aninhado infla escopo | Low | V3 entrega thread flat; aninhado é futuro | Claude |
| TagInput duplicar Combobox | Low | TagInput é multi-valor com chips removíveis sobre Combobox — verificado no review | Claude |

## Unresolved Questions
(none)

## Dependency Graph
```
F1: TagInput (controlado, compõe Combobox+Badge)
F2: CommentThread (controlado, compõe Textarea+Button+Avatar+Timestamp)
F3: registry + release-prep (F1,F2)
F4: adoção diferida (backend gated) + north-star do DS (F3 released)
```

## Phase 1: TagInput
### T1.0 — TagInput
#### Objective
`src/components/composites/tag-input/`: props `{ value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?; disabled?; className? }`; chips removíveis (Badge + botão x) + Combobox p/ adicionar (sugestões + criar novo); a11y; forwardRef; data-slot.
#### Why this step (action + reasoning)
Componente controlado base; consome primitivos.
#### Evidence
langfuse `tag/`. `Combobox`/`Badge`.
#### Files to edit
`src/components/composites/tag-input/{tag-input.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Combobox`, `Badge`, `cn`; sem outros composites.
#### Deep Dives
tag duplicada não adiciona (dedup); remover chip → onChange sem ela; disabled desabilita add/remove; vazio → só o combobox.
#### Tasks
1. RED: testes (adicionar, remover, dedup, disabled, a11y). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_adicionar_tag_emite_onChange`
- `test_remover_chip_emite_onChange_sem_ela`
- `test_tag_duplicada_nao_adiciona`
- `test_disabled_desabilita`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/tag-input` → 0 failed (axe)
- `pnpm typecheck` → 0
#### DoD
Barrel + CHANGELOG.

## Phase 2: CommentThread
### T2.0 — CommentThread
#### Objective
`src/components/composites/comment-thread/`: props `{ comments: Comment[]; onSubmit: (body: string) => void; currentUser?; disabled?; className? }` (`Comment = { id; author: string; body: string; createdAt: string|number; avatarUrl? }`); lista ordenada (Avatar+author+Timestamp+body) + composer (Textarea+Button); empty honesto; a11y; forwardRef; data-slot.
#### Why this step (action + reasoning)
Entrega o thread; consome primitivos.
#### Evidence
langfuse `comments/`. `Textarea`/`Button`/`Avatar`/`Timestamp`.
#### Files to edit
`src/components/composites/comment-thread/{comment-thread.tsx,index.ts,*.test.tsx,*.stories.tsx}`, `src/index.ts`.
#### Deep file dependency analysis
Importa `Textarea`, `Button`, `Avatar`, `Timestamp`, `cn`; sem outros composites.
#### Deep Dives
sem comentários → empty honesto + composer; submit com body vazio → não dispara; ordem cronológica.
#### Tasks
1. RED: testes (renderiza comentários, submit emite body, vazio não dispara, empty). 2. GREEN. 3. WIRING: stories+axe.
#### TDD
- `test_renderiza_um_item_por_comentario`
- `test_submit_emite_body`
- `test_body_vazio_nao_submete`
- `test_sem_comentarios_empty_honesto`
- axe
#### Concurrency tests
(none)
#### Acceptance Criteria
- `pnpm vitest run src/components/composites/comment-thread` → 0 failed (axe)
- `python3 .claude/skills/implement/scripts/mini_review.py collaboration --phase 2` → PASS OR gates diretos verdes
#### DoD
Barrel + CHANGELOG.

## Phase 3: Registry + release
### T3.0 — Registry + full gates
#### Objective
Itens `tag-input` + `comment-thread`; build+validate; full gates.
#### Why this step (action + reasoning)
DoD exige registry válido.
#### Evidence
Precedente M8-M16.
#### Files to edit
`registry/{tag-input,comment-thread}.json` → build.
#### Deep file dependency analysis
tag-input deps: cn, combobox, badge, tailwind-preset; comment-thread deps: cn, textarea, button, avatar, timestamp, tailwind-preset.
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

## Phase 4: Adoção (diferida) + north-star
### T4.0 — Adoção diferida honesta + north-star do DS
#### Objective
Backend de comments/tags não existe → adoção plena diferida (registrada honestamente); componentes 100% funcionais em Ladle com fixtures; north-star do DS (+2 componentes).
#### Why this step (action + reasoning)
Honestidade (regra do owner): não forçar adoção decorativa sem backend.
#### Evidence
Discover: sem rota de comments/tags no lens.
#### Files to edit
North-star audit no DS; nota no run-file.
#### Deep file dependency analysis
adoção quando o backend existir (aditiva).
#### Deep Dives
não fabricar adoção; registrar gated.
#### Tasks
1. North-star audit (+2 componentes). 2. Nota de adoção diferida no run-file.
#### TDD
- Componentes 100% funcionais (Ladle+axe); north-star com números
#### Concurrency tests
(none)
#### Acceptance Criteria
- componentes verdes; adoção honestamente diferida registrada
#### DoD
North-star registrado.

## Coverage Matrix
| Claim | Tasks |
|---|---|
| TagInput publicado | T1.0 |
| CommentThread publicado | T2.0 |
| Registry válido | T3.0 |
| Adoção (diferida) + north-star | T4.0 |
| Zero dep nova | T1.0, T3.0 |

**Coverage: 100% — todo claim mapeado (T1.0-T4.0).**

## Global Definition of Done
- [ ] `pnpm test:run && typecheck && lint && format:check && registry:validate` → 0
- [ ] `package.json` dependencies sem linha nova
- [ ] CHANGELOG `[Unreleased]`; `/review` READY_TO_MERGE antes do release
- [ ] Adoção diferida registrada honestamente (backend gated)

## Failure scenarios (when I/O external)
(none — componentes controlados; submit/persistência é do consumidor)

## Critical paths (para mutation testing, se rodar)
`tag-input.tsx` (dedup/add/remove) e `comment-thread.tsx` (submit vazio-guard).

## Final Phase: Integration Validation (MANDATORY)
1. Ladle: stories com fixtures (visual+axe). 2. build+registry. 3. Wiring triad (caller=stories, integração=testes, observabilidade=data-slot).
