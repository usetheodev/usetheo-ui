# Discover Edge Case Review — breadcrumb-walking-skeleton

Date: 2026-07-14
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/breadcrumb-walking-skeleton-plan.md
Research questions analyzed: 6 (+ seção Consumer requirements)
Edge cases found: 6 (MUST FIX: 2, SHOULD TEST: 2, DOCUMENT: 2)

## MUST FIX

### EC-1: Fonte canônica errada — radix-nova é variante temática, não o que o registry distribui
- **Affected question:** Q1, Q2 (parcial), Q4, Q5
- **Family:** Reference path
- **Scenario:** O plano (ADR D2) fixa `apps/v4/styles/radix-nova/ui/breadcrumb.tsx` como fonte canônica. Verificação objetiva (2026-07-14): o item que o registry do shadcn realmente distribui é `apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` (declarado em `apps/v4/registry/new-york-v4/ui/_registry.ts:71-76`), e `diff` confirma que os dois arquivos **diferem**.
- **Impact:** Blueprint citaria uma variante temática em vez do componente shipped — API/anatomia potencialmente divergente da que os consumidores do registry recebem.
- **Suggested fix:** Trocar a fonte canônica de Q1/Q4/Q5 (e exemplos correlatos de Q2 quando aplicável) para `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx` e atualizar ADR D2.

### EC-2: Q6 Fase A aponta para onde a entry não está
- **Affected question:** Q6
- **Family:** Method
- **Scenario:** O método manda grepar `apps/v4/registry/` "directory.json e afins"; verificação: `directory.json` NÃO contém breadcrumb; a entry vive em `apps/v4/registry/new-york-v4/ui/_registry.ts:71`.
- **Impact:** Fase A retornaria vazio no alvo declarado → questão BLOCKED desnecessariamente ou budget queimado em retries.
- **Suggested fix:** Método de Q6 = Read `.claude/knowledge-base/references/shadcn-ui/apps/v4/registry/new-york-v4/ui/_registry.ts` (bloco `name: "breadcrumb"`, linha ~71) + Read do nosso `registry/button.json`.

## SHOULD TEST

### EC-3: Teste do Mantine é majoritariamente harness de framework, não comportamento
- **Affected question:** Q4
- **Suggested halt-loop checkpoint:** "A resposta de Q4 deve listar ≥ 2 assertions de COMPORTAMENTO (ex.: contagem de separadores N-1, separador custom renderizado) extraídas fora do harness `tests.itSupportsSystemProps` do `@mantine-tests/core` — machinery de styles-API do Mantine não conta como comportamento transferível."

### EC-4: Exemplo ellipsis+dropdown compõe outros componentes — guarda anti scope-creep
- **Affected question:** Q2
- **Suggested halt-loop checkpoint:** "Ao ler `breadcrumb-dropdown.tsx`/`breadcrumb-ellipsis.tsx`, registrar a COMPOSIÇÃO como padrão (breadcrumb + DropdownMenu) sem abrir os fontes dos componentes compostos — DropdownMenu já existe na nossa lib."

## DOCUMENT

### EC-5: Formato de registry difere (TS module vs registry-item JSON)
- **Accepted risk:** shadcn v4 declara items em `_registry.ts` (módulo TS); nosso formato é `registry/*.json` (schema `registry-item.json`, modelo local `registry/button.json`). O draft do blueprint segue o NOSSO schema; a entry do shadcn é inspiração de campos (dependencies/registryDependencies/files), não formato. Sem mudança no plano além do método de Q6 (EC-2).

### EC-6: Drift cross-repo do consumidor (studio) entre discovery e implement
- **Accepted risk:** `shell.tsx`/`routes.tsx` do theokit-studio podem mudar entre a descoberta e a adoção (M0 DoD). Aceito: a fase de adoção re-lê os arquivos no momento do implement; a seção Consumer requirements do blueprint registra o estado com data.

## Summary

| Question | Edges found | MUST FIX | SHOULD TEST | DOCUMENT |
|----------|-------------|----------|-------------|----------|
| Q1 | 1 | 1 (EC-1) | 0 | 0 |
| Q2 | 2 | 1 (EC-1 parcial) | 1 (EC-4) | 0 |
| Q3 | 0 | 0 | 0 | 0 |
| Q4 | 2 | 1 (EC-1 parcial) | 1 (EC-3) | 0 |
| Q5 | 1 | 1 (EC-1 parcial) | 0 | 0 |
| Q6 | 2 | 1 (EC-2) | 0 | 1 (EC-5) |
| Consumer req. | 1 | 0 | 0 | 1 (EC-6) |

**Verdict:** DISCOVERY PLAN NEEDS ADJUSTMENT (2 MUST FIX — correções de path pontuais, sem mudança de escopo)
