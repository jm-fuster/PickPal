import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const DEFAULT_NOTIFY_DAYS_BEFORE = 30;

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    return {
      notifyDaysBefore: existing?.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
    };
  },
});

export const setMine = mutation({
  args: {
    notifyDaysBefore: v.number(),
  },
  handler: async (ctx, { notifyDaysBefore }) => {
    if (
      !Number.isInteger(notifyDaysBefore) ||
      notifyDaysBefore < 1 ||
      notifyDaysBefore > 365
    ) {
      throw new Error("Días de aviso fuera de rango (1–365).");
    }
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { notifyDaysBefore });
    } else {
      await ctx.db.insert("userSettings", { clerkUserId, notifyDaysBefore });
    }
  },
});
