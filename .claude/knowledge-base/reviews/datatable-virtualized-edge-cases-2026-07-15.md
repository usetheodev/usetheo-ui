# Discover Edge Case Review — datatable-virtualized

Date: 2026-07-15
Plan analyzed: .claude/knowledge-base/discoveries/plans/datatable-virtualized-plan.md
Edge cases: 3 (MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 1)

## SHOULD TEST

### EC-1: exemplo oficial de table é acoplado ao @tanstack/react-table
- **Q2** — o `main.tsx` do exemplo usa react-table (headless) extensivamente; nosso DataTable NÃO usa.
- **Checkpoint:** extrair APENAS o markup/config do virtualizer (container, translateY/padding, sticky); ignorar columnDefs/flexRender.

### EC-2: makeData do exemplo usa faker (não-determinístico)
- **Q6** — fixture da nossa story de 10K precisa ser determinística (gerador por índice, sem random — regra da suíte).
- **Checkpoint:** desenhar `makeRows(10_000)` puro por índice.

## DOCUMENT

### EC-3: versão do clone vs dashboard
- Registrar a versão do clone honestamente e comparar com a `^3.13.26` do dashboard; divergência vira nota do ADR (não bloqueia).

**Verdict:** DISCOVERY PLAN OK (v1.0 → v1.1 absorvendo EC-1/EC-2)
