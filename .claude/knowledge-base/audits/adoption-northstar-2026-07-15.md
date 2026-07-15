# North-star — adoção do @usetheo/ui nos consumidores (M7)

**Metodologia:** símbolos únicos importados de `@usetheo/ui` por repo (proxy de "componentes em uso real") + linhas/arquivos de import. Comandos literais abaixo — a MESMA linha roda no baseline e no delta.

## Comandos (reprodutíveis)

```sh
# símbolos únicos (por repo — ajuste SRC_DIRS)
grep -rhozE "import[^;]*from ['\"]@usetheo/ui['\"]" <SRC_DIRS> --include='*.tsx' --include='*.ts' | tr '\0' '\n' | grep -o '{[^}]*}' | tr -d '{}' | tr ',' '\n' | sed 's/^ *//;s/ *$//;s/^type //;s/ as .*//' | grep -v '^$' | sort -u | wc -l
# linhas / arquivos de import
grep -rE "from ['\"]@usetheo/ui['\"]" <SRC_DIRS> --include='*.tsx' --include='*.ts' | wc -l
grep -rlE "from ['\"]@usetheo/ui['\"]" <SRC_DIRS> --include='*.tsx' --include='*.ts' | wc -l
```

## Baseline (2026-07-15, pré-adoção — medido no discover do M7)

| Consumidor | Símbolos únicos | Linhas de import | Arquivos | Versão |
|---|---|---|---|---|
| dashboard (`theo-cloud/dashboard/src` + `.storybook`) | **45** (7 órfãos do pivot) | 158 | 155 | ^0.13.2 |
| studio (`theokit-studio/packages/studio/src`) | **9** | 19 | 19 | ^0.17.0 |
| **União** | **46** | 177 | 174 | — |

Hand-rolled a remover (inventário no blueprint do M7): metric-trend-chart, build-timeline (estático, dead), build-timeline-live/build-step-card (render), virtual-table (dead), trace-detail/breadcrumb.

## Delta (pós-adoção)

(preenchido no T4.0)
