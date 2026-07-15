# Edge Case Review — stepper-promotion (plan)

Date: 2026-07-15
Plan analyzed: .claude/knowledge-base/plans/stepper-promotion-plan.md (v1.0)
Tasks analyzed: 5 (T1.1, T1.2, T2.1, T2.2, T2.3)
Cases found: 6 (EDGE: 3, NEGATIVE: 3 | MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 3, INCONSISTENCY: 1)

## MUST FIX

(nenhum — sem crash/perda de dados/segurança; componente stateless sem I/O)

## SHOULD TEST

### EC-1: status desconhecido em runtime (consumidor JS sem TS)
- **Affected task:** T1.1
- **Kind:** NEGATIVE (invalid input past the boundary)
- **Scenario:** consumidor JS passa `status: "running"` (vocabulário do dashboard, não o nosso) — lookup de ícone retorna `undefined`, step renderiza sem ícone e `data-state` carrega valor arbitrário.
- **Impact:** degradação silenciosa (sem crash), mas o blueprint § Corner 1 prometeu "estado inválido em runtime não quebra derivação" e o TDD do plan v1.0 não pina isso.
- **Suggested test:** `test_unknown_status_falls_back_to_pending_visual()` — status fora do union → ícone pending (CircleDashed) renderizado, sem throw. Fix ≤3 linhas: fallback no map de ícones.

### EC-2: múltiplos steps com `status: "active"` simultâneos
- **Affected task:** T1.1
- **Kind:** EDGE (extremo de entrada válida pelo tipo)
- **Scenario:** API de estado explícito não impede dois `active`; `aria-current="step"` sairia em ambos.
- **Impact:** leitor de tela anuncia duas etapas correntes — contrato a11y ambíguo.
- **Suggested test:** `test_multiple_active_steps_each_get_aria_current()` — pina o comportamento render-as-is (componente controlado não policia; contrato "no máximo um active" vai para o JSDoc). ≤1 sentença de mudança no plan.

## DOCUMENT

### EC-3: ids duplicados em `steps`
- **Kind:** NEGATIVE
- **Accepted risk:** `key={id}` duplicado gera warning do React em dev — sinal suficiente; policiar unicidade em runtime é complexidade maior que o dano (KISS). Contrato "ids únicos" no JSDoc.

### EC-4: `label` vazio (`""`)
- **Kind:** NEGATIVE
- **Accepted risk:** `aria-label=""` enfraquece a11y mas não é violação axe automática; o tipo exige a prop (presença garantida). Paridade com os demais composites (nenhum valida string vazia). JSDoc recomenda label descritivo.

### EC-5: orientação horizontal com muitas etapas (overflow)
- **Kind:** EDGE
- **Accepted risk:** layout de overflow é preocupação do consumidor (paridade com Mantine `wrap`); nosso default vertical cobre os dois casos reais. `flex-wrap` na horizontal como comportamento default documentado na story.

## INCONSISTENCY (fix documental no v1.1)

### EC-6: contagem de testes do T1.1
- O TDD do T1.1 lista 20 REDs mas o AC pede "21 passed". Com EC-1/EC-2 absorvidos: 22 REDs, AC 22; totais downstream: T1.2 → 23, T2.1 barrel → 24.

## Summary

| Task | EDGE | NEGATIVE | MUST FIX | SHOULD TEST | DOCUMENT |
|------|------|----------|----------|-------------|----------|
| T1.1 | 2 | 3 | 0 | 2 | 2 |
| T1.2 | 1 | 0 | 0 | 0 | 1 |
| T2.1-T2.3 | 0 | 0 | 0 | 0 | 0 |

**Coverage check:** T1.1 (única task com boundary de entrada) tem ambas as lentes cobertas no plan v1.0 (edges: 1 etapa/todas done/clamp; negatives: steps vazio/não-botão) + 2 novas via este review. T2.x são tasks documentais/aditivas sem boundary de entrada.

**Verdict:** PLAN NEEDS ADJUSTMENT (menor — absorver EC-1/EC-2 no TDD do T1.1 e corrigir EC-6; nenhum MUST FIX)
