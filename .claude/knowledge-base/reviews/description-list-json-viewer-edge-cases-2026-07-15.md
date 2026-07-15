# Discover Edge Case Review — description-list-json-viewer

Date: 2026-07-15
Discovery plan analyzed: .claude/knowledge-base/discoveries/plans/description-list-json-viewer-plan.md (v1.0)
Research questions analyzed: 7 (+ Consumer requirements)
Edge cases found: 4 (MUST FIX: 0, SHOULD TEST: 2, DOCUMENT: 2)

## MUST FIX

(none — paths pré-validados 2026-07-15: core/package.json [zero deps confirmado], JsonInput.tsx, field/item em _registry.ts:250/:316, test files em core/src/types/index.test.tsx)

## SHOULD TEST

### EC-1: "circular" retorna zero hits no react-json-view — resposta válida, não BLOCKED
- **Affected question:** Q2
- **Suggested halt-loop checkpoint:** "Se um edge da lista de Q2 não tiver hit na referência, a resposta é 'não tratado na referência — tratamento fica por nossa conta' com a evidência da busca (3 variantes registradas); NÃO marcar BLOCKED nem omitir a família do inventário." (Pré-verificado: `circular` não aparece em core/src — a referência provavelmente lança em JSON circular; nosso viewer DEVE tratar.)

### EC-2: testes do react-json-view vivem em types/index.test.tsx além dos dois declarados
- **Affected question:** Q4
- **Suggested halt-loop checkpoint:** "Fase A de Q4 usa Glob `core/src/**/*.test.tsx` (recursivo) — index.test.tsx/Container.test.tsx são o começo, types/index.test.tsx (BigInt :38) já confirma assertions de tipo."

## DOCUMENT

### EC-3: peerDependency @babel/runtime da referência é irrelevante para nós
- **Accepted risk:** o zero-dep deles tem peer @babel/runtime (artefato de build lerna); nossa implementação própria não herda nada — registrar no blueprint § deps sem ação.

### EC-4: field/item do shadcn são form-primitives, não DL
- **Accepted risk:** transferência é de VOCABULÁRIO de layout (orientação/densidade), não de semântica; o DescriptionList é `dl/dt/dd` nativo (rung 2/3 da parsimony — plataforma resolve semântica). Q3 já está enquadrada assim.

**Verdict:** DISCOVERY PLAN OK (0 MUST FIX; absorver os 2 SHOULD TEST como checkpoints)
