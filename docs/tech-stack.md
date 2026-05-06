# Tech Stack

## Resumen

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 14+ App Router + TypeScript | Full-stack, SSR, file-based routing |
| Auth | Clerk | Auth completo out-of-the-box, UI lista, webhooks |
| Base de datos | Convex | Reactivo en tiempo real, sin servidor, schema TypeScript |
| IA | AI SDK (Vercel) + Gemini `gemini-2.5-flash` | Abstracción unificada, `generateObject` valida con Zod. En free tier de Google AI Studio. |
| Email | Resend (REST API directa, sin SDK) | Free tier 3.000/mes. Llamado desde un cron diario en Convex. Detalle en [`email-notifications.md`](email-notifications.md). |
| UI | Tailwind CSS + shadcn/ui | Componentes accesibles y personalizables |
| Links compra | URLs de búsqueda Amazon generadas | Sin API key, funcional de inmediato |

## Dependencias

```bash
# Proyecto base
npx create-next-app@latest pickpal --typescript --tailwind --app --src-dir

# Auth + BD
npm install @clerk/nextjs convex

# IA
npm install ai @ai-sdk/google

# Formularios y validación
npm install zod react-hook-form @hookform/resolvers

# UI components
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog select textarea avatar
```

## Variables de entorno (`.env.local`)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Google Gemini (AI SDK)
GOOGLE_GENERATIVE_AI_API_KEY=AI...
```

### Variables del entorno de Convex (no de Next.js)

Estas las consume el backend (cron de emails). Se setean con `npx convex env set ...` (añade `--prod` para el deployment de producción):

```bash
RESEND_API_KEY=re_...                          # API key de Resend, server-only
EMAIL_FROM="PickPal <onboarding@resend.dev>"   # opcional; sandbox por defecto
CLERK_JWT_ISSUER_DOMAIN=https://...clerk.accounts.dev   # mismo issuer que en Next.js
```

## Decisiones técnicas relevantes

- **Convex en lugar de Prisma + SQLite:** Convex es reactivo por defecto — las queries se actualizan en tiempo real sin polling. Además, el schema está tipado en TypeScript nativo, lo que elimina la capa ORM.
- **Clerk en lugar de NextAuth:** Clerk ofrece UI de login/registro lista, gestión de usuarios en dashboard propio, y webhooks para sincronizar con Convex sin implementar lógica de sesiones a mano.
- **AI SDK + Gemini en lugar de Anthropic SDK directo:** `generateObject` del AI SDK garantiza que la respuesta cumple el schema Zod sin parsing manual. Cambiar de modelo (Gemini → Claude → GPT) es un cambio de una línea.
- **URLs Amazon sin API:** La Amazon Product Advertising API requiere cuenta de afiliado con ventas previas. Las URLs de búsqueda (`amazon.es/s?k=...`) funcionan sin autenticación y producen resultados relevantes si el modelo genera queries específicas.
- **Resend sin SDK:** llamamos a `https://api.resend.com/emails` con `fetch` directo. Una dependencia menos y la API es trivial (un POST con JSON). Si el día de mañana hace falta features avanzadas (attachments, idempotency keys, etc.), se añade `resend` y listo.
