# Discover Edge Case Review — stepper-promotion

Date: 2026-07-15
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/stepper-promotion-plan.md
Research questions analyzed: 6
Edge cases found: 4 (MUST FIX: 0, SHOULD TEST: 3, DOCUMENT: 1)

## MUST FIX

(nenhum — todos os paths citados verificados em disco em 2026-07-15; budget e stop conditions declarados; 4/4 corners cobertos)

## SHOULD TEST

### EC-1: tracker.spec.ts do tremor é Playwright e2e, não unit test
- **Affected question:** Q4
- **Verificado:** `tremor/src/components/Tracker/tracker.spec.ts:1` — `import { expect, test } from "@playwright/test"`; asserts navegam Storybook em `localhost:6006` (zero `it(`, só `test(`).
- **Suggested halt-loop checkpoint:** ao executar Q4, ler o spec do tremor como INVENTÁRIO de comportamento (render, bar, tooltip) — não como shape de assertion transferível; o shape unit/RTL vem do Mantine + dos nossos padrões M0-M3.

### EC-2: Mantine StepperStep NÃO tem estado error/failed nativo
- **Affected question:** Q2
- **Verificado:** `grep -rn "error\|failed" mantine/.../StepperStep/StepperStep.tsx` → vazio (2026-07-15).
- **Suggested halt-loop checkpoint:** Q2 deve registrar a AUSÊNCIA honestamente (com o grep citado como evidência negativa — Rule 3); o design do estado failed vem do consumidor real (`build-step-card.tsx`: ícone X + `aria-label` com classe do erro), não do SOTA.

### EC-3: cobertura do Stepper.test.tsx é majoritariamente harness genérico
- **Affected question:** Q4
- **Verificado:** `Stepper.test.tsx:28` usa `tests.itSupportsSystemProps` (`@mantine-tests/core`); apenas 6 `it(` de comportamento próprio (onStepClick, active content, seleção bidirecional/allowNextStepsSelect).
- **Suggested halt-loop checkpoint:** extrair somente os 6 its de comportamento; não contar o harness como "cobertura SOTA" na comparison table.

## DOCUMENT

### EC-4: Stepper.module.css usa vocabulário CSS-modules que não se transfere
- **Accepted risk:** Q2 lê o `.module.css` apenas para extrair os SELETORES de orientação (`[data-orientation]`-style data-attributes), nunca valores de estilo — nosso composite usa tailwind-preset + data-slot. Já coberto pelo ADR D2 (blueprint de design, não fonte de código); risco aceito sem mudança de método.

## Summary

| Question | Edges found | MUST FIX | SHOULD TEST | DOCUMENT |
|----------|-------------|----------|-------------|----------|
| Q1 | 0 | 0 | 0 | 0 |
| Q2 | 2 | 0 | 1 | 1 |
| Q3 | 0 | 0 | 0 | 0 |
| Q4 | 2 | 0 | 2 | 0 |
| Q5 | 0 | 0 | 0 | 0 |
| Q6 | 0 | 0 | 0 | 0 |

**Verdict:** DISCOVERY PLAN OK (v1.0 → v1.1 absorvendo os 3 SHOULD TEST como halt-loop checkpoints)
