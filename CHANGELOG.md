# Changelog

All notable changes to `@usetheo/ui` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> This file starts at 0.35.1. Everything published before it shipped without a changelog, and the
> history is not reconstructed here — inventing entries after the fact would be worse than an
> honest gap. `git log` remains the record for anything earlier.

## [Unreleased]

### Changed

- **Test runs no longer claim every core on the host.** `vitest.config.ts` capped nothing, so the
  default applied — `os.availableParallelism()`, one fork per core, each booting a full test
  environment. On a 12-thread machine a single `vitest run` therefore took the whole box, and
  anything else running alongside it (a second suite, a typecheck, the desktop) competed for what
  was left. The cap now leaves 4 cores free (`Math.max(2, cpus().length - 4)`), scaling with the
  runner instead of hard-coding one machine's core count. It costs no wall-clock — measured in
  `theokit-ui`, the full suite ran 73.96s at 4 workers against 74.36s at 12.
  (usetheokit/theokit-ui#51)
