# Changelog

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
