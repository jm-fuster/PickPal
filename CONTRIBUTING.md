# Contribuir a PickPal

¡Gracias por querer contribuir! Esta guía es corta a propósito.

## Antes de tocar código

Si vas a abrir un PR grande (feature nueva, refactor amplio, cambio de stack), **abre primero una issue** para discutirlo. Para fixes pequeños, mejoras de UX o typos, dale directamente.

Echa un ojo a [`docs/dudas.md`](docs/dudas.md) — ahí están las decisiones de producto/técnicas todavía abiertas, y a [`docs/`](docs/) en general para entender la arquitectura.

## Setup local

```bash
git clone https://github.com/JMFusterr/PickPal.git
cd PickPal
npm install
cp .env.example .env.local        # rellena las claves
npx convex dev                    # terminal 1
npm run dev                       # terminal 2
```

Las variables de entorno y de dónde sacarlas están explicadas en [README.md](README.md#variables-de-entorno).

## Antes de abrir el PR

```bash
npm test       # 40 tests con Vitest
npm run lint   # ESLint
```

Ambos deben pasar. Si añades código en `src/lib/`, escribe tests también — los tests existentes son la referencia de estilo (`*.test.ts` junto al fichero).

## Estilo

- **TypeScript estricto.** El proyecto tiene `strict: true`; nada de `any` salvo casos justificados con comentario.
- **Convex.** Antes de tocar `convex/` lee `convex/_generated/ai/guidelines.md` — son las reglas que se imponen sobre lo que puedas haber visto en otros proyectos Convex.
- **shadcn/ui.** Los componentes UI usan `buttonVariants` con `<Link>`, no `asChild` (ver [`docs/`](docs/) para el porqué).
- **Clerk v7.** No uses `<SignedIn>` / `<SignedOut>` ni `afterSignOutUrl` en `<UserButton>` — han desaparecido en v7.
- **Mensajes de commit en español o inglés**, con prefijos tipo `feat:`, `fix:`, `docs:`, `test:`, `refactor:`. Mira `git log` para ver el patrón.

## Estructura del repo

```
src/app/                 # Next.js App Router
  (auth)/                # /sign-in, /sign-up
  (app)/                 # rutas autenticadas (dashboard, people, settings)
  api/recommendations/   # endpoint Gemini
src/components/          # UI compartida (incl. shadcn/ui)
src/lib/                 # utilidades puras + esquemas Zod (con tests)
convex/                  # schema + queries + mutations
docs/                    # documentación de diseño y decisiones
```

## Reportar bugs

Abre una issue con: pasos para reproducir, qué esperabas, qué pasó, navegador/SO. Captura si aplica.

## Licencia

Al contribuir aceptas que tu código se publique bajo la [licencia MIT](LICENSE) del proyecto.
