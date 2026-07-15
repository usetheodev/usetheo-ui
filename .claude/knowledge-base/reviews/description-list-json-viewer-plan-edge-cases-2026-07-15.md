# Edge Case Review — description-list-json-viewer (implementation plan)

Date: 2026-07-15
Plan analyzed: .claude/knowledge-base/plans/description-list-json-viewer-plan.md (v1.0)
Tasks analyzed: 7
Cases found: 5 (EDGE: 3, NEGATIVE: 2 | MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 3)

## MUST FIX

(none — os edges estruturais do blueprint já estão no TDD: circular render+copy [negative], delimiter collision, {}/[], root primitivo, multiple dd, dl vazio)

## SHOULD TEST

### EC-1: Date e objetos com toJSON
- **Affected task:** T2.1 · **Kind:** EDGE
- **Suggested test:** `test_date_renders_as_iso_string()` — `new Date(0)` renderiza como string (via toJSON no safeStringify) OU literal de objeto; pinar o escolhido (determinismo: usar Date fixa).

### EC-2: Chave vazia e chave duplicada no mesmo objeto
- **Affected task:** T2.1 · **Kind:** EDGE
- **Suggested test:** `test_empty_string_key_renders()` — `{"": 1}` renderiza sem crash e o path não colide com o root.

## DOCUMENT

### EC-3: NaN/Infinity — `JSON.stringify` vira null no copy
- **Kind:** NEGATIVE · **Accepted risk:** render mostra `NaN`/`Infinity` literais; copy segue semântica JSON (null) — comportamento da plataforma, documentado no JSDoc.

### EC-4: dd sem dt precedente (composição inválida do consumidor)
- **Kind:** NEGATIVE · **Accepted risk:** axe/validador HTML acusam; responsabilidade do consumidor (JSDoc mostra composição correta) — mesmo contrato do Breadcrumb.Page (M0 EC-6).

### EC-5: `display: contents` (Item no layout horizontal) e a11y
- **Kind:** EDGE · **Accepted risk:** browsers modernos tratam corretamente para dl (bug antigo do Safari <15 fora do suporte); teste axe no layout horizontal pina.

**Verdict:** PLAN OK (0 MUST FIX; absorver os 2 SHOULD TEST no TDD do T2.1)
