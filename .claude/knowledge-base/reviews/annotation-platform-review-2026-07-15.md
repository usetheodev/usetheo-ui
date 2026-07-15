# Review: annotation-platform (M12) — library phase

**Date:** 2026-07-15
**Reviewer:** 1 agente consolidado (qualidade + wiring + correção de tipos/a11y). Diff M12 é lib-only; a fase cross-repo de adoção no lens (labeling-queue) acontece pós-release (precedente M7/M8/M9/M11).
**Verdict:** **READY_TO_MERGE** — 0 BLOCKER, 0 HIGH. O único LOW (L-1) foi corrigido in-cycle.

## Escopo

Fase de biblioteca do M12: `src/components/composites/annotation-input/{types.ts,annotation-input.tsx}` (union discriminada 3 tipos + type guards + componente controlado config-driven), stories, testes, registry. A adoção no labeling-queue do theo-lens é a fase pós-release.

## Achados e resolução

### LOW

| ID | Achado | Resolução |
|---|---|---|
| L-1 | **A11y semântico:** o `<Label htmlFor={undefined}>` do categorical era um `<label>` órfão (não associava nada; o nome do radiogroup vinha de `aria-label={name}`, duplicando o texto visível). axe passava (0 violações), mas era um label semanticamente inerte + nome duplicado. | **CORRIGIDO** — a Label visível recebe `id={controlId}-label` e o RadioGroup usa `aria-labelledby={labelId}` (não mais `aria-label`). Agora a label visível É a fonte do nome acessível (sem duplicação), referenciada corretamente. continuous/freeform seguem com `htmlFor`/`id`. 19/19 verde (o teste de accessible-name do radiogroup continua passando via aria-labelledby). |

### INFO (verificado-correto)

- I-1: **NaN-guard do continuous sound** — probado com `-`, `1e`, `abc`, `" "`, `0.`, `1.2.3`, `Infinity`: sempre `null` ou finito, nunca `NaN`/`undefined`/`""` (jsdom sanitiza input number inválido para `""` → early null; `Number.isFinite(n)?n:null` cobre o resto).
- I-2: **Casts `Extract<…>` sound** — após `props.config.type === "..."` o guard garante o membro da union; o cast não mascara buraco de runtime. Comentário TS#30581 (correlated-union) acurado. Alternativa de 3 sub-componentes rejeitada com razão no ADR D1.
- I-3: **Props discriminadas entregam o ADR D1** — probado com `@ts-expect-error`: config categorical + value numérico, e config continuous + value string, são REJEITADOS pelo TS. Consumidor itera configs e renderiza `<AnnotationInput config={c}/>` sem branching.
- I-4: **DRY ok** — o `a11y` spread é fonte única (o fix do dup bloqueado pelo hook), o padrão `Extract` repete 3× mas cada bloco liga um controle DISTINTO (RadioGroup/Input/Textarea) — repetição estrutural/presentacional, não de lógica de negócio (Rule 12), mesma leitura do M11 (I-2).

## Gates (re-run pós-fix L-1)

- **Subset M12: 19/19** (types 4 + component 15, inclui axe nos 3 tipos)
- **Full suite da lib: 1123/1123**
- **typecheck 0 · lint 0** (1 warning pré-existente `span-tree.tsx:90`, não-M12) · **format limpo**
- **registry:validate PASS (83 itens)** — 1 novo descriptor (annotation-input; deps de primitivos reusados)
- **build ESM** ok (290 KB)
- **Zero dep nova confirmado** — compõe `RadioGroup`/`Input`/`Textarea`/`Label` já publicados; `package.json` dependencies inalterado
- **Wiring triad:** (a) caller = story `Playground` + testes; (b) integração = *.test.tsx (+ teste de identidade do barrel); (c) observabilidade = `data-slot="annotation-input"` + `data-type={config.type}`
- **A11y:** continuous/freeform via `Label htmlFor`+`id`; categorical via `aria-labelledby` (pós-fix); axe verde (rodado) nos 3 tipos
- **Honestidade/YAGNI:** 3 tipos (phoenix) justificados no ADR D3 (BOOLEAN=categorical-de-2, CORRECTION system-only); Slider p/ continuous rejeitado como YAGNI; value↔null honesto (vazio→null, nunca NaN)

## Handoff decision

**READY_TO_MERGE** para o release da biblioteca. A adoção no theo-lens (labeling-queue com score-configs fixture + `AnnotationInput`) + north-star completam pós-merge, contra a versão publicada — sequência release→adoção→bump (M7/M8/M9/M11).
