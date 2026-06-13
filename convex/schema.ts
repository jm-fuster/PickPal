import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Foto de stock (Pexels) adjuntada server-side a una idea. Opcional en todos
// los documentos: sin foto, la card usa la cabecera de icono (imageKey).
const ideaImageValidator = v.object({
  url: v.string(),
  photographer: v.optional(v.string()),
  photographerUrl: v.optional(v.string()),
});

export default defineSchema({
  people: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    relationship: v.string(),
    interests: v.array(v.string()),
    favoriteBrands: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
    shoeSize: v.optional(v.string()),
    clothingSize: v.optional(v.string()),
    allergies: v.optional(v.string()),
    dislikes: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_user", ["clerkUserId"]),

  importantDates: defineTable({
    personId: v.id("people"),
    label: v.string(),
    month: v.number(),
    day: v.number(),
    year: v.optional(v.number()),
    recurring: v.optional(v.boolean()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
  }).index("by_person", ["personId"]),

  userSettings: defineTable({
    clerkUserId: v.string(),
    notifyDaysBefore: v.number(),
    emailNotificationsEnabled: v.optional(v.boolean()),
    // Backward-compat: docs anteriores a la migración a multi-trigger guardan
    // un único número. Nuevos docs guardan un array. Los lectores normalizan.
    emailNotifyDaysBefore: v.optional(
      v.union(v.number(), v.array(v.number())),
    ),
    email: v.optional(v.string()),
    favoriteStores: v.optional(v.array(v.string())),
  }).index("by_user", ["clerkUserId"]),

  emailNotifications: defineTable({
    clerkUserId: v.string(),
    importantDateId: v.id("importantDates"),
    occurrenceYear: v.number(),
    // Antelación con la que se envió este aviso (0/2/7/14). Optional para
    // documentos previos a la migración multi-trigger; los nuevos siempre lo
    // tienen. La dedupe se hace por (dateId, year, leadDays).
    leadDays: v.optional(v.number()),
    sentAt: v.number(),
  })
    .index("by_date_year", ["importantDateId", "occurrenceYear"])
    .index("by_date_year_lead", [
      "importantDateId",
      "occurrenceYear",
      "leadDays",
    ])
    .index("by_user", ["clerkUserId"]),

  recommendationUsage: defineTable({
    clerkUserId: v.string(),
    day: v.string(), // "YYYY-MM-DD" en UTC
    count: v.number(),
  }).index("by_user_day", ["clerkUserId", "day"]),

  rateLimitBuckets: defineTable({
    clerkUserId: v.string(),
    day: v.string(), // "YYYY-MM-DD" en UTC
    bucket: v.string(), // p.ej. "create_person", "create_date"
    count: v.number(),
  }).index("by_user_day_bucket", ["clerkUserId", "day", "bucket"]),

  recommendations: defineTable({
    clerkUserId: v.string(),
    personId: v.id("people"),
    occasionLabel: v.string(),
    giftType: v.string(),
    ideas: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        priceMinEuros: v.number(),
        priceMaxEuros: v.number(),
        category: v.union(v.string(), v.array(v.string())),
        amazonQuery: v.string(),
        suggestedStores: v.optional(v.array(v.string())),
        // Clave del catálogo visual de la card (allowlist en validators.ts).
        // Opcional: las ideas generadas antes de este campo no lo tienen.
        imageKey: v.optional(v.string()),
        image: v.optional(ideaImageValidator),
      }),
    ),
    discardedTitles: v.optional(v.array(v.string())),
    dislikedCategories: v.optional(v.array(v.string())),
  })
    .index("by_user_person_occasion_type", [
      "clerkUserId",
      "personId",
      "occasionLabel",
      "giftType",
    ])
    .index("by_person", ["personId"]),

  savedIdeas: defineTable({
    clerkUserId: v.string(),
    personId: v.id("people"),
    occasionLabel: v.string(),
    title: v.string(),
    description: v.string(),
    priceMinEuros: v.number(),
    priceMaxEuros: v.number(),
    category: v.union(v.string(), v.array(v.string())),
    amazonQuery: v.string(),
    suggestedStores: v.optional(v.array(v.string())),
    // Tipo de regalo (fisica/experiencia/tiempo-juntos/sorprendeme). Opcional:
    // los documentos guardados antes de este campo no lo tienen y se tratan
    // como físicos (fallback) en la UI.
    giftType: v.optional(v.string()),
    // Clave del catálogo visual (allowlist en validators.ts). Opcional: las
    // ideas guardadas antes de este campo caen al fallback por tipo de regalo.
    imageKey: v.optional(v.string()),
    image: v.optional(ideaImageValidator),
  })
    .index("by_person", ["personId"])
    .index("by_user", ["clerkUserId"]),

  giftHistory: defineTable({
    clerkUserId: v.string(),
    personId: v.id("people"),
    giftName: v.string(),
    occasionLabel: v.string(),
    year: v.optional(v.number()),
    reaction: v.union(
      v.literal("loved"),
      v.literal("ok"),
      v.literal("bad"),
    ),
    notes: v.optional(v.string()),
  }).index("by_person", ["personId"]),
});
