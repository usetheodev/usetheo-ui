---
generated_by: roadmap-init
generated_on: 2026-07-14
slug: data-ui-expansion
peer_count_cloned: 8
peer_count_skipped: 3
---

# References catalog

State-of-the-art peer projects gathered at project inception by `/roadmap-init`.
This file is the contract `/discover-plan` reads when investigating a peer.

> **Lifecycle:** every peer below has lifecycle `cloned` (folder present under this directory) or `skipped` (rejected at license gate / curation, kept here for the record).

---

## shadcn-ui

- **Folder:** `.claude/knowledge-base/references/shadcn-ui/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/shadcn-ui/ui
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-14
- **Stars / forks at clone time:** 119109 / 9501

### Why this peer is here

Referência canônica do modelo de distribuição registry copy-paste que o `@usetheo/ui` segue. Tem receitas prontas e battle-tested dos três primitives de Tier 1 mais delicados.

### What to study in it

- Receita de `Combobox` (Popover + Command/cmdk) — o mesmo cmdk que já temos instalado.
- `Breadcrumb` e `Slider`: superfície de API, composição de sub-componentes, a11y.
- Convenções do registry (como declaram dependências por item — relevante para o M6).

### Supports ROADMAP milestone(s)

- M0 — *because:* API de Breadcrumb.
- M1 — *because:* receitas de Slider e Combobox.
- M6 — *because:* modelo de declaração de deps no registry.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/shadcn-ui/ui .claude/knowledge-base/references/shadcn-ui/
```

---

## base-ui

- **Folder:** `.claude/knowledge-base/references/base-ui/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/mui/base-ui
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-14
- **Stars / forks at clone time:** 10343 / 486

### Why this peer is here

Camada de primitives sucessora do Radix (que desacelerou pós-aquisição WorkOS, notadamente em Combobox/multi-select). Referência de semântica a11y moderna para os primitives interativos do M1.

### What to study in it

- Semântica ARIA e state machine do Slider (range, marks, keyboard).
- Combobox: filtragem, virtualização de lista, anúncios de screen reader.
- Padrão de composição de sub-componentes (comparar com o nosso Object.assign).

### Supports ROADMAP milestone(s)

- M1 — *because:* baseline a11y de Slider/Combobox e plano B caso Radix estagne.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/mui/base-ui .claude/knowledge-base/references/base-ui/
```

---

## data-table-filters

- **Folder:** `.claude/knowledge-base/references/data-table-filters/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/openstatusHQ/data-table-filters
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-05
- **Stars / forks at clone time:** 2159 / 127

### Why this peer is here

Implementação de referência em produção (openstatus) de shadcn + TanStack Table com faceted filters e infinite scroll — o caso exato do nosso M6 (DataTable virtualizado em escala).

### What to study in it

- Como integram virtualização/infinite scroll com sticky header e sort.
- Estrutura de faceted filters (fora do escopo V1, mas informa a API para não fechar portas).
- Trade-offs client-side vs server-side pagination em tabelas grandes.

### Supports ROADMAP milestone(s)

- M6 — *because:* integração TanStack + tabela shadcn-style comprovada.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/openstatusHQ/data-table-filters .claude/knowledge-base/references/data-table-filters/
```

---

## tanstack-virtual

- **Folder:** `.claude/knowledge-base/references/tanstack-virtual/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/TanStack/virtual
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-14
- **Stars / forks at clone time:** 7004 / 449

### Why this peer is here

É a única dependência nova candidata do V1 (M6). Clonado para estudar a API real e os exemplos oficiais antes do ADR de adoção.

### What to study in it

- Exemplos oficiais de tabela virtualizada (fixed vs dynamic row height).
- Superfície da API usada pelo `virtual-table.tsx` do dashboard (o que realmente precisamos).
- Custo de bundle e implicações para o registry copy-paste.

### Supports ROADMAP milestone(s)

- M6 — *because:* fundamenta o ADR da dependência e a implementação do modo virtualizado.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/TanStack/virtual .claude/knowledge-base/references/tanstack-virtual/
```

---

## react-json-view

- **Folder:** `.claude/knowledge-base/references/react-json-view/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/uiwjs/react-json-view
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-05-21
- **Stars / forks at clone time:** 414 / 23

### Why this peer is here

JsonViewer moderno, zero-dependency, ~20KB — exatamente o perfil do nosso alvo M2. A melhor referência de escopo mínimo viável para um viewer read-only.

### What to study in it

- Modelo de collapse (`collapsed` prop + `shouldExpandNodeInitially` callback).
- Tratamento de edge cases: referências circulares, BigInt, strings longas, arrays enormes.
- Theming por tokens (mapear para os nossos tokens Violet Forge em vez de temas embutidos).

### Supports ROADMAP milestone(s)

- M2 — *because:* blueprint do JsonViewer dependency-free.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/uiwjs/react-json-view .claude/knowledge-base/references/react-json-view/
```

---

## react-dropzone

