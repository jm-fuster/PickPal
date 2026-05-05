import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { validateDateInput } from "./validators";
import { checkAndIncrement } from "./rateLimit";
import { Doc, Id } from "./_generated/dataModel";

const CREATE_DATE_DAILY_LIMIT = 100;

function assertValidDate(month: number, day: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Mes inválido (1-12).");
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error("Día inválido (1-31).");
  }
}

async function assertOwnsPerson(
  ctx: { db: { get: (id: Id<"people">) => Promise<Doc<"people"> | null> } },
  personId: Id<"people">,
  clerkUserId: string,
): Promise<Doc<"people">> {
  const person = await ctx.db.get(personId);
  if (!person || person.clerkUserId !== clerkUserId) {
    throw new Error("Persona no encontrada.");
  }
  return person;
}

export const getByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);
    await assertOwnsPerson(ctx, personId, clerkUserId);
    return await ctx.db
      .query("importantDates")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .collect();
  },
});

export const getUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    const result: Array<{
      date: Doc<"importantDates">;
      person: Doc<"people">;
    }> = [];
    for (const person of people) {
      const dates = await ctx.db
        .query("importantDates")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .collect();
      for (const date of dates) {
        result.push({ date, person });
      }
    }

    const todayStart = new Date(Date.now());
    todayStart.setHours(0, 0, 0, 0);
    return result.filter(({ date }) => {
      if (date.recurring === false) {
        if (date.year === undefined) return false;
        const d = new Date(date.year, date.month - 1, date.day);
        d.setHours(23, 59, 59, 999);
        return d.getTime() >= todayStart.getTime();
      }
      return true;
    });
  },
});

export const create = mutation({
  args: {
    personId: v.id("people"),
    label: v.string(),
    month: v.number(),
    day: v.number(),
    year: v.optional(v.number()),
    recurring: v.optional(v.boolean()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);
    await assertOwnsPerson(ctx, args.personId, clerkUserId);
    assertValidDate(args.month, args.day);
    validateDateInput({ label: args.label, year: args.year, recurring: args.recurring, budgetMin: args.budgetMin, budgetMax: args.budgetMax });
    await checkAndIncrement(
      ctx,
      clerkUserId,
      "create_date",
      CREATE_DATE_DAILY_LIMIT,
    );
    return await ctx.db.insert("importantDates", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("importantDates"),
    label: v.optional(v.string()),
    month: v.optional(v.number()),
    day: v.optional(v.number()),
    year: v.optional(v.number()),
    recurring: v.optional(v.boolean()),
    budgetMin: v.optional(v.number()),
    budgetMax: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Fecha no encontrada.");
    await assertOwnsPerson(ctx, existing.personId, clerkUserId);
    if (patch.month !== undefined || patch.day !== undefined) {
      assertValidDate(
        patch.month ?? existing.month,
        patch.day ?? existing.day,
      );
    }
    const mergedRecurring = patch.recurring ?? existing.recurring;
    const mergedYear = patch.year ?? existing.year;
    validateDateInput({
      label: patch.label ?? existing.label,
      year: mergedYear,
      recurring: mergedRecurring,
      budgetMin: patch.budgetMin ?? existing.budgetMin,
      budgetMax: patch.budgetMax ?? existing.budgetMax,
    });
    await ctx.db.patch(id, patch);
  },
});

export const getByPersonAndLabel = query({
  args: { personId: v.id("people"), label: v.string() },
  handler: async (ctx, { personId, label }) => {
    const clerkUserId = await requireUser(ctx);
    await assertOwnsPerson(ctx, personId, clerkUserId);
    const dates = await ctx.db
      .query("importantDates")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .collect();
    return dates.find((d) => d.label === label) ?? null;
  },
});

export const remove = mutation({
  args: { id: v.id("importantDates") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Fecha no encontrada.");
    await assertOwnsPerson(ctx, existing.personId, clerkUserId);
    await ctx.db.delete(id);
  },
});
