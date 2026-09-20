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
    // Perfil de Chrome que deja `scripts/screenshots.mjs --auth` para no tener
    // que volver a iniciar sesión. Son ~210 MB con las extensiones del
    // navegador dentro, y ESLint las barría igual: 80 errores y 3.278 avisos
    // de código que no es nuestro. Mismo caso que los worktrees de arriba.
    "docs/screenshots/.profile/**",
  ]),
]);

export default eslintConfig;
