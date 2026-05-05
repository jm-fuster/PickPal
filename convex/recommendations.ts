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
  },
  handler: async (ctx, { personId, occasionLabel }) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) return null;

    return ctx.db
      .query("recommendations")
      .withIndex("by_user_person_occasion", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("personId", personId)
          .eq("occasionLabel", occasionLabel),
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    ideas: v.array(ideaValidator),
  },
  handler: async (ctx, { personId, occasionLabel, ideas }) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
    }

    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_user_person_occasion", (q) =>
        q
          .eq("clerkUserId", clerkUserId)
          .eq("personId", personId)
          .eq("occasionLabel", occasionLabel),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ideas });
    } else {
      await ctx.db.insert("recommendations", {
        clerkUserId,
        personId,
        occasionLabel,
        ideas,
      });
    }
  },
});
