# Discover Edge Case Review — slider-combobox-playground

Date: 2026-07-14
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/slider-combobox-playground-plan.md (v1.0)
Research questions analyzed: 7 (+ Consumer requirements)
Edge cases found: 5 (MUST FIX: 1, SHOULD TEST: 2, DOCUMENT: 2)

## MUST FIX

### EC-1: Q2 assume que existe receita cmdk no shadcn v4 — não existe mais
- **Affected question:** Q2
- **Family:** Reference path / Interpretation
- **Scenario:** Verificação objetiva (2026-07-14): TODOS os combobox do shadcn v4 (shipped `registry/new-york-v4/ui/combobox.tsx:4` E o style `styles/radix-nova/ui/combobox.tsx:4`) usam `@base-ui/react`; os exemplos `examples/radix/combobox-*.tsx` importam o style base-ui-based. Não há mais receita cmdk+Popover no repo do shadcn.
- **Impact:** A Fase B de Q2 procuraria um "equivalente cmdk" que não existe como código no shadcn — risco de fabricação por analogia.
- **Suggested fix:** Reescrever o método de Q2: (a) extrair só o SHAPE da API do shipped base-ui-based (subs/estados); (b) a receita cmdk vem do prior art INTERNO (`command-palette.tsx` + `select.tsx` popup) — Q3 vira a fonte primária do COMO, Q2 do QUÊ. Sem procurar receita cmdk no shadcn.

## SHOULD TEST

### EC-2: Capacidades do cmdk exigidas pelo Combobox precisam ser provadas, não assumidas
- **Affected question:** Q2/Q3
- **Suggested halt-loop checkpoint:** "Antes de fechar Q3, confirmar no fonte local (`command-palette.tsx`) ou no cmdk instalado: (1) `Command.Input` funciona dentro de Popover com foco gerenciado; (2) filtro custom/async via `shouldFilter=false` + value/onValueChange; (3) empty state via `Command.Empty`. Cada capacidade citada com `file:line` do nosso código ou do pacote cmdk em node_modules."

### EC-3: Q4 — testes do Mantine Slider são drag/mouse-heavy (jsdom não cobre)
- **Affected question:** Q4
- **Suggested halt-loop checkpoint:** "Extrair de Mantine/base-ui APENAS assertions reproduzíveis em jsdom (keyboard arrows/home/end, aria-value*, min/max clamp); interações de drag/pointer marcadas como fora do escopo unit (story manual) — não prometer teste de drag no blueprint."

## DOCUMENT

### EC-4: Divergência deliberada do SOTA atual (cmdk vs base-ui)
- **Accepted risk:** shadcn v4 migrou combobox para @base-ui/react; nós ficamos em cmdk (DoD do M1: zero dep nova; cmdk provado no CommandPalette). Registrar ADR no blueprint com trigger de reavaliação (se cmdk estagnar OU um M futuro precisar de multiselect/chips, reabrir decisão base-ui).

### EC-5: `@radix-ui/react-slider` versão via rede
- **Accepted risk:** Q6 usa `npm view` (rede). Fallback documentado: versão usada pelo shadcn (package.json do monorepo clonado) + CVE check fica para o `/deps-audit` do cycle-plan (que roda scanners de verdade).

## Summary

| Question | Edges found | MUST FIX | SHOULD TEST | DOCUMENT |
|----------|-------------|----------|-------------|----------|
| Q1 | 0 | 0 | 0 | 0 |
| Q2 | 2 | 1 (EC-1) | 1 (EC-2) | 1 (EC-4) |
| Q3 | 1 | 0 | 1 (EC-2) | 0 |
| Q4 | 1 | 0 | 1 (EC-3) | 0 |
| Q5 | 0 | 0 | 0 | 0 |
| Q6 | 1 | 0 | 0 | 1 (EC-5) |
| Q7 | 0 | 0 | 0 | 0 |

**Verdict:** DISCOVERY PLAN NEEDS ADJUSTMENT (1 MUST FIX — correção de método/fonte de Q2, sem mudança de escopo)
