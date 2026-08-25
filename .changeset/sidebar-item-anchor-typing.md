---
"@usetheo/ui": patch
---

`Sidebar.Item` passa a tipar o que já renderizava no ramo de âncora.

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
