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

4. **Kit: consolidate_findings.py descarta YAMLs com parse error silenciosamente** (3/5 no review do M0)
   e emite relatório zerado — exatamente o meta-defeito que o cycle-judge-codex descreve. Fix: falhar
   loudly em parse error + template de agente exigindo strings quoted. (review 2026-07-14, nota de processo)
5. **Kit: check_wiring.py** — suporte a testes co-localizados (sem tests/integration/) e exclusão de
   .claude/knowledge-base/references/ na contagem de callers (F-wire-1).
6. **Kit: flip_milestone_checkbox.py grava audit em `knowledge-base/` (raiz) em vez de
   `.claude/knowledge-base/`** — duplicou o run-file do M0 (movido para o layout canônico como
   M0-2026-07-14-flip-audit.md). Fix: honrar layout .claude/.
7. **Kit: check_acceptance_criteria.py aplica o budget de 500 linhas a lockfiles/gerados**
   (pnpm-lock.yaml 7398 linhas → FAIL no M1). Fix: excluir lockfiles (pnpm-lock.yaml,
   package-lock.json), dist/ e registry/r/ do gate de file-size (o budget do architecture.md
   é para módulos-fonte). (validação M1, 2026-07-14)
8. **Lib: tsup stripa "use client" do bundle de TODOS os componentes stateful** (pré-existente,
   pego pelo review M2) — consumidores RSC via pacote npm precisam da diretiva; avaliar
   `banner`/`esbuild` option para preservar. (review M2, F-dom-1 nota honesta)
9. **Kit: diff_symbols.py derivava exports de *.stories.tsx/*.test.tsx como símbolos de produção**
   (pillar a cobrava caller para stories Ladle — falso HIGH no mini-review M3). Fix aplicado:
   parser agora rastreia o arquivo corrente nos headers +++ e pula stories/tests. (M3, 2026-07-15)
