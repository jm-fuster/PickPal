import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./auth";
import { ALLOWED_STORES, type AllowedStore } from "./validators";

export const DEFAULT_NOTIFY_DAYS_BEFORE = 30;
// Multi-trigger: por defecto un único aviso a 14 días. La UI permite también
// 0 (día relevante), 2 y 7. Los valores aceptados están en EMAIL_LEAD_DAY_OPTIONS.
export const DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE: readonly number[] = [14];
export const EMAIL_LEAD_DAY_OPTIONS: readonly number[] = [0, 2, 7, 14];
// Opt-in explícito: la base legal de los avisos por correo es el consentimiento
// (RGPD art. 6.1.a) y `/privacidad` promete que los correos solo salen "si
// activas las notificaciones". Un default en `true` enviaría correos a quien
// nunca pasó por /settings, que es exactamente lo que ese texto niega.
// No cambiar a `true` sin cambiar antes la base legal y las páginas legales.
export const DEFAULT_EMAIL_NOTIFICATIONS_ENABLED = false;

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

// Acepta número (formato legacy) o array. Devuelve siempre un array ordenado y
// deduplicado, o `undefined` si la entrada es `undefined`.
function normalizeLeadDays(
  raw: number | readonly number[] | undefined,
): number[] | undefined {
  if (raw === undefined) return undefined;
  const arr = typeof raw === "number" ? [raw] : [...raw];
  return Array.from(new Set(arr)).sort((a, b) => a - b);
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
    const leadDays =
      normalizeLeadDays(existing?.emailNotifyDaysBefore) ??
      [...DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE];
    const resolvedEmail = existing?.email ?? identity?.email ?? null;
    return {
      notifyDaysBefore: existing?.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS_BEFORE,
      // Sin doc todavía, el default debe reflejar lo que persistirá
      // `ensureDefaults`: OFF hasta que el usuario lo active (ver constante).
      emailNotificationsEnabled:
        existing?.emailNotificationsEnabled ??
        (resolvedEmail !== null && DEFAULT_EMAIL_NOTIFICATIONS_ENABLED),
      emailNotifyDaysBefore: leadDays,
      email: resolvedEmail,
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

    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email ?? null;

    if (existing) {
      // El email se sella al crear el doc; el cron de avisos usa ese valor. Si
      // el usuario lo cambia en Clerk y no vuelve a tocar /settings, los correos
      // irían al antiguo. `ensureDefaults` corre en cada carga, así que lo
      // resincronizamos aquí cuando hay un email actual y difiere del guardado.
      if (email !== null && existing.email !== email) {
        await ctx.db.patch(existing._id, { email });
      }
      return;
    }

    await ctx.db.insert("userSettings", {
      clerkUserId,
      notifyDaysBefore: DEFAULT_NOTIFY_DAYS_BEFORE,
      emailNotificationsEnabled:
        email !== null && DEFAULT_EMAIL_NOTIFICATIONS_ENABLED,
      emailNotifyDaysBefore: [...DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE],
      ...(email !== null ? { email } : {}),
    });
  },
});

export const setMine = mutation({
  args: {
    notifyDaysBefore: v.optional(v.number()),
    emailNotificationsEnabled: v.optional(v.boolean()),
    emailNotifyDaysBefore: v.optional(v.array(v.number())),
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
    // Auth SIEMPRE primero: ninguna validación debe ejecutarse (ni filtrar
    // información en sus errores) para peticiones sin sesión.
    const clerkUserId = await requireUser(ctx);
    const identity = await ctx.auth.getUserIdentity();

    if (notifyDaysBefore !== undefined) {
      if (
        !Number.isInteger(notifyDaysBefore) ||
        notifyDaysBefore < 1 ||
        notifyDaysBefore > 365
      ) {
        throw new ConvexError("Días de aviso fuera de rango (1–365).");
      }
    }
    let cleanedLeadDays: number[] | undefined;
    if (emailNotifyDaysBefore !== undefined) {
      const allowed = new Set<number>(EMAIL_LEAD_DAY_OPTIONS);
      const seen = new Set<number>();
      for (const d of emailNotifyDaysBefore) {
        if (!Number.isInteger(d) || !allowed.has(d)) {
          throw new ConvexError("Antelación de correo no válida.");
        }
        seen.add(d);
      }
      if (seen.size === 0) {
        throw new ConvexError("Selecciona al menos una antelación.");
      }
      cleanedLeadDays = [...seen].sort((a, b) => a - b);
    }

    let cleanedStores: AllowedStore[] | undefined;
    if (favoriteStores !== undefined) {
      cleanedStores = sanitizeStores(favoriteStores);
      if (cleanedStores.length === 0) {
        throw new ConvexError("Selecciona al menos una tienda.");
      }
    }

    if (emailNotificationsEnabled === true && !identity?.email) {
      throw new ConvexError(
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
      emailNotifyDaysBefore?: number[];
      email?: string;
      favoriteStores?: string[];
    } = {};
    if (notifyDaysBefore !== undefined) patch.notifyDaysBefore = notifyDaysBefore;
    if (emailNotificationsEnabled !== undefined) {
      patch.emailNotificationsEnabled = emailNotificationsEnabled;
    }
    if (cleanedLeadDays !== undefined) {
      patch.emailNotifyDaysBefore = cleanedLeadDays;
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
        emailNotifyDaysBefore:
          patch.emailNotifyDaysBefore ?? [...DEFAULT_EMAIL_NOTIFY_DAYS_BEFORE],
        email: patch.email,
        favoriteStores: patch.favoriteStores,
      });
    }
  },
});
