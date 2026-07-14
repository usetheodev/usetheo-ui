# Edge Case Review — breadcrumb-walking-skeleton (implementation plan)

Date: 2026-07-14
Plan analyzed: .claude/knowledge-base/plans/breadcrumb-walking-skeleton-plan.md (v1.0)
Tasks analyzed: 5 (T1.1, T1.2, T2.1, T2.2, T2.3) + T3.1 cross-repo
Cases found: 6 (EDGE: 3, NEGATIVE: 3 | MUST FIX: 0, SHOULD TEST: 3, DOCUMENT: 3)

## MUST FIX

(none — a fronteira de segurança já está coberta pelo negative test `link_blocks_javascript_href` com `safeHref` em `src/lib/safe-href.ts:34-42`, e o componente é stateless/sem I/O.)

## SHOULD TEST

### EC-1: Lista vazia renderiza `ol` válido sem crash
- **Affected task:** T1.1
- **Kind:** EDGE (empty-but-valid)
- **Suggested test:** `empty_list_renders_valid_ol` — `<Breadcrumb><Breadcrumb.List/></Breadcrumb>` renderiza `nav>ol` vazio, zero separadores, axe sem violations. (O plano menciona o caso em Deep Dives mas não o lista no TDD.)

### EC-2: `href` null/undefined/vazio no Link nativo
- **Affected task:** T1.1
- **Kind:** NEGATIVE (input inválido na fronteira)
- **Suggested test:** `link_without_valid_href_renders_without_href_attr` — `href={undefined}` e `href=""` → âncora sem atributo `href` (comportamento tipado de `safeHref`: retorna `undefined` para null/undefined/empty — `safe-href.ts:35-37`), sem crash. Asserta o comportamento específico, não só "não quebra".

### EC-3: Studio na rota raiz (zero labels de handle)
- **Affected task:** T3.1
- **Kind:** EDGE (mínimo válido do consumidor)
- **Suggested test:** (suite do studio) `breadcrumb_shows_only_root_on_bare_route` — rota sem `handle.label` → só o item "Studio" renderiza, sem separador, sem aria-current órfão.

## DOCUMENT

### EC-4: `asChild` com múltiplos filhos lança (React.Children.only)
- **Kind:** NEGATIVE (erro de uso do consumidor)
- **Accepted risk:** comportamento padrão do Radix Slot em toda a lib (Button idem). Erro explícito e imediato em dev — fail-fast correto. Não adicionar guard custom (KISS; consistência com os demais primitives).

### EC-5: Labels longos — overflow controlado por CSS
- **Kind:** EDGE (extremo válido visual)
- **Accepted risk:** paridade com shadcn (`flex-wrap` + `break-words` na List — blueprint Q1). Não unit-testável de forma significativa; coberto visualmente pela story. Nota: manter as classes de wrap na implementação.

### EC-6: Consumidor marca dois `Breadcrumb.Page` na mesma lista
- **Kind:** NEGATIVE (uso semanticamente inválido)
- **Accepted risk:** responsabilidade do consumidor (mesmo contrato do shadcn/WAI-ARIA); a story e o JSDoc mostram o uso correto (um Page, último item). Guard em runtime custaria mais que o dano (KISS).

## Summary

| Task | EDGE | NEGATIVE | MUST FIX | SHOULD TEST | DOCUMENT |
|------|------|----------|----------|-------------|----------|
| T1.1 | 2 | 2 | 0 | 2 | 2 |
| T1.2 | 0 | 0 | 0 | 0 | 0 |
| T2.1 | 0 | 0 | 0 | 0 | 0 (colisão de nomes verificada — nenhum export `Breadcrumb*` existente; typecheck no DoD cobre) |
| T2.2 | 0 | 0 | 0 | 0 | 0 (RED do task já cobre o negative descriptor-ausente via `registry:validate`) |
| T2.3 | 0 | 0 | 0 | 0 | 0 (docs-only) |
| T3.1 | 1 | 0 | 0 | 1 | 0 |

**Coverage check:** T1.1 (única fronteira de input real) tem ≥1 EDGE e ≥1 NEGATIVE no plano original + 2 adicionados aqui. T2.x são fronteiras de toolchain cobertas por validate/typecheck. ✅

**Verdict:** PLAN OK (0 MUST FIX; absorver os 3 SHOULD TEST no TDD dos tasks afetados)
