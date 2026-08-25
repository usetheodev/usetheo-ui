---
"@usetheo/ui": patch
---

O pacote passa a dizer de onde vem e o que contém.

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
