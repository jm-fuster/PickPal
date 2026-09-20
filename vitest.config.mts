import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

// En ESM no hay __dirname. Mismo patrón que scripts/token-map.mjs.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // Los tests de convex/ necesitan `environment: "edge-runtime"`, que es el
    // runtime en el que corren las funciones de verdad. No se cambia aquí de
    // forma global: cada archivo de convex/ lo pide con la directiva
    // `@vitest-environment edge-runtime` en su cabecera, y el resto sigue en
    // node.
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "convex/**/*.test.ts",
    ],
    exclude: ["convex/_generated/**", "node_modules/**"],
    server: {
      // convex-test se distribuye como ESM sin transpilar; sin esto Vitest lo
      // externaliza y falla al cargarlo.
      deps: { inline: ["convex-test"] },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
