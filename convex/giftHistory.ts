import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./auth";

const MAX_GIFT_NAME = 120;
const MAX_OCCASION = 40;
const MAX_NOTES = 500;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const ALLOWED_REACTIONS = ["loved", "ok", "bad"] as const;

export const getByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(personId);
    if (!person || person.clerkUserId !== clerkUserId) return [];

    return ctx.db
      .query("giftHistory")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    personId: v.id("people"),
    giftName: v.string(),
    occasionLabel: v.string(),
    year: v.optional(v.number()),
    reaction: v.union(v.literal("loved"), v.literal("ok"), v.literal("bad")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);

    const person = await ctx.db.get(args.personId);
    if (!person || person.clerkUserId !== clerkUserId) {
      throw new Error("Persona no encontrada.");
    }

    const name = args.giftName.trim();
    if (name.length === 0) throw new Error("El nombre del regalo es obligatorio.");
    if (name.length > MAX_GIFT_NAME) throw new Error("Nombre del regalo demasiado largo.");

    const occasion = args.occasionLabel.trim();
    if (occasion.length === 0) throw new Error("La ocasión es obligatoria.");
    if (occasion.length > MAX_OCCASION) throw new Error("Ocasión demasiado larga.");

    if (args.notes !== undefined && args.notes.length > MAX_NOTES) {
      throw new Error("Notas demasiado largas.");
    }
    if (args.year !== undefined) {
      if (!Number.isInteger(args.year) || args.year < MIN_YEAR || args.year > MAX_YEAR) {
        throw new Error("Año inválido.");
      }
    }
    if (!ALLOWED_REACTIONS.includes(args.reaction)) {
      throw new Error("Reacción inválida.");
    }

    await ctx.db.insert("giftHistory", {
      clerkUserId,
      personId: args.personId,
      giftName: name,
      occasionLabel: occasion,
      year: args.year,
      reaction: args.reaction,
      notes: args.notes,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("giftHistory"),
    giftName: v.string(),
    occasionLabel: v.string(),
    year: v.optional(v.number()),
    reaction: v.union(v.literal("loved"), v.literal("ok"), v.literal("bad")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const clerkUserId = await requireUser(ctx);
    const entry = await ctx.db.get(id);
    if (!entry || entry.clerkUserId !== clerkUserId) {
      throw new Error("Entrada no encontrada.");
    }

    const name = fields.giftName.trim();
    if (name.length === 0) throw new Error("El nombre del regalo es obligatorio.");
    if (name.length > MAX_GIFT_NAME) throw new Error("Nombre del regalo demasiado largo.");

    const occasion = fields.occasionLabel.trim();
    if (occasion.length === 0) throw new Error("La ocasión es obligatoria.");
    if (occasion.length > MAX_OCCASION) throw new Error("Ocasión demasiado larga.");

    if (fields.notes !== undefined && fields.notes.length > MAX_NOTES) {
      throw new Error("Notas demasiado largas.");
    }
    if (fields.year !== undefined) {
      if (!Number.isInteger(fields.year) || fields.year < MIN_YEAR || fields.year > MAX_YEAR) {
        throw new Error("Año inválido.");
      }
    }

    await ctx.db.patch(id, { ...fields, giftName: name, occasionLabel: occasion });
  },
});

export const remove = mutation({
  args: { id: v.id("giftHistory") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const entry = await ctx.db.get(id);
    if (!entry || entry.clerkUserId !== clerkUserId) {
      throw new Error("Entrada no encontrada.");
    }
    await ctx.db.delete(id);
  },
});
