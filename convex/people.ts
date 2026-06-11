import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { requireUser } from "./auth";
import { validatePersonInput } from "./validators";
import { checkAndIncrement } from "./rateLimit";

const CREATE_PERSON_DAILY_LIMIT = 50;

/**
 * Borra todos los recursos anidados de una persona (fechas, historial,
 * recomendaciones e ideas guardadas) y después la propia persona.
 * Compartido entre `people.remove` y `account.deleteMyAccount` para que
 * ningún camino de borrado deje filas huérfanas.
 */
export async function deletePersonCascade(
  ctx: MutationCtx,
  personId: Id<"people">,
) {
  const dates = await ctx.db
    .query("importantDates")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  for (const d of dates) await ctx.db.delete(d._id);

  const history = await ctx.db
    .query("giftHistory")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  for (const h of history) await ctx.db.delete(h._id);

  const recs = await ctx.db
    .query("recommendations")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  for (const r of recs) await ctx.db.delete(r._id);

  const saved = await ctx.db
    .query("savedIdeas")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  for (const s of saved) await ctx.db.delete(s._id);

  await ctx.db.delete(personId);
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    return await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const person = await ctx.db.get(id);
    if (!person || person.clerkUserId !== clerkUserId) {
      return null;
    }
    return person;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    relationship: v.string(),
    interests: v.array(v.string()),
    notes: v.optional(v.string()),
    shoeSize: v.optional(v.string()),
    clothingSize: v.optional(v.string()),
    allergies: v.optional(v.string()),
    dislikes: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);
    validatePersonInput(args);
    await checkAndIncrement(
      ctx,
      clerkUserId,
      "create_person",
      CREATE_PERSON_DAILY_LIMIT,
    );
    return await ctx.db.insert("people", { ...args, clerkUserId });
  },
});

export const update = mutation({
  args: {
    id: v.id("people"),
    name: v.optional(v.string()),
    relationship: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    shoeSize: v.optional(v.string()),
    clothingSize: v.optional(v.string()),
    allergies: v.optional(v.string()),
    dislikes: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
    }
    const merged = { ...existing, ...patch };
    validatePersonInput({
      name: merged.name,
      relationship: merged.relationship,
      interests: merged.interests,
      notes: merged.notes,
      shoeSize: merged.shoeSize,
      clothingSize: merged.clothingSize,
      allergies: merged.allergies,
      dislikes: merged.dislikes,
      avatarUrl: merged.avatarUrl,
    });
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
    }
    await deletePersonCascade(ctx, id);
  },
});
