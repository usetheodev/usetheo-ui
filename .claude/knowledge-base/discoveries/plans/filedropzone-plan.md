# Discovery Plan: FileDropzone — upload drag-drop dependency-free (M5)

> **Version 1.1** (2026-07-15 — absorve EC-1/EC-2 como checkpoints; EC-3 documentado) — Estudar o react-dropzone clonado (774 LoC src + 305 utils + 112 testes, produção massiva) para decidir via ADR o dep-vs-own (risco #1 do ROADMAP § M5) e, no caminho own (DoD: dependency-free, HTML5 DnD nativo), extrair o mapa de edge cases que a referência acumulou: contagem de dragenter/dragleave, modelo de validação com erros tipados, contrato a11y de teclado e fixtures de teste de DnD.

**Slug:** `filedropzone`
**Owner:** Paulo + Claude
**Created:** 2026-07-15
**Time budget:** 2.5h (ADR D1)

## Context

ROADMAP § M5 (deps: M0 ✅). Pré-staging durante o gate do PR #5 (M4/0.20.0) — artefatos `.claude/` apenas, não commitados até o merge (ADR D4 da família). Alvo do DoD: `FileDropzone` primitive com drag-drop + file picker, validação (tipo/tamanho/quantidade) com erros tipados, estados idle/drag-over/rejected, teclado acessível, dependency-free; story de composição com `Progress` existente. Caso real: ingestão de documentos do theo-rag (pdf, docx, csv, imagens). Não existe dropzone/upload em nenhum componente local (verificado); `Progress` existe (`src/components/primitives/progress/`).

Regras consumidas: `rules/testing.md § 4.1` (negatives = o coração deste componente: rejeições tipadas), `rules/parsimony-ladder.md` rung 4 (dep já instalada? não — react-dropzone NÃO está instalada; a decisão dep-vs-own é o ADR central), `rules/error-handling.md § 2` (erros tipados, validação na fronteira).

## Objective

Blueprint que fixe: decisão dep-vs-own com evidência (superfície necessária vs 1079 LoC + 2 deps transitivas da referência), mecânica correta de dragenter/dragleave (o bug clássico de DnD), modelo de validação e shape dos erros tipados, contrato a11y de teclado, shape de testes com fixtures DataTransfer e a fronteira upload-vs-seleção (upload é do consumidor).

- [ ] All research questions answered with citations
- [ ] Cross-cutting comparison table populated (react-dropzone × HTML5 nativo × nosso recorte)
- [ ] ADR dep-vs-own com alternativas e evidência
- [ ] `/discover-confidence` ≥ SHIPPABLE_WITH_CAVEATS

## In-Scope / Out-of-Scope

### In-Scope (per reference project)

| Project | In-scope subdirectories | Reason |
|---|---|---|
| `.claude/knowledge-base/references/react-dropzone/` | `src/index.tsx`, `src/utils/index.ts`, `src/index.spec.tsx`, `package.json` | A referência canônica do padrão (catálogo: supports M5); risco #1 exige estudo antes do ADR |
| (interno) | `src/components/primitives/progress/`, `src/components/primitives/form-field/` (padrão de erro), `src/lib/` (a11y utils) | Composição do DoD b2 + convenções locais de erro |
| (consumidor externo — ADR D3 da família) | theo-rag: tipos aceitos pela ingestão (`packages/core/src/domain/loaders/`) | Fixar o `accept` do caso real (pdf, docx, csv, imagens) |

### Out-of-Scope (explicit)

| Project / Subdir | Why excluded |
|---|---|
| `react-dropzone/docs/`, `public/`, `examples` | Site/demos |
| Upload em si (XHR/fetch/progresso de rede) | Fronteira do componente: seleção+validação; upload é do consumidor (Progress composto via story) |
| `react-dropzone` como dependência ANTES do estudo | A decisão é o ADR — não pré-julgar (mas o DoD do roadmap já aponta dependency-free; o estudo pode derrubar ou confirmar) |
| Paste-to-upload, directory upload (webkitdirectory) | Fora do DoD do M5; anotar como fronteira se a referência cobrir |
| `.claude/knowledge-base/references/{tanstack-virtual,data-table-filters,...}/` | Suportam M6+ |

## ADRs

### D1 — Time budget + stop conditions

**Decision:** react-dropzone src 1.25h; spec 0.5h; interno+theo-rag 0.5h; síntese 0.25h. Total 2.5h.

**Rationale:** `index.tsx` (774 LoC) concentra a mecânica DnD+a11y — maior fatia; utils (305) é validação — lida junto da Q2. Alternativas: ler o spec primeiro (rejeitada — sem o mapa da implementação os 112 testes não se organizam), pular utils (rejeitada — é exatamente o que reimplementaríamos).

**Stop condition — per question (mandatory):** Fase A vazia após 3 variantes de grep → BLOCKED; próxima questão. Nunca preencher com hotspots alheios.

**Stop condition — per project (mandatory):** budget exaurido → restantes BLOCKED; todos exauridos → `<promise>BLUEPRINT_BLOCKED</promise>` — nunca COMPLETE parcial.

**Anti-pattern:** fabricar Fase B (Unbreakable Rule 3).

### D2 — Referência é blueprint de DESIGN; a decisão dep-vs-own é POSTERIOR ao estudo

**Decision:** estudar mecânica/validação/a11y/testes; a decisão dep-vs-own vira ADR do blueprint COM a evidência do estudo (superfície necessária × custo da dep × custo do porte).

**Rationale:** risco #1 do ROADMAP nomeia exatamente este ADR; decidir antes do estudo seria o anti-pattern que o risco descreve. MIT permite porte de trechos, mas o alvo usa nossos tokens/convenções.

**Alternatives considered:** adotar a dep sem estudo (rejeitada — 2 deps transitivas + API de hook não combina com primitive de registry copy-pasteable); implementar do zero sem estudo (rejeitada — Rule 9: reimplementar MAL o resolvido).

### D3 — Consumidores externos lidos, não citados como referência

**Decision:** theo-rag via path absoluto em "Consumer requirements" (ADR D3 da família M0-M4).

## Research Questions

| # | Question | Corner | Reference project(s) | Fase A (broad — map) | Fase B (deep — Read) | Expected answer shape |
|---|---|---|---|---|---|---|
| Q1 | Como o react-dropzone resolve a mecânica de drag (dragenter/dragleave aninhados, `isDragActive`, dragover preventDefault, drop) e o file picker (input file escondido + click programático)? | techniques | `.claude/knowledge-base/references/react-dropzone/` | Grep `onDragEnter\|dragTargets\|isDragActive\|onDrop` em `src/index.tsx` | Read dos blocos relevantes de `src/index.tsx` | Mecânica mínima transferível (incl. a solução do bug clássico de dragleave em filhos) |
| Q2 | Qual o modelo de validação (accept/minSize/maxSize/maxFiles/validator) e o SHAPE dos erros tipados (`ErrorCode`, `FileRejection {file, errors[]}`), incl. o que `attr-accept` faz? | techniques | `.claude/knowledge-base/references/react-dropzone/` | Grep `ErrorCode\|getInvalidTypeRejectionErr\|fileAccepted\|fileMatchSize` em `src/utils/index.ts` | Read `src/utils/index.ts` integral | Shape de rejeição tipada a portar (error-handling.md § 2) + recorte do accept matching |
| Q3 | Qual o contrato a11y de teclado (role, tabIndex, Enter/Space → picker, focus ring, aria-*) e o que os atributos do root/input expõem? | techniques | `.claude/knowledge-base/references/react-dropzone/` | Grep `onKeyDown\|tabIndex\|role\|aria-` em `src/index.tsx` | Read dos getRootProps/getInputProps | Contrato a11y transferível para o nosso primitive |
| Q4 | Que comportamentos os 112 testes pinam e COMO simulam DnD (fixtures DataTransfer, createEvent) — o que transferir para o nosso shape (edge + negative por rejeição)? | tests | `.claude/knowledge-base/references/react-dropzone/` | Grep `function createDtWithFiles\|fireDrop\|describe(` em `src/index.spec.tsx` | Read seletivo dos describes de validação/drag/keyboard | Fixtures de teste DnD reutilizáveis + lista comportamento→assertion |
| Q5 | Deps: o que `attr-accept` e `file-selector` fazem exatamente e qual a superfície mínima que o NOSSO caso exige (sem directory traversal? só dataTransfer.files?) — evidência para o ADR dep-vs-own | deps | `.claude/knowledge-base/references/react-dropzone/` | Read `package.json` deps; Grep `fromEvent\|file-selector\|attr-accept` em `src/` | Mapear cada dep → o que usamos → custo de reimplementação mínima | Tabela dep → papel → superfície nossa → veredito (alimenta o ADR central) |
| Q6 | Tools: registry/stories — como compor com `Progress` local (story de upload em andamento) e que estados as stories devem demonstrar (idle/drag-over/rejected/disabled)? | tools | (interno) + `.claude/knowledge-base/references/react-dropzone/` | Grep `interface ProgressProps` no nosso `src/components/primitives/progress/progress.tsx`; stories da referência se existirem em `src/` | Draft de stories + descriptor registry (modelo `registry/stepper.json` M4) | Lista de stories + draft do descriptor |

**Consumer requirements (per D3, fora do budget):** Read `/home/paulo/Projetos/usetheo/theo-data/theo-rag/packages/core/src/domain/loaders/` (listagem + 1-2 loaders) → tipos MIME/extensões reais aceitos pela ingestão (pdf, docx, csv, imagens) → fixture do `accept` na story.

## Coverage Matrix

| Corner | Questions mapped | Status |
|---|---|---|
| Integration tests | Q4 | Covered |
| Dependencies | Q5 | Covered |
| Tools | Q6 | Covered |
| Techniques | Q1, Q2, Q3 | Covered |

**Coverage: 4/4 corners covered (100%)**

## Halt-loop checkpoints (para /discover-execute)

- Q1 antes de Q4 (os testes se leem com a mecânica mapeada); Q5 depende de Q2 (attr-accept aparece na validação).
- Uma questão só é `done` com ≥ 1 citação `path:linha` verificada por Read na mesma iteração.
- Consumer requirements lidos ANTES do ADR dep-vs-own (a superfície necessária vem do caso real).
- **EC-1:** `index.spec.tsx` (3609 linhas) lido SELETIVAMENTE — só os describes onDrag* (l.1989), onDrop (l.2398), onKeyDown (l.1809) + fixtures do topo; demais viram inventário por nome.
- **EC-2:** Q2 cruza `utils/index.ts` com `utils/index.spec.ts` (41 tests — pinam o shape de rejeição; fonte mais barata que o spec gigante).
- **EC-3:** `document drop protection` é comportamento global do hook — fronteira do consumidor; anotar no blueprint sem expandir escopo.
- O ADR dep-vs-own do blueprint DEVE citar números (LoC da referência, deps transitivas, superfície nossa estimada) — não vibes.

## Acceptance Criteria

- [ ] 6/6 questões `done` (ou `blocked` com razão honesta)
- [ ] Todas as citações de referência do blueprint resolvem em disco (`check_reference_citations.py` PASS)
- [ ] 4 coverage corners populados (`check_research_coverage.py` PASS)
- [ ] ≥ 1 ADR (dep-vs-own é o central) com alternativas e evidência numérica
- [ ] Comparison table react-dropzone × HTML5 nativo × nosso recorte
- [ ] `/discover-confidence filedropzone` ≥ SHIPPABLE_WITH_CAVEATS (89)

## Global Definition of Done

Blueprint em `.claude/knowledge-base/discoveries/blueprints/filedropzone-blueprint.md` com verdict ≥ `SHIPPABLE_WITH_CAVEATS`. Alimenta o `/to-plan` do M5 — que só dispara após o merge do PR #5.
