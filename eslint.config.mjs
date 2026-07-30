import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/_generated/**",
    // Herramientas de agentes: `.claude/worktrees/**` son copias completas del
    // repo (`git worktree`) que ESLint barre igual porque no respeta
    // `.gitignore`. Un worktree olvidado metía 716 errores de archivos que no
    // son del proyecto y dejaba `npm run lint` inservible.
    ".claude/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
