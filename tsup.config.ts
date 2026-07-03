import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "tailwind-preset": "src/styles/tailwind-preset.ts" },
  format: ["esm"],
  dts: false,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: true,
});
