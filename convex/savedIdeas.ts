import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireUser } from "./auth";
import { checkAndIncrement } from "./rateLimit";
import { validateSavedIdeaInput } from "./validators";

export const getByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);
    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) return [];
    return ctx.db
      .query("savedIdeas")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .order("desc")
      .take(200);
  },
});

export const save = mutation({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    title: v.string(),
    description: v.string(),
    priceMinEuros: v.number(),
    priceMaxEuros: v.number(),
    category: v.union(v.string(), v.array(v.string())),
    amazonQuery: v.string(),
    suggestedStores: v.optional(v.array(v.string())),
    giftType: v.optional(
      v.union(
        v.literal("fisica"),
        v.literal("experiencia"),
        v.literal("tiempo-juntos"),
        v.literal("sorprendeme"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);
    const person = await ctx.db.get(args.personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new ConvexError("No autorizado");
    }
    validateSavedIdeaInput(args);
    // Dedupe server-side: guardar dos veces la misma idea para la misma
    // ocasión (doble clic, doble pestaña) no crea una segunda fila ni
    // consume rate limit.
    const existing = await ctx.db
      .query("savedIdeas")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    const duplicate = existing.find(
      (s) => s.title === args.title && s.occasionLabel === args.occasionLabel,
    );
    if (duplicate) return duplicate._id;
    await checkAndIncrement(ctx, clerkUserId, "save_idea", 50);
    return ctx.db.insert("savedIdeas", { clerkUserId, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id("savedIdeas") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const entry = await ctx.db.get(id);
    if (!entry || entry.clerkUserId !== clerkUserId) {
      throw new ConvexError("No autorizado");
    }
    await ctx.db.delete(id);
  },
});
