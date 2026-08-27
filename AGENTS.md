<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# Seguridad

Antes de añadir endpoints, mutations Convex, rutas o variables de entorno, **lee [`docs/security.md`](docs/security.md)**. Contiene los patrones obligatorios (auth, ownership, validación, rate limit, sanitización de errores) y el checklist de PR. Actualízalo en el mismo commit si introduces un patrón nuevo o tomas una decisión explícita de "ahora no".

# Tokens en Figma

Antes de crear, renombrar, reasignar o borrar una variable, un estilo de texto o un estilo de efecto en el archivo Figma, **lee [`docs/figma-tokens.md`](docs/figma-tokens.md)**: el modelo canónico de cuatro capas (primitivo · semántico · marca · componente), las reglas de alias, scope y publicación, y las divergencias asumidas de este archivo respecto al modelo.

**Regla que no se salta: toda variable y todo estilo nuevo nace con una descripción de cómo y dónde se usa.** Sin descripción el token no está terminado. La fórmula y los recortes están en ese documento; el registro de decisiones del archivo, en [`docs/design-system.md`](docs/design-system.md).
