---
"@usetheo/ui": patch
---

Alinha o `@changesets/cli` com a major que o `changesets/action` entende.

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
