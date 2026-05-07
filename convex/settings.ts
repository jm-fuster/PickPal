import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { ALLOWED_STORES, type AllowedStore } from "./validators";

export const DEFAULT_NOTIFY_DAYS_BEFORE = 30;
export const DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE = 14;
export const DEFAULT_EMAIL_NOTIFICATIONS_ENABLED = true;

export const DEFAULT_FAVORITE_STORES: readonly AllowedStore[] = ALLOWED_STORES;

function sanitizeStores(stores: readonly string[]): AllowedStore[] {
  const seen = new Set<AllowedStore>();
  for (const s of stores) {
    if ((ALLOWED_STORES as readonly string[]).includes(s)) {
      seen.add(s as AllowedStore);
    }
  }
  return ALLOWED_STORES.filter((s) => seen.has(s));
}

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();
    const storedStores = existing?.favoriteStores;
    const favoriteStores =
      storedStores && storedStores.length > 0
        ? sanitizeStores(storedStores)
        : [...DEFAULT_FAVORITE_STORES];
    return {
      notifyDaysBefore: existing?.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
      emailNotificationsEnabled:
        existing?.emailNotificationsEnabled ?? DEFAULT_EMAIL_NOTIFICATIONS_ENABLED,
      emailNotifyDaysBefore:
        existing?.emailNotifyDaysBefore ?? DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE,
      email: existing?.email ?? identity?.email ?? null,
      favoriteStores,
    };
  },
});

// Crea el documento de ajustes con los valores por defecto si aún no existe.
// Se llama automáticamente al entrar a la app por primera vez.
export const ensureDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    if (existing) return;

    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email ?? null;

    await ctx.db.insert("userSettings", {
      clerkUserId,
      notifyDaysBefore: DEFAULT_NOTIFY_DAYS_BEFORE,
      emailNotificationsEnabled: email !== null,
      emailNotifyDaysBefore: DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE,
      ...(email !== null ? { email } : {}),
    });
  },
});

export const setMine = mutation({
  args: {
    notifyDaysBefore: v.optional(v.number()),
    emailNotificationsEnabled: v.optional(v.boolean()),
    emailNotifyDaysBefore: v.optional(v.number()),
    favoriteStores: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    {
      notifyDaysBefore,
      emailNotificationsEnabled,
      emailNotifyDaysBefore,
      favoriteStores,
    },
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

    let cleanedStores: AllowedStore[] | undefined;
    if (favoriteStores !== undefined) {
      cleanedStores = sanitizeStores(favoriteStores);
      if (cleanedStores.length === 0) {
        throw new Error("Selecciona al menos una tienda.");
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
      favoriteStores?: string[];
    } = {};
    if (notifyDaysBefore !== undefined) patch.notifyDaysBefore = notifyDaysBefore;
    if (emailNotificationsEnabled !== undefined) {
      patch.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (emailNotifyDaysBefore !== undefined) {
      patch.emailNotifyDaysBefore = emailNotifyDaysBefore;
    }
    if (identity?.email) patch.email = identity.email;
    if (cleanedStores !== undefined) patch.favoriteStores = cleanedStores;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userSettings", {
        clerkUserId,
        notifyDaysBefore: patch.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
        emailNotificationsEnabled: patch.emailNotificationsEnabled,
        emailNotifyDaysBefore: patch.emailNotifyDaysBefore,
        email: patch.email,
        favoriteStores: patch.favoriteStores,
      });
    }
  },
});
