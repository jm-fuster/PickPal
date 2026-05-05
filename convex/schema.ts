import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  people: defineTable({
    clerkUserId: v.string(),
    name: v.string(),
    relationship: v.string(),
    interests: v.array(v.string()),
    notes: v.optional(v.string()),
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
  }).index("by_user", ["clerkUserId"]),

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
        category: v.string(),
        amazonQuery: v.string(),
      }),
    ),
    discardedTitles: v.optional(v.array(v.string())),
  })
    .index("by_user_person_occasion_type", [
      "clerkUserId",
      "personId",
      "occasionLabel",
      "giftType",
    ])
    .index("by_person", ["personId"]),

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
