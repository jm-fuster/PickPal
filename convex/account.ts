import { mutation } from "./_generated/server";
import { requireUser } from "./auth";

/**
 * Borra todos los datos del usuario autenticado en Convex.
 *
 * Se llama desde `src/app/api/account/delete/route.ts` justo antes de
 * borrar el usuario en Clerk. La autorización es por sesión: `requireUser`
 * obtiene el `clerkUserId` del JWT — nunca se acepta como argumento.
 *
 * Tablas que limpia:
 * - `people` y, en cascada, sus `importantDates`, `giftHistory`, `recommendations`.
 * - `userSettings`, `emailNotifications`, `recommendationUsage`, `rateLimitBuckets`.
 *
 * No expone `clerkUserId` como argumento ni acepta un `userId` distinto al
 * de la sesión: un usuario solo puede borrarse a sí mismo.
 */
export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);

    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    for (const person of people) {
      const dates = await ctx.db
        .query("importantDates")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .collect();
      for (const d of dates) await ctx.db.delete(d._id);

      const history = await ctx.db
        .query("giftHistory")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .collect();
      for (const h of history) await ctx.db.delete(h._id);

      const recs = await ctx.db
        .query("recommendations")
        .withIndex("by_person", (q) => q.eq("personId", person._id))
        .collect();
      for (const r of recs) await ctx.db.delete(r._id);

      await ctx.db.delete(person._id);
    }

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    for (const s of settings) await ctx.db.delete(s._id);

    const emails = await ctx.db
      .query("emailNotifications")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    for (const e of emails) await ctx.db.delete(e._id);

    const usage = await ctx.db
      .query("recommendationUsage")
      .withIndex("by_user_day", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    for (const u of usage) await ctx.db.delete(u._id);

    const buckets = await ctx.db
      .query("rateLimitBuckets")
      .withIndex("by_user_day_bucket", (q) =>
        q.eq("clerkUserId", clerkUserId),
      )
      .collect();
    for (const b of buckets) await ctx.db.delete(b._id);
  },
});
