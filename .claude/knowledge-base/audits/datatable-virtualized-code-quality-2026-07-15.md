# Code Quality Audit: datatable-virtualized

**Date:** 2026-07-15
**Mode:** plan-bound
**Verdict:** PASS_WITH_CAVEATS
**Score cap:** 89
**Hard caps triggered:** symbol_fab_unverifiable_typescript

## Summary

- Languages audited: typescript
- Languages skipped: javascript
- Total findings: 1 (0 HARD, 0 SOFT_CAP, 1 SOFT_FLOOR, 0 INFO)

## Findings by detector

### D1 — Dead code
_No findings._

### D2 — Symbol fabrication
| File | Symbol | Severity | Message |
|---|---|---|---|
| `home/paulo/Projetos/usetheo/theokit-tools/usetheo-ui/src/test/setup.ts` | `import from '@testing-library/jest-dom/vitest'` | SOFT_FLOOR | Could not verify npm package '@testing-library/jest-dom/vitest' (ambiguous response) |

### D3 — Cross-package orphan exports
_No findings._

### D4 — Mutation testing
_No findings._

## Related

- Golden rule: [`.claude/rules/code-quality-golden-rule.md`](../../rules/code-quality-golden-rule.md)
- Allowlist: [`.claude/rules/code-quality-allowlist.txt`](../../rules/code-quality-allowlist.txt)
- Thresholds: [`.claude/rules/code-quality-thresholds.txt`](../../rules/code-quality-thresholds.txt)
