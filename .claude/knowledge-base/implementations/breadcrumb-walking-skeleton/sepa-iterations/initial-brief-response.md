# SEPA initial brief — breadcrumb-walking-skeleton (2026-07-14)

Veredicto: plano pronto para RED após clarificações (absorvidas no plano v1.3).

Achados-chave:
1. HIGH: faltavam testes explícitos de data-slot (D4 pilar c) e forwardRef — adicionados (test_all_subs_have_data_slot_attributes, test_root_and_link_forward_ref); contagem 11→13.
2. Convenções do repo obrigatórias (divergem do shadcn shipped): forwardRef em TODOS os subs (button.tsx:96, topnav.tsx:21+), displayName em todos (button.tsx:112), `import { Slot } from "@radix-ui/react-slot"` (named), ref type de Link = HTMLAnchorElement mesmo com asChild.
3. Registry: button.json NÃO declara lucide-react em dependencies → replicar (lucide implícita); deps = ["@radix-ui/react-slot"], registryDependencies = ["cn","tailwind-preset"].
4. Biome: useSortedClasses (fix safe), noUnusedImports, noConsole.
5. Testes: espelhar pagination.test.tsx (vitest-axe `axe` + toHaveNoViolations; getByRole/getAllByRole).

(Resposta integral do agente registrada no transcript da sessão; este arquivo é o resumo operativo.)
