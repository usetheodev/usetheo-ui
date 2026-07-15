# Blueprint: Annotation platform (M12)

> Contrato de `AnnotationInput` (categorical/continuous/freeform, controlado) validado contra 2 fontes (phoenix `{Categorical,Continuous,Freeform}AnnotationInput.tsx` + langfuse `score-configs.ts`/`AnnotationForm.tsx`) + o contrato REAL do theo-lens (submissão via `labeling-queue/resolve` existe; score-config store NÃO existe → adoção com fixtures client-side, mitigação do ROADMAP). Zero dep nova — compõe RadioGroup/Input/Textarea/Label já no DS.

**Slug:** `annotation-platform` · **Date:** 2026-07-15

## Context

ROADMAP § M12 (V2, gap P0). Phoenix e Langfuse têm tipos de score nomeados; o lens tem só label/score/note free-form. O componente é a fundação de qualidade/eval.

## Objective

Fixar o contrato de 1 componente controlado (`AnnotationInput`) que cobre os 3 tipos, reusando os primitivos de formulário do DS.

## Coverage Corner 1 — Integration Tests

Componente controlado (value + onValueChange). Testes: cada tipo renderiza o input certo (radiogroup/number/textarea), value controlado reflete a prop, onValueChange dispara com o shape certo (label string / number / string), required/disabled, empty/edge, axe por story. Sem I/O (fronteira DS — a submissão é do consumidor).

## Coverage Corner 2 — Dependencies

**Tipos (discriminados por `type`):**
```ts
interface CategoricalOption { label: string; score?: number | null; }
interface AnnotationCategoricalConfig { type: "categorical"; options: CategoricalOption[]; }
interface AnnotationContinuousConfig { type: "continuous"; min: number; max: number; step?: number; }
interface AnnotationFreeformConfig { type: "freeform"; maxLength?: number; }
type AnnotationConfig =
  | AnnotationCategoricalConfig
  | AnnotationContinuousConfig
  | AnnotationFreeformConfig;
```
Props discriminadas (o shape de `value` casa com o `config.type`): categorical→`value: string|null`; continuous→`value: number|null`; freeform→`value: string|null`. Comuns: `name` (rótulo do score), `id?`, `description?`, `required?`, `disabled?`.

**Zero dep nova** — compõe `RadioGroup`/`RadioGroup.Item`, `Input` (type=number), `Textarea`, `Label` já publicados no DS (rung 4 parsimony). Nenhum manifesto alterado.

## Coverage Corner 3 — Tools

**A11y:** categorical usa `RadioGroup` (radiogroup ARIA do Radix, já a11y); continuous é `Input type=number` com `min`/`max`/`aria-describedby` do range; freeform é `Textarea` rotulada. `Label` liga via `htmlFor`/`id`. required marca `aria-required`. axe por story.
**North-star:** +1 componente (`AnnotationInput`) + os tipos de config.

## Coverage Corner 4 — Techniques

- **Categorical (Q1):** `RadioGroup value={value} onValueChange` com um `RadioGroup.Item` por `options[].label`; value = a label selecionada (string). Phoenix usa Select/radios; escolhemos radiogroup (leitura direta de ≤~7 opções nomeadas, sem overlay). Score opcional por option é metadado (o consumidor mapeia label→score na submissão); o componente devolve a label.
- **Continuous (Q2):** `Input type=number` com `min`/`max`/`step` do config; value = number|null (vazio → null). Bound honesto: valor fora de [min,max] é clampeado na exibição do hint mas o onValueChange devolve o digitado (validação de negócio é do consumidor). Phoenix/Langfuse usam number input com min/max — idêntico.
- **Freeform (Q3):** `Textarea` com `maxLength?`; value = string|null (vazio → null). Igual ao note atual do labeling-queue, agora tipado.

## ADRs

### D1 — Componente único config-driven (discriminated union), não 3 componentes soltos

**Decision:** um `AnnotationInput` que despacha por `config.type` (union discriminada nas props, para o TS casar `value`/`onValueChange` ao tipo). Sub-render interno por tipo.

**Rationale:** o call-site do consumidor itera uma lista de configs e renderiza `<AnnotationInput config={c} .../>` sem branching — o branching mora no componente (padrão phoenix config-driven). Alternativa: exportar 3 componentes (rejeitada — empurra o branching pro consumidor, repete em cada tela). Alternativa: um componente não-tipado com `value: unknown` (rejeitada — perde type-safety, o valor de cada tipo é distinto).

### D2 — Compõe os primitivos do DS; zero primitivo novo

**Decision:** reusa `RadioGroup`/`Input`/`Textarea`/`Label`. Nenhum primitivo novo, nenhuma dep nova.

**Rationale:** rung 4 parsimony (reuso do já instalado) + os primitivos já são a11y/tema. Alternativa: radios nativos crus (rejeitada — perde tema/foco do RadioGroup do DS). Alternativa: Slider p/ continuous (rejeitada — number input é o padrão das 2 referências e é preciso; Slider seria YAGNI sem pedido).

### D3 — 3 tipos (phoenix), não 5 (langfuse); score-config store fica como fixture no consumidor

**Decision:** CATEGORICAL/CONTINUOUS/FREEFORM. BOOLEAN é categorical-de-2 (o consumidor passa 2 options); CORRECTION é system-only (fora). O STORE de configs (persistir tipos nomeados) NÃO é do DS nem existe no backend — o lens define os configs como fixtures client-side (mitigação "UI + fixtures" do ROADMAP § M12 risco #1).

**Rationale:** menor superfície honesta que cobre o gap; o backend do lens não tem score-config store (confirmado no discover), então forçar um shape de 5 tipos ou depender do store seria fabricar contrato. Alternativa: esperar o backend (rejeitada — bloqueia sem necessidade; o componente é a entrega do DS). Alternativa: 5 tipos (rejeitada — BOOLEAN/CORRECTION não agregam ao input controlado).

## Recommendations

`/to-plan annotation-platform`: Fase 1 tipos de config (`src/components/composites/annotation-input/types.ts`, camada de tipos pura); Fase 2 `AnnotationInput` (3 sub-renders, TDD + axe); Fase 3 registry+release; Fase 4 adoção no lens (labeling-queue com score-configs fixture + o componente, submissão real via resolve).

## Blocked questions

(none)

## Related

- Gap analysis: `.claude/knowledge-base/audits/sota-gap-analysis-2026-07-15.md`
- Referências: `phoenix/app/src/components/annotation/{Categorical,Continuous,Freeform}AnnotationInput.tsx`, `langfuse/packages/shared/src/domain/score-configs.ts`
- Primitivos reusados: `src/components/primitives/{radio-group,input,textarea,label}/`
- Alvo de adoção: `theo-cloud dashboard/src/pages/lens/labeling-queue.tsx:228-238`; backend real `POST /v1/dashboard/lens/labeling-queue/{id}/resolve`
