# ADR 0001-m5 — FileDropzone: split validate.ts + 2 estados + supressão a11y inline

**Date:** 2026-07-15 · **Status:** Accepted · **Supersedes:** plan filedropzone ADR D1 (parcial), ADR D2 (letra)

## Context

O plano `filedropzone` v1.1 decidiu (D1) helpers no MESMO módulo do componente, rejeitando `validate.ts` separado, com rationale "~350 LoC ≤ 500". O hook de qualidade do repo (`.claude/hooks/smell_types.py:29`, `MAX_FILE_LINES = 300`) tornou a decisão mecanicamente inimplementável — o plano orçou contra o budget errado (500 do DoD, não os 300 do hook).

## Decision

1. **Split:** `validate.ts` (núcleo puro de validação, zero imports) + `file-dropzone.tsx` (orquestração de eventos) com fachada de re-export — superfície pública única preservada (identidade pinada por teste de barrel). Registry descriptor com 2 files (precedente `registry/toast.json`); import reescrito no build verificado não-stale.
2. **Estados:** D2 dizia "1 useState"; o próprio plano (D3 região de rejeições + RED test_drop_rejected) exige armazenar rejeições — D2 emendado para "refs + 2 states (visual de drag + rejeições da região D3)".
3. **Supressão a11y:** `useSemanticElements` suprimida INLINE no atributo `role="button"` (convenção do repo — precedente `topnav.tsx:200`), com justificativa nomeada; o override por arquivo em biome.json (tentativa inicial) foi removido na review.

## Alternatives considered

- Voltar ao arquivo único com isenção do hook (rejeitada — o split é superior em SRP: núcleo de validação e orquestração de eventos mudam por razões diferentes).
- Manter override no biome.json (rejeitada — suprime a regra para o arquivo inteiro e diverge da convenção inline estabelecida).

## Consequences

- Findings F-arch-1/F-xval-1 (HIGH/MEDIUM da review) resolvidos: o desvio agora tem registro canônico.
- Feedback para o template do /to-plan: Baseline Context deve citar o piso de 300 linhas do hook, não só o budget de 500 do DoD (registrado como followup do kit #10).
