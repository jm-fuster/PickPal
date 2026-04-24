# Tech Stack

## Resumen

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 14+ App Router + TypeScript | Full-stack, SSR, file-based routing |
| Auth | Clerk | Auth completo out-of-the-box, UI lista, webhooks |
| Base de datos | Convex | Reactivo en tiempo real, sin servidor, schema TypeScript |
| IA | AI SDK (Vercel) + Gemini `gemini-2.0-flash` | Abstracción unificada, `generateObject` valida con Zod |
| UI | Tailwind CSS + shadcn/ui | Componentes accesibles y personalizables |
| Links compra | URLs de búsqueda Amazon generadas | Sin API key, funcional de inmediato |

## Dependencias

```bash
# Proyecto base
npx create-next-app@latest gift-reminder --typescript --tailwind --app --src-dir

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

## Decisiones técnicas relevantes

- **Convex en lugar de Prisma + SQLite:** Convex es reactivo por defecto — las queries se actualizan en tiempo real sin polling. Además, el schema está tipado en TypeScript nativo, lo que elimina la capa ORM.
- **Clerk en lugar de NextAuth:** Clerk ofrece UI de login/registro lista, gestión de usuarios en dashboard propio, y webhooks para sincronizar con Convex sin implementar lógica de sesiones a mano.
- **AI SDK + Gemini en lugar de Anthropic SDK directo:** `generateObject` del AI SDK garantiza que la respuesta cumple el schema Zod sin parsing manual. Cambiar de modelo (Gemini → Claude → GPT) es un cambio de una línea.
- **URLs Amazon sin API:** La Amazon Product Advertising API requiere cuenta de afiliado con ventas previas. Las URLs de búsqueda (`amazon.es/s?k=...`) funcionan sin autenticación y producen resultados relevantes si el modelo genera queries específicas.
