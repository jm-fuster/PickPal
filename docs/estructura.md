# Estructura del proyecto

```
pickpal/
├── convex/                                     # backend Convex (BD + lógica servidor)
│   ├── schema.ts                               # definición de tablas
│   ├── people.ts                               # queries y mutations de personas
│   ├── importantDates.ts                       # queries y mutations de fechas
│   ├── settings.ts                             # userSettings (aviso UI + email)
│   ├── notifications.ts                        # internal: events que disparan email hoy
│   ├── emails.ts                               # internal: envío vía Resend + cron orchestrator
│   ├── crons.ts                                # cron diario 08:00 UTC para emails
│   └── _generated/                             # auto-generado por Convex CLI
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                          # ClerkProvider + ConvexProvider
│   │   ├── page.tsx                            # landing page pública
│   │   │
│   │   ├── (auth)/                             # rutas públicas de auth
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   │
│   │   ├── (app)/                              # rutas protegidas por Clerk
│   │   │   ├── layout.tsx                      # sidebar + navbar compartidos
│   │   │   ├── dashboard/page.tsx              # fechas próximas
│   │   │   ├── people/
│   │   │   │   ├── page.tsx                    # grid de personas
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [personId]/
│   │   │   │       ├── page.tsx                # detalle + fechas
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── gifts/page.tsx          # recomendaciones IA
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/
│   │       └── recommendations/route.ts        # llama a Gemini via AI SDK
│   │
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui (auto-generados)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── NotificationBell.tsx            # badge con fechas próximas
│   │   ├── people/
│   │   │   ├── PersonForm.tsx                  # formulario compartido create/edit
│   │   │   ├── InterestTagInput.tsx            # input de intereses con tags
│   │   │   └── ImportantDateForm.tsx           # añadir/editar una fecha
│   │   └── gifts/
│   │       └── GiftRecommendationCard.tsx      # tarjeta de cada idea de regalo
│   │
│   ├── lib/
│   │   ├── stores.ts                           # generateStoreSearchUrl(store, query) para Amazon/AliExpress/Miravia/El Corte Inglés
│   │   └── dates.ts                            # computeDaysUntilNextOccurrence()
│   │
│   └── types/index.ts                          # tipos TypeScript compartidos
│
├── middleware.ts                               # clerkMiddleware — protege /app/**
└── .env.local
```

## Schema de base de datos (Convex)

```typescript
// convex/schema.ts
export default defineSchema({
  people: defineTable({
    clerkUserId: v.string(),           // vincula persona al usuario de Clerk
    name: v.string(),
    relationship: v.string(),          // friend | family | partner | colleague | other
    interests: v.array(v.string()),    // ["senderismo", "libros", "café"]
    notes: v.optional(v.string()),     // situación, preferencias, restricciones
    budgetMin: v.optional(v.number()), // en céntimos (2500 = 25€)
    budgetMax: v.optional(v.number()),
  }).index("by_user", ["clerkUserId"]),

  importantDates: defineTable({
    personId: v.id("people"),
    label: v.string(),                 // "Cumpleaños" | "Aniversario" | personalizado
    month: v.number(),                 // 1–12
    day: v.number(),                   // 1–31
    year: v.optional(v.number()),      // null = recurrente cada año
  }).index("by_person", ["personId"]),

  userSettings: defineTable({
    clerkUserId: v.string(),
    notifyDaysBefore: v.number(),                    // ventana visual (campanita / dashboard)
    emailNotificationsEnabled: v.optional(v.boolean()),
    emailNotifyDaysBefore: v.optional(v.number()),   // gatillo del correo
    email: v.optional(v.string()),                   // copia local del email Clerk
  }).index("by_user", ["clerkUserId"]),

  emailNotifications: defineTable({
    clerkUserId: v.string(),
    importantDateId: v.id("importantDates"),
    occurrenceYear: v.number(),                      // dedup por año concreto del evento
    sentAt: v.number(),
  })
    .index("by_date_year", ["importantDateId", "occurrenceYear"])
    .index("by_user", ["clerkUserId"]),
})
```

**Decisiones de diseño:**
- `interests` es un array nativo de Convex — no hace falta serializar a JSON como en SQLite.
- Las fechas almacenan solo `month + day` para gestionar la recurrencia anual sin cálculos complejos.
- `year` es opcional: cuando está presente indica un evento puntual (ej: graduación 2025); cuando es `null`, la fecha se repite cada año.
- Budget en céntimos (enteros) para evitar problemas con decimales en cálculos.
- `userSettings` lleva dos "días de aviso" separados: `notifyDaysBefore` para la ventana visual y `emailNotifyDaysBefore` para el gatillo del email. Razonamiento detallado en [`docs/email-notifications.md`](email-notifications.md).
- `emailNotifications` deduplica por `(importantDateId, occurrenceYear)` para no enviar el mismo aniversario dos veces el mismo año.
