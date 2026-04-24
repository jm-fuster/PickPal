# Gift Reminder App

App web para recordar fechas importantes y recibir recomendaciones de regalos personalizadas con IA.

## Concepto

El usuario crea perfiles de personas (amigos, familia, pareja) con:
- Fechas importantes: cumpleaños, aniversarios, graduaciones, etc.
- Intereses y aficiones
- Notas sobre su situación (presupuesto, preferencias, restricciones)

Cuando se acerca una fecha, la app avisa y genera recomendaciones de regalos adaptadas al perfil, con enlaces directos a Amazon para comprar.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14+ App Router + TypeScript |
| Auth | Clerk |
| Base de datos | Convex |
| IA | AI SDK (Vercel) + Gemini (`gemini-2.0-flash`) |
| UI | Tailwind CSS + shadcn/ui |
| Links compra | URLs de búsqueda Amazon (sin API key) |

## Estructura del proyecto

```
gift-reminder/
├── convex/
│   ├── schema.ts          # definición de tablas
│   ├── people.ts          # queries/mutations de personas
│   ├── importantDates.ts  # queries/mutations de fechas
│   └── _generated/        # auto-generado por Convex
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # ClerkProvider + ConvexProvider
│   │   ├── page.tsx                            # landing pública
│   │   ├── (auth)/
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (app)/                              # rutas protegidas por Clerk
│   │   │   ├── layout.tsx                      # sidebar + navbar
│   │   │   ├── dashboard/page.tsx              # fechas próximas
│   │   │   ├── people/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [personId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── gifts/page.tsx          # recomendaciones IA
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       └── recommendations/route.ts        # llama a Gemini via AI SDK
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/NotificationBell.tsx
│   │   ├── people/PersonForm.tsx
│   │   ├── people/InterestTagInput.tsx
│   │   ├── people/ImportantDateForm.tsx
│   │   └── gifts/GiftRecommendationCard.tsx
│   ├── lib/
│   │   ├── amazon.ts      # generateAmazonUrl(query)
│   │   └── dates.ts       # computeDaysUntilNextOccurrence(month, day, from)
│   └── types/index.ts
├── middleware.ts           # clerkMiddleware — protege rutas (app)
└── .env.local
```

## Schema de base de datos (Convex)

```typescript
// convex/schema.ts
export default defineSchema({
  people: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    relationship: v.string(),          // friend | family | partner | colleague | other
    interests: v.array(v.string()),    // ["senderismo", "libros", "café"]
    notes: v.optional(v.string()),
    budgetMin: v.optional(v.number()), // en céntimos
    budgetMax: v.optional(v.number()),
    photoUrl: v.optional(v.string()),
  }).index("by_user", ["clerkUserId"]),

  importantDates: defineTable({
    personId: v.id("people"),
    label: v.string(),               // "Cumpleaños" | "Aniversario" | personalizado
    month: v.number(),               // 1-12
    day: v.number(),                 // 1-31
    year: v.optional(v.number()),    // null = recurrente cada año
  }).index("by_person", ["personId"]),
})
```

## Integración IA — AI SDK + Gemini

`POST /api/recommendations` recibe `personId` + `occasionLabel`, busca los datos de la persona en Convex y llama a Gemini via `generateObject`:

```typescript
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const { object } = await generateObject({
  model: google("gemini-2.0-flash"),
  schema: z.object({
    recommendations: z.array(z.object({
      title: z.string(),
      description: z.string(),
      priceRange: z.string(),
      category: z.enum(["Experiencia","Tech","Libros","Moda","Comida","Bienestar","Hogar","Hobby","Suscripción"]),
      amazonSearchQuery: z.string(),
      reasoningNote: z.string(),
    })).length(6),
  }),
  prompt: buildGiftPrompt(person, occasionLabel),
})
```

`generateObject` valida la respuesta contra el schema Zod automáticamente — no hay parsing manual.

## URLs de Amazon

```typescript
// src/lib/amazon.ts
export function generateAmazonUrl(query: string): string {
  return `https://www.amazon.es/s?${new URLSearchParams({ k: query })}`
}
```

Sin API key. El modelo genera un `amazonSearchQuery` específico (ej: `"cuaderno punteado cuero A5"`) que produce resultados relevantes.

## Notificaciones

Convex tiene queries reactivas — no hay polling manual ni cron jobs.

`NotificationBell` usa `useQuery(api.importantDates.getUpcoming, { daysBefore: 7 })`, que se recalcula en tiempo real. La lógica de recurrencia anual:

```typescript
// src/lib/dates.ts
export function computeDaysUntilNextOccurrence(month: number, day: number, from: Date): number {
  const year = from.getFullYear()
  let candidate = new Date(year, month - 1, day)
  if (candidate <= from) candidate = new Date(year + 1, month - 1, day)
  return Math.ceil((candidate.getTime() - from.getTime()) / 86_400_000)
}
```

## Variables de entorno

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

## Orden de desarrollo

1. Scaffolding: `create-next-app` + deps + Clerk + Convex
2. Auth: páginas sign-in/sign-up + `middleware.ts`
3. Schema Convex + queries/mutations básicas
4. CRUD de personas (formulario + lista + detalle + editar + borrar)
5. Dashboard con filtro 30/60/90 días + NotificationBell
6. Recomendaciones IA: ruta API + tarjetas + links Amazon
7. Settings + polish + landing page

## Dependencias principales

```bash
npx create-next-app@latest gift-reminder --typescript --tailwind --app --src-dir
npm install @clerk/nextjs convex
npm install ai @ai-sdk/google
npm install zod react-hook-form @hookform/resolvers
npx shadcn@latest init
npx shadcn@latest add button card input badge dialog select textarea avatar
```
