# Giftly

App web para recordar fechas importantes y recibir recomendaciones de regalos personalizadas con IA.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind 4
- **Clerk** para autenticación
- **Convex** como backend reactivo
- **AI SDK + Gemini** para generar ideas de regalo
- **shadcn/ui** + next-themes (claro/oscuro)

Más detalle en [docs/](docs/).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellenar las claves (ver docs/tech-stack.md)
npx convex dev               # en una terminal — provisiona el deployment
npm run dev                  # en otra terminal — arranca Next en :3000
```

## Variables de entorno

Ver [`.env.example`](.env.example). Necesitas:

- Claves de Clerk (`pk_test_*`, `sk_test_*`).
- Issuer URL del JWT template "convex" en Clerk.
- `NEXT_PUBLIC_CONVEX_URL` y `CONVEX_DEPLOYMENT` (los rellena `npx convex dev`).
- `GOOGLE_GENERATIVE_AI_API_KEY` para las recomendaciones IA (https://aistudio.google.com).

## Documentación

- [Visión general](docs/overview.md)
- [Tech stack](docs/tech-stack.md)
- [Estructura](docs/estructura.md)
- [Etapas de desarrollo](docs/etapas.md)
- [Dudas y decisiones pendientes](docs/dudas.md)
