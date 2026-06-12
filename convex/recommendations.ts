import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireUser } from "./auth";
import {
  validateRecommendationIdeas,
  validateRecommendationKey,
} from "./validators";

const ideaValidator = v.object({
  title: v.string(),
  description: v.string(),
  priceMinEuros: v.number(),
  priceMaxEuros: v.number(),
  category: v.union(v.string(), v.array(v.string())),
  amazonQuery: v.string(),
  suggestedStores: v.optional(v.array(v.string())),
  imageKey: v.optional(v.string()),
  // Foto de stock Pexels; prefijo de URL verificado en validateRecommendationIdeas.
  image: v.optional(
    v.object({
      url: v.string(),
      photographer: v.optional(v.string()),
      photographerUrl: v.optional(v.string()),
    }),
  ),
});

export const getByPersonOccasion = query({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    giftType: v.string(),
  },
  handler: async (ctx, { personId, occasionLabel, giftType }) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) return null;

    return ctx.db
      .query("recommendations")
      .withIndex("by_user_person_occasion_type", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("personId", personId)
          .eq("occasionLabel", occasionLabel)
          .eq("giftType", giftType),
      )
      .unique();
  },
});

export const removeIdea = mutation({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    giftType: v.string(),
    ideaTitle: v.string(),
    ideaCategories: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { personId, occasionLabel, giftType, ideaTitle, ideaCategories }) => {
    const clerkUserId = await requireUser(ctx);
    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) throw new ConvexError("No autorizado");
    // Caps espejo de los tamaños que genera la app; sin ellos un cliente
    // directo puede inflar el documento con strings arbitrarios.
    if (
      ideaTitle.length > 80 ||
      occasionLabel.length > 40 ||
      giftType.length > 20
    ) {
      throw new ConvexError("Parámetros inválidos.");
    }
    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_user_person_occasion_type", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("personId", personId)
          .eq("occasionLabel", occasionLabel)
          .eq("giftType", giftType),
      )
      .unique();
    if (!existing) return;

    const MAX_DISLIKED = 100;
    const newCats = (ideaCategories ?? []).filter((c) => c.trim().length > 0 && c.length <= 40);
    const merged =
      newCats.length > 0
        ? [...new Set([...(existing.dislikedCategories ?? []), ...newCats])].slice(0, MAX_DISLIKED)
        : existing.dislikedCategories;

    await ctx.db.patch(existing._id, {
      ideas: existing.ideas.filter((idea) => idea.title !== ideaTitle),
      // Acotado a los últimos 200: evita que el array crezca sin límite
      // hacia el cap de tamaño de documento de Convex.
      discardedTitles: [...(existing.discardedTitles ?? []), ideaTitle].slice(-200),
      dislikedCategories: merged,
    });
  },
});

export const upsert = mutation({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    giftType: v.string(),
    ideas: v.array(ideaValidator),
  },
  handler: async (ctx, { personId, occasionLabel, giftType, ideas }) => {
    const clerkUserId = await requireUser(ctx);

    validateRecommendationKey(occasionLabel, giftType);
    validateRecommendationIdeas(ideas);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new ConvexError("Persona no encontrada.");
    }

    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_user_person_occasion_type", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("personId", personId)
          .eq("occasionLabel", occasionLabel)
          .eq("giftType", giftType),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ideas });
    } else {
      await ctx.db.insert("recommendations", {
        clerkUserId,
        personId,
        occasionLabel,
        giftType,
        ideas,
      });
    }
  },
});
