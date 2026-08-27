---
"@usetheo/ui": patch
---

The public CSS assets are published again: `styles.css`, `styles-v3-legacy.css`, `components.css`,
`tokens.css`, `tokens-v4.css`, `preset.css`, `fonts.css`, `fonts-cdn.css`, and the self-hosted Geist
woff2 files.

The seed that created this repository brought `src/styles/tailwind-preset.ts` across but not the CSS
pipeline around it, so from 0.14.0 the tarball contained zero `.css` files while consumers kept
importing `@usetheo/ui/preset.css`, `/components.css` and `/fonts-cdn.css`. A clean `vite build`
against those versions fails to resolve them; the deployed dashboard only kept working because it had
been built back in the 0.13.x era.

`components.css` is COMPILED rather than restored — the Tailwind v4 CLI runs against
`src/styles/components-entry.css`, which scans this repo's own `src/`, so the shipped utility rules
match the classes the components reference today. The static stylesheets come from `@usetheo/ui@0.13.2`,
the last release that published them; every token the current preset references is declared there.

The library pre-compiles those utilities instead of leaving them to the consumer's Tailwind because
`@source` globs do not follow symlinks — under pnpm the consumer-side pattern expands to zero files and
every hover/focus/data-state variant goes unemitted.

`./preset` still resolves to the JS preset, which is what it has meant since the seed. The CSS preset
gets its own explicit `./preset.css` rather than reclaiming that key (usetheodev/usetheo-ui#10).
