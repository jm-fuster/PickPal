# PickPal

> No olvides el cumpleaños de quien te hace bien.

App web open-source para recordar fechas importantes (cumpleaños, aniversarios) de la gente que te importa y recibir ideas de regalo personalizadas con IA cuando se acerca cada ocasión.

**Demo:** [pickpal.jorgemolinafuster.com](https://pickpal.jorgemolinafuster.com)

## Funcionalidades

- 👤 **Personas con contexto**: nombre, relación, intereses, presupuesto y notas.
- 📅 **Fechas importantes** (cumpleaños, aniversarios, lo que quieras), con recordatorios configurables.
- ✨ **9 ideas de regalo personalizadas con Gemini** según los gustos y presupuesto, con búsqueda directa en Amazon.es.
- 🌓 Modo claro / oscuro.
- 🇪🇸 Interfaz en español.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind 4
- [Clerk](https://clerk.com) para autenticación
- [Convex](https://convex.dev) como backend reactivo y base de datos
- [AI SDK](https://sdk.vercel.ai) + [Google Gemini](https://ai.google.dev) para las recomendaciones
- [shadcn/ui](https://ui.shadcn.com) + next-themes para la UI

## Desarrollo local

```bash
git clone https://github.com/JMFusterr/PickPal.git
cd PickPal
npm install
cp .env.example .env.local        # rellena las claves (ver más abajo)
npx convex dev                    # terminal 1 — sincroniza el backend
npm run dev                       # terminal 2 — arranca Next en :3000
```

## Variables de entorno

Necesitas cuentas (gratis) en cuatro servicios:

| Variable | De dónde | Notas |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | dashboard.clerk.com → API keys | Empieza por `pk_test_…` o `pk_live_…` |
| `CLERK_SECRET_KEY` | dashboard.clerk.com → API keys | Empieza por `sk_test_…` o `sk_live_…` |
| `CLERK_JWT_ISSUER_DOMAIN` | dashboard.clerk.com → JWT Templates → "convex" | URL del issuer |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | — | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | — | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | — | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | — | `/dashboard` |
| `NEXT_PUBLIC_CONVEX_URL` | `npx convex dev` lo rellena solo | URL del deployment Convex |
| `CONVEX_DEPLOYMENT` | `npx convex dev` lo rellena solo | Identificador del deployment |
| `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → Get API key | Free tier suficiente |

Convex también necesita `CLERK_JWT_ISSUER_DOMAIN` configurado en su dashboard (Settings → Environment Variables) para validar los tokens de Clerk.

Para crear el JWT template "convex" en Clerk, sigue [la guía oficial de Convex + Clerk](https://docs.convex.dev/auth/clerk).

## Despliegue

El proyecto está pensado para [Vercel](https://vercel.com) + Convex. Pasos:

1. Importa el repo en Vercel.
2. Pon todas las env vars de la tabla anterior en Settings → Environment Variables.
3. Cambia el build command a `npx convex deploy --cmd 'npm run build'` y añade `CONVEX_DEPLOY_KEY` (lo generas con `npx convex deploy` localmente).
4. Añade el dominio que te asigne Vercel a Clerk → Domains.

Cada `git push` a `main` dispara redeploy automático.

## Rate limiting

`/api/recommendations` está limitado a **10 generaciones por usuario y día (UTC)**. Esto protege la cuota gratuita de Gemini frente a abuso. El contador vive en la tabla `recommendationUsage` de Convex y se resetea al cambiar de día.

## Contribuir

Issues y PRs bienvenidos. Antes de abrir un PR grande, mejor abre una issue para discutirlo.

## Licencia

[MIT](LICENSE) © Jorge Fuster