- **Folder:** `.claude/knowledge-base/references/react-dropzone/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/react-dropzone/react-dropzone
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-13
- **Stars / forks at clone time:** 10993 / 801

### Why this peer is here

Padrão consagrado (10 anos) de drag-drop de arquivos em React. Informa a decisão do M5: adotar como dep vs implementar a superfície pequena que precisamos sobre HTML5 DnD nativo.

### What to study in it

- Contrato de eventos e estados (drag-active, drag-reject, focused).
- Validação de arquivos (accept por MIME, min/max size, maxFiles) e o shape dos erros tipados.
- A11y: keyboard activation, role/aria do root, anúncio de rejeições.

### Supports ROADMAP milestone(s)

- M5 — *because:* referência de comportamento e a11y do FileDropzone (e insumo do ADR dep-vs-próprio).

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/react-dropzone/react-dropzone .claude/knowledge-base/references/react-dropzone/
```

---

## mantine

- **Folder:** `.claude/knowledge-base/references/mantine/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/mantinedev/mantine
- **License:** `MIT`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2026-07-13
- **Stars / forks at clone time:** 31428 / 2329

### Why this peer is here

Única lib madura que tem TODOS os componentes-alvo do V1 (Dropzone, Slider, Stepper, JsonInput) em produção há anos — a melhor fonte de decisões de API/props já validadas por uma comunidade grande.

### What to study in it

- Superfície de props do Stepper (estados por etapa, orientação, ícones, erro) para o M4.
- Dropzone: composição com preview/progress e o shape das rejeições para o M5.
- Slider: marks, labels, range — o que a comunidade realmente usa (evitar YAGNI no M1).

### Supports ROADMAP milestone(s)

- M1 — *because:* design de props de Slider.
- M2 — *because:* JsonInput como contraponto de escopo ao viewer.
- M4 — *because:* Stepper maduro.
- M5 — *because:* Dropzone maduro.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/mantinedev/mantine .claude/knowledge-base/references/mantine/
```

---

## tremor

- **Folder:** `.claude/knowledge-base/references/tremor/`
- **Lifecycle:** cloned
- **Repo:** https://github.com/tremorlabs/tremor
- **License:** `Apache-2.0`
- **License-gate decision:** auto-approved-permissive
- **Last release / last commit:** pushed 2025-10-10 ⚠️ (~9 meses sem push — usar como referência de API, não de manutenção)
- **Stars / forks at clone time:** 3519 / 174

### Why this peer is here

Melhor referência de design de API de chart components para dashboards (copy-paste, Tailwind). Estudamos SÓ a interface (axis, legend, tooltip, formatters) — a implementação deles usa Recharts, que nosso ADR proíbe.

### What to study in it

- Superfície de props dos charts de linha/área (categories, index, valueFormatter, curve).
- Padrões de legend/tooltip e responsividade.
- O que deliberadamente NÃO copiar: o acoplamento a Recharts.

### Supports ROADMAP milestone(s)

- M3 — *because:* API do TrendChart SVG-puro.

### Clone command used

```bash
git clone --depth 1 --filter=blob:none https://github.com/tremorlabs/tremor .claude/knowledge-base/references/tremor/
```

---

## Skipped peers (license gate / curation)

> Peers identified during SOTA discovery but rejected at the license gate or curation.
> Listed here so the decision is auditable and not repeated next time.

| Peer | Repo | License | Reason for skip |
|---|---|---|---|
| COSS UI (ex-Origin UI) | https://github.com/cosscom/coss | AGPL-3.0 | license: AGPL-3.0 — risco de contaminação em projeto Apache-2.0 com registry copy-paste; alternativas MIT equivalentes existem |
| react-spectrum (React Aria) | https://github.com/adobe/react-spectrum | Apache-2.0 | curation: cap de 8 peers; papel (semântica a11y de primitives) já coberto por base-ui |
| Kibo UI | https://github.com/haydenbleasel/kibo | MIT | curation: projeto vendido em out/2025 para lib paga; risco de paywall/instabilidade de governança |

---

## Cleanup protocol

- **Remove a peer:** delete its folder under this directory AND remove its entry from this catalog in the same commit.
- **Update a peer (refresh clone):** `cd .claude/knowledge-base/references/{peer}/ && git pull` — record the new commit SHA in this catalog.
- **Replace a peer with a better one:** treat as remove + add. Do NOT rename folders; symbolic continuity is meaningless when the underlying repo changed.

## phoenix
- **Repo:** https://github.com/Arize-ai/phoenix
- **License:** Elastic License 2.0 (ELv2) — ⚠️ NÃO-OSI: referência de ESTUDO apenas; proibido copiar código. Padrões de UI/UX de LLM tracing (waterfall, span tree, transcript) podem ser estudados e reimplementados do zero.
- **Why:** a UI open-source mais próxima da Arize (mesma empresa) — waterfall/tree/transcript/evals reais de produção.
- **added_by:** roadmap-feature
- **added_for_milestone:** M8

## langfuse
- **Repo:** https://github.com/langfuse/langfuse
- **License:** MIT (core) — ⚠️ diretórios `ee/`, `web/src/ee/`, `worker/src/ee/` são Enterprise License: EXCLUÍDOS do estudo.
- **Why:** segunda referência independente de LLM tracing UI (trace detail, sessions, scores) — evita single-source (R1 do M8).
- **added_by:** roadmap-feature
- **added_for_milestone:** M8
