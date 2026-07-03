# Changelog

## [Unreleased]

### Added
- GitHub Actions workflow (`deploy-registry.yml`) that publishes `registry/r/*.json` to GitHub
  Pages on every push to `main`, so the shadcn copy-paste path
  (`npx shadcn@latest add https://usetheodev.github.io/usetheo-ui/r/<name>.json`) resolves — the
  same URL `@theokit/ui`'s registry cross-references via `registryDependencies`.
- Initial `@usetheo/ui` package: 54 non-AI components (39 primitives + 15 composites)
  + the Violet Forge foundation (`cn`, `tailwind-preset`, themes, a11y/security libs),
  seeded from theo-ui @ `2b46eca` during the AI-exclusive pivot (milestone M-B). ESM-only,
  Apache-2.0. Not yet published — release ships at the end of the pivot roadmap.
