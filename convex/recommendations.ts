import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./auth";

const ideaValidator = v.object({
  title: v.string(),
  description: v.string(),
  priceMinEuros: v.number(),
  priceMaxEuros: v.number(),
  category: v.string(),
  amazonQuery: v.string(),
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
    ideaIndex: v.number(),
  },
  handler: async (ctx, { personId, occasionLabel, giftType, ideaIndex }) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
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

    if (ideaIndex < 0 || ideaIndex >= existing.ideas.length) {
      throw new Error("Índice de idea fuera de rango.");
    }

    await ctx.db.patch(existing._id, {
      ideas: existing.ideas.filter((_, i) => i !== ideaIndex),
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

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
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
