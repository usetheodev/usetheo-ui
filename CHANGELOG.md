# Changelog

## 0.36.0

### Minor Changes

- 4973612: `Card` and `Sidebar.Item` accept `asChild`.

  Two issues, one question, answered the same way on purpose — answering them differently would have
  been worse than either answer alone (usetheodev/usetheo-ui#31, #32).

  **`Sidebar.Item asChild`** lets a router `Link` be the element the row renders, so the router sees
  the link and can prefetch it. `as="a" href={to}` plus an `onClick` calling `navigate()` works and is
  what consumers write today, but the router never sees that link — and on a sidebar, where hover
  precedes click almost every time, prefetch is exactly what that costs. Wrapping in a `<Link>`
  instead nests an `<a>` inside an `<a>`. The icon, the count and `aria-current` still come from the
  component: `Slottable` marks which child becomes the host element, and the rest render inside it.

  **`Card asChild`** lets the whole card be a control — choice grid, plan picker, agent selector. The
  two ways to build one without it were both bad: a `<button>` wrapped around a `<Card>` is invalid
  (a button takes phrasing content and the card renders a `<div>`, so the browser reparents it), and
  copying the card's classes onto a `<button>` forks the design system at a place that stops tracking
  it. This does not lift the phrasing-content restriction — choose `<button>` and everything inside is
  still limited — but it gives the choice, and `<a>` becomes the better answer for anything navigable.

  Both are additive: `as` still serves the router-less cases, and omitting `asChild` renders exactly
  what it rendered before.

- c16e0b0: `Stepper` and `Dialog.Content` let an app translate the text they write for screen readers.

  `Stepper` takes `stateLabels` (`{ done, failed, pending }`): the state spoken after each step's label.
  A state left out keeps its English text. `Dialog.Content` takes `closeLabel`, the name of the corner
  close button, which defaults to "Close". Until now both were fixed English strings, so an app in
  another language announced them in English (#37).

### Patch Changes

- 4973612: The public CSS assets are published again: `styles.css`, `styles-v3-legacy.css`, `components.css`,
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

## 0.35.4

### Patch Changes

- f8075f2: `Sidebar.Item` passa a tipar o que já renderizava no ramo de âncora.

  `as="a"` sempre produziu um `<a>` real em runtime, mas `ItemProps` estendia `ButtonHTMLAttributes`
  nos dois casos. O efeito era que nenhum atributo de âncora compilava — `target`, `rel`, `download`,
  `hrefLang` — num elemento que os renderiza sem problema. Um link de barra lateral para outro site,
  que quase sempre quer `target="_blank" rel="noreferrer"`, não podia ser escrito com este componente
  (usetheodev/usetheo-ui#27).

  `ItemProps` passa a ser uma união discriminada pelo `as`, com `href` obrigatório no ramo de âncora
  — uma âncora sem `href` não é focável por teclado nem anunciada como link, e essa combinação
  compilava.

  Duas confusões que a união **não** apanha ficam escritas no teste de tipos em vez de silenciadas:
  `type` e `target` no ramo do botão continuam a compilar, porque numa união JSX um atributo é aceite
  quando existe em qualquer ramo, e ambos existem no ramo da âncora. Fechá-las exige dois pontos de
  entrada nomeados em vez de um discriminante, o que é uma decisão de desenho, não um efeito
  colateral de uma correcção de tipos.

  Coberto por `sidebar-item-as.test-d.tsx` (o compilador é a asserção, como em
  `children-rejected.test-d.tsx`) e por dois testes de runtime que provam que os atributos chegam ao
  DOM.

## 0.35.3

### Patch Changes

- 5ffc873: Alinha o `@changesets/cli` com a major que o `changesets/action` entende.

  A release 0.35.2 publicou em npm mas não deixou tag nem GitHub Release. O CLI fez a sua parte —
  o log diz `Successfully published` e `Created git tags` — e o action parou aí: não empurrou as
  tags nem criou a página da release.

  A causa é a major do CLI. O `changesets/action@v1.9.0` lê a SAÍDA do `changeset publish` para
  saber o que foi publicado, e o `@changesets/cli@3.x` mudou esse formato (passou aos prompts do
  clack: `◇ Successfully published:` em vez de `🦋 info`). O action não reconhece o novo formato,
  conclui que nada foi publicado, e salta o resto do trabalho em silêncio — que é o pior modo de
  falhar, porque o publish acontece na mesma e a lacuna só aparece dias depois, quando alguém
  procura a tag.

  Fixado em `^2.31.1`, a mesma versão que o `theokit-ui` e os outros repositórios publicáveis da
  framework usam. A tag e a release do 0.35.2 foram criadas à mão; a partir daqui saem do fluxo.

## 0.35.2

### Patch Changes

- ac40336: O pacote passa a dizer de onde vem e o que contém.

  Encontrado ao construir uma app sobre a stack Theo (usetheokit/theokit-ui#73): quem procurava um
  `Sidebar`, uma `DataTable` ou um `Select` não os encontrava e reescreveu-os à mão — estavam aqui,
  instalados, o tempo todo.

  - `package.json` passa a declarar `repository`, `homepage`, `bugs` e `keywords`. Sem eles, quem
    descobrisse os componentes não tinha catálogo, exemplos, nem onde reportar um defeito.
  - O README dizia "54 components (39 primitives + 15 composites)" com 87 publicados, e não listava
    um único nome. Passa a listar todos, gerados de `src/components/` por `pnpm sync:readme`, com a
    divisão de camadas explicada no topo: este pacote é a metade sem agente nenhum; o `@theokit/ui`
    constrói por cima.
  - `publishConfig` com `access: public` e `provenance: true`, para que o artefacto publicado leve
    atestação de origem.

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
