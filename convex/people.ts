import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { validatePersonInput } from "./validators";
import { checkAndIncrement } from "./rateLimit";

const CREATE_PERSON_DAILY_LIMIT = 50;

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
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
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
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
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
      budgetMin: merged.budgetMin,
      budgetMax: merged.budgetMax,
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
    const dates = await ctx.db
      .query("importantDates")
      .withIndex("by_person", (q) => q.eq("personId", id))
      .collect();
    for (const d of dates) {
      await ctx.db.delete(d._id);
    }
    await ctx.db.delete(id);
  },
});
