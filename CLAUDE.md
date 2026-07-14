# @usetheo/ui — Project Guide for Claude Code

> This project is built with the **Cycle 6+1 pipeline** (installed under `.claude/`).
> Every non-trivial change travels from idea → merge with **evidence, not assumptions**:
> hard gates, audit trails, and runtime hooks keep plans from being vague and stop code
> from shipping on assumptions. Read this before starting any non-trivial change.

## What this project is

**`@usetheo/ui`** — the **Violet Forge design system**: generic React components + primitives
that form the **non-AI foundation** of the Theo UI stack (Apache-2.0, ESM-only). 54 components
(39 primitives + 15 composites) plus the Violet Forge foundation (`cn`, tailwind-preset, themes).
Consumed by **`@theokit/ui`** (the AI-native layer on top). Seeded from `theo-ui` @ `2b46eca`.

- **Stack:** TypeScript (strict) · React (peer: `react`, `react-dom`) · pnpm · **biome** (lint/format) · **vitest** (test) · **tsup** (ESM build) · shadcn-style **registry** (`registry/*.json`).
- **Key scripts:** `typecheck`, `lint`, `format:check`, `test` / `test:run`, `build`, `registry:build`, `registry:validate`.

## The Cycle — how we work (the cadence)

A macro super-loop. **Enter at the lightest point that fits the work; never skip a cycle,
never advance past an `INVALID` verdict.** Every cycle writes a dated artifact under
`.claude/knowledge-base/`, so decisions and evidence are traceable after the fact.

```
[ROADMAP] → [DISCOVER] → PLAN → IMPLEMENT → CODE-QUALITY → REVIEW → RELEASE → (loop)
```

| # | Cycle | Entry command | Gate / verdict |
|---|---|---|---|
| — | **ROADMAP** (optional here) | this lib has no `ROADMAP.md` yet; run `/roadmap-init` if you want a milestone macro-loop, else drive PLAN directly | milestone `[ ]`→`[x]` on release |
| 1 | **DISCOVER** (optional) | `/discover-plan` — prior-art study when the approach is unknown | blueprint ≥ SHIPPABLE_WITH_CAVEATS |
| 2 | **PLAN** | `/grill-me` (if vague) → `/to-plan` → `/edge-case-plan` → `/deps-audit` → `/plan-confidence` | ≥ SHIPPABLE_WITH_CAVEATS (else back to `/to-plan`) |
| 3 | **IMPLEMENT** | `/implement {slug}` — halt-loop: RED → GREEN → REFACTOR → WIRING triad → COMMIT (TDD) | `IMPLEMENTATION_COMPLETE` |
| 4 | **CODE-QUALITY** | `/code-quality {slug}` — dead code + fabricated symbols + wiring gaps | PASS / PASS_WITH_CAVEATS (FAIL_HARD/INVALID block) |
| 5 | **REVIEW** | `/review {slug}` — 5–7 specialist agents in parallel | READY_TO_MERGE / NEEDS_FIXES |
| 6 | **RELEASE** | `/release` — semver bump + CHANGELOG + `develop→main` PR + tag | RELEASED |

**Shortcut:** `/auto-plan {slug}` chains PLAN→…→REVIEW for one topic. The cheapest cycle is the
one you don't run — for a one-line fix or a trivial prop tweak, just write the failing test and fix it.

**Typical flow for a new component / primitive here:** `/to-plan "add <Component>"` → `/implement`
→ `/code-quality` → `/review` → (when a batch is ready) `/release`. Keep the `registry/*.json`
entry and `registry:validate` green as part of the Definition of Done.

## Where things live

- **Kit** (skills / rules / hooks / commands / scripts): `.claude/`
- **Cycle contracts** (source of truth per cycle): `.claude/rules/cycle-*.md`
- **Artifacts:** `.claude/knowledge-base/` — `plans/`, `reviews/`, `audits/`, `grills/`, `releases/`
- **Operational guide:** `.claude/HOW-TO-USE.md`
- **Component source:** `src/` · **shadcn registry:** `registry/*.json` (keep in sync via `registry:build`)

## Unbreakable principles (enforced by hooks where automatable)

- Work on **`develop`**. `main` is release-only — never commit / merge / rebase / reset / cherry-pick on it (enforced by `.claude/hooks/validate-command.sh`); release lands via a `develop→main` PR.
- Never `git checkout` / `revert` / `push --force` / `reset --hard` — use `switch` / `restore --staged` / `stash` / `reset --soft`. See `.claude/rules/git-safety.md`.
- **TDD-first:** a failing test (vitest) before code; every bug fix starts with a regression test. See `.claude/rules/testing.md`.
- **CHANGELOG discipline:** every change under `## [Unreleased]` (Keep a Changelog).
- **Fail-fast error handling**, typed errors — see `.claude/rules/error-handling.md`.
- **95% confidence:** ask when unsure; never proceed on assumptions. `/grill-me` operationalizes this.
- Full principles: `/home/paulo/.claude/CLAUDE.md`.

## Stack conventions

- TypeScript strict; React function components; ESM-only; tests co-located (`*.test.ts(x)`) run by vitest.
- Lint/format via **biome** (`lint`, `format:check`) — keep clean before commit.
- `/code-quality` runs the **typescript + javascript** detectors (enabled in `.claude/rules/code-quality-languages.txt`); `knip` covers dead exports (add `ts-prune` for the full TS detector if desired).
- Every new/changed component keeps its `registry/*.json` entry valid (`registry:validate`).

## Next step

This is a mature library (v0.15.0, 54 components) — no greenfield bootstrap needed. Start the next
change with **`/to-plan "{feature or component}"`**, or **`/roadmap-init`** first if you want a
milestone-driven macro-loop for the roadmap ahead.
