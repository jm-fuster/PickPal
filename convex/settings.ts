import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";

export const DEFAULT_NOTIFY_DAYS_BEFORE = 30;
export const DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE = 7;

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    return {
      notifyDaysBefore: existing?.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
      emailNotificationsEnabled: existing?.emailNotificationsEnabled ?? false,
      emailNotifyDaysBefore:
        existing?.emailNotifyDaysBefore ?? DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE,
      email: existing?.email ?? identity?.email ?? null,
    };
  },
});

export const setMine = mutation({
  args: {
    notifyDaysBefore: v.optional(v.number()),
    emailNotificationsEnabled: v.optional(v.boolean()),
    emailNotifyDaysBefore: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { notifyDaysBefore, emailNotificationsEnabled, emailNotifyDaysBefore },
  ) => {
    if (notifyDaysBefore !== undefined) {
      if (
        !Number.isInteger(notifyDaysBefore) ||
        notifyDaysBefore < 1 ||
        notifyDaysBefore > 365
      ) {
        throw new Error("Días de aviso fuera de rango (1–365).");
      }
    }
    if (emailNotifyDaysBefore !== undefined) {
      if (
        !Number.isInteger(emailNotifyDaysBefore) ||
        emailNotifyDaysBefore < 1 ||
        emailNotifyDaysBefore > 365
      ) {
        throw new Error("Días de antelación del correo fuera de rango (1–365).");
      }
    }

    const clerkUserId = await requireUser(ctx);
    const identity = await ctx.auth.getUserIdentity();

    if (emailNotificationsEnabled === true && !identity?.email) {
      throw new Error(
        "No encontramos tu email. Verifícalo en tu cuenta para activar las notificaciones.",
      );
    }

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    const patch: {
      notifyDaysBefore?: number;
      emailNotificationsEnabled?: boolean;
      emailNotifyDaysBefore?: number;
      email?: string;
    } = {};
    if (notifyDaysBefore !== undefined) patch.notifyDaysBefore = notifyDaysBefore;
    if (emailNotificationsEnabled !== undefined) {
      patch.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (emailNotifyDaysBefore !== undefined) {
      patch.emailNotifyDaysBefore = emailNotifyDaysBefore;
    }
    if (identity?.email) patch.email = identity.email;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userSettings", {
        clerkUserId,
        notifyDaysBefore: patch.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
        emailNotificationsEnabled: patch.emailNotificationsEnabled,
        emailNotifyDaysBefore: patch.emailNotifyDaysBefore,
        email: patch.email,
      });
    }
  },
});
