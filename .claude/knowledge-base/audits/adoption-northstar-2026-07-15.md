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

## Delta (pós-adoção, 2026-07-15 — mesmos comandos)

| Consumidor | Símbolos únicos | Linhas de import | Arquivos | Versão | Δ símbolos |
|---|---|---|---|---|---|
| dashboard | **44** | 161 | 155 | ^0.22.0 (→^0.22.1 pós-#9) | 45→44 (−7 órfãos do pivot p/ @theokit/ui; +6 adoções: TrendChart/TrendSeries/TrendPoint/Stepper/StepperStepData/Breadcrumb) |
| studio | **14** (+5) | 22 | 22 | ^0.22.0 | +JsonViewer, +DescriptionList, +Slider, +Combobox (Tier-1 fechado; Breadcrumb já contava) |
| **União** | **48** (+2 líquido; +11 adoções reais compensando os 7 órfãos saneados) | 183 | 177 | — | baseline 46 → 48 |

### Hand-rolled deletados (commits no develop do dashboard)

| Arquivo | Veredito | Commit |
|---|---|---|
| `src/components/lens/metric-trend-chart.{tsx,test.tsx}` | migrado → TrendChart | `c9eaf13` [T2.1] |
| `src/components/deploy/build-step-card.{tsx,test.tsx}` | migrado → Stepper (render do live) | `201dbc5` [T2.2] |
| `src/pages/lens/trace-detail/breadcrumb.tsx` (markup) | reescrito sobre Breadcrumb da lib (helper/hooks ficam) | `bb12a1a` [T2.3] |
| `src/components/deploy/build-timeline.{tsx,stories.tsx}` | deleção seca (zero callers) | `93e08b3` [T2.4] |
| `src/components/data/virtual-table.{tsx,test.tsx}` | deleção seca (zero callers) | `93e08b3` [T2.4] |

### Studio (commits no develop)

`74c09a8` [T3.0 bump] · `aa318e6` [T3.1 JsonViewer+DescriptionList] · `c4e2d0e` [T3.2 painel de params]

### Bônus do loop de feedback

A suíte do dashboard pegou regressão de a11y NA LIB (search sem aria-label) → usetheo-ui#8 filado + corrigido com TDD + release 0.22.1 (PR #9) — o north-star funcionando nos dois sentidos.
