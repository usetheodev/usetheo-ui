# Follow-ups — breadcrumb-walking-skeleton (M0)

Oportunidades detectadas durante o halt-loop, explicitamente NÃO incluídas nos commits do plano (anti-scope-creep per `skills/implement/SKILL.md § invariants`).

1. **topnav.tsx — boilerplate forwardRef duplicado (Left/Center/Right/Root).** O quality hook
   (`check_quality.py`) flagra bloco de 4 linhas repetido 4× (pré-existente ao M0; disparou no edit
   docs-only do T2.3). Fix sugerido: extrair factory interna `sub()` como em
   `breadcrumb.tsx:35-58`. NÃO aplicado no M0 porque o plano trava o T2.3 em diff comment-only
   (AC: "git diff topnav.tsx contém apenas comentário"; invariant Baseline: API TopNav inalterada)
   e refactor oportunista é anti-pattern. Candidato: chore dedicado ou junto da migração
   TopNav.Breadcrumbs→Breadcrumb primitive (ADR D2 do plano).

2. **CVE dev-chain (vite 5.4.21 via vitest):** CVE-2026-53571 (HIGH, dev-only) + 2 moderates —
   bump vitest / override `vite>=6.4.3`. Registrado no deps-audit
   (`audits/breadcrumb-walking-skeleton-deps-audit-2026-07-14.md § Recommended next steps`).

3. **lucide-react 0.x → 1.x (MAJOR):** repo-wide, ADR D5 pinned. Sweep visual dedicado pós-M0.
