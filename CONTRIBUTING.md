# Contribuir a PickPal

¡Gracias por querer contribuir! Esta guía es corta a propósito.

> La documentación del proyecto está en español; el README principal está en
> [inglés](README.md) y [español](README.es.md).

## Antes de tocar código

Si vas a abrir un PR grande (feature nueva, refactor amplio, cambio de stack),
**abre primero una issue** para discutirlo. Para fixes pequeños, mejoras de UX o
typos, dale directamente.

Hay tres documentos que conviene leer antes de tocar según qué:

- [`docs/security.md`](docs/security.md) — **obligatorio** antes de añadir un
  endpoint, una mutation de Convex, una ruta o una variable de entorno. Lleva los
  patrones que no se saltan (auth, ownership, validación, rate limit) y un
  checklist de PR por ruta tocada.
- [`docs/design-system.md`](docs/design-system.md) — antes de cambiar algo visual.
- [`docs/figma-tokens.md`](docs/figma-tokens.md) — antes de crear o renombrar un
  token.

[`AGENTS.md`](AGENTS.md) y [`CLAUDE.md`](CLAUDE.md) son el reglamento corto que
apunta a esos tres.

## Setup local

El orden importa —`npx convex env set` necesita que el proyecto esté enlazado
antes— así que los pasos completos están en el README y no se duplican aquí:
[Running it locally](README.md#running-it-locally) y
[Configuration](README.md#configuration).

En corto, una vez tienes las cuentas de Clerk, Convex y Google AI Studio:

```bash
git clone https://github.com/jm-fuster/PickPal.git
cd PickPal
npm install
cp .env.example .env.local
```

Hacen falta dos terminales a la vez: `npx convex dev` y `npm run dev`.

## Antes de abrir el PR

```bash
npm test                                  # 134 tests con Vitest
npx tsc --noEmit                          # tipos de la app
npx tsc -p convex/tsconfig.json --noEmit  # Convex tiene su propio tsconfig
npm run lint
```

CI corre los tres primeros en cada push y PR, sobre Node 22. **No corre el linter
ni `next build`**, así que esos dos van de tu cuenta.

El segundo typecheck no es redundante: sin él, un error de tipos que solo existe
en `convex/` pasa CI y revienta el deploy en Vercel.

Si añades código en `src/lib/`, escribe tests también — los existentes son la
referencia de estilo (`*.test.ts` junto al fichero).

## Estilo

- **TypeScript estricto.** El proyecto tiene `strict: true`; nada de `any` salvo
  casos justificados con comentario.
- **Convex.** Antes de tocar `convex/` lee `convex/_generated/ai/guidelines.md` —
  son las reglas que se imponen sobre lo que puedas haber visto en otros
  proyectos Convex.
- **Next 16.** No es el Next que conoces: `middleware.ts` ahora se llama
  `proxy.ts`, entre otras cosas. Lee la guía correspondiente en
  `node_modules/next/dist/docs/` antes de escribir código.
- **Componentes UI.** Las primitivas de `src/components/ui/` son
  [Base UI](https://base-ui.com) siguiendo las convenciones de shadcn. Para un
  enlace con pinta de botón usa `buttonVariants` con `<Link>`, no `asChild`.
- **Clerk v7.** No uses `<SignedIn>` / `<SignedOut>` ni `afterSignOutUrl` en
  `<UserButton>` — han desaparecido en v7.
- **Mensajes de commit en inglés**, con prefijos tipo `feat:`, `fix:`, `docs:`,
  `test:`, `refactor:`. Mira `git log` para ver el patrón.

## Estructura del repo

```
src/app/
  (auth)/                        # /sign-in, /sign-up
  (app)/                         # rutas autenticadas
    agenda/                      # lo que llega en los próximos 4 meses
    seres-queridos/              # lista, ficha, alta y panel de ideas
    settings/                    # tema, avisos, tiendas, borrar cuenta
  api/recommendations/           # generación de ideas (Gemini)
  api/account/delete/            # borrado en cascada de la cuenta
  privacidad/ terminos/          # páginas legales, públicas
  proxy.ts                       # (en src/) default-deny + comprobación CSRF
src/components/                  # landing, dashboard, people, gifts, layout, ui
src/lib/                         # utilidades puras + esquemas Zod (con tests)
convex/                          # schema de 9 tablas, funciones, crons
design/                          # volcado de tokens de Figma y divergencias
docs/                            # documentación de diseño y decisiones
scripts/                         # token-map.mjs, screenshots.mjs
```

## Reportar bugs

Abre una issue con: pasos para reproducir, qué esperabas, qué pasó, navegador/SO.
Captura si aplica.

## Licencia

Al contribuir aceptas que tu código se publique bajo la
[licencia MIT](LICENSE) del proyecto.
