# SEPA initial brief — slider-combobox-playground (2026-07-14)

Achados operativos (íntegra no transcript):
1. CRITICAL: @radix-ui/react-slider ausente → pnpm add antes do RED (T1.1 task 1). ✔ planejado.
2. HIGH: cmdk `Loading` é export TOP-LEVEL (index.d.ts:215-229), não Command.Loading — import direto.
3. HIGH: cmdk separa `Command.value` (item ativo) de `Input.value` (search) — context do Combobox mantém searchValue e selectedValue distintos; pinar em teste.
4. HIGH: happy-dom sem ResizeObserver (Radix Slider usa) → adicionar polyfill no test setup (setup.ts, após scrollIntoView).
5. getBoundingClientRect stub do happy-dom: keyboard tests OK (math por value); drag fora do escopo (EC-3 da descoberta).
6. Precedente exato para o Input do combobox: command-palette.tsx:86-91 (shouldFilter + onValueChange do search).
7. Registry deps por introspecção: slider ["@radix-ui/react-slider"], combobox ["cmdk","lucide-react"].
