import { mutation } from "./_generated/server";
import { requireUser } from "./auth";
import { deletePersonCascade } from "./people";

/**
 * Borra todos los datos del usuario autenticado en Convex.
 *
 * Se llama desde `src/app/api/account/delete/route.ts` justo antes de
 * borrar el usuario en Clerk. La autorización es por sesión: `requireUser`
 * obtiene el `clerkUserId` del JWT — nunca se acepta como argumento.
 *
 * Tablas que limpia:
 * - `people` y, en cascada (vía `deletePersonCascade`), sus `importantDates`,
 *   `giftHistory`, `recommendations` y `savedIdeas`.
 * - `savedIdeas` huérfanas (de personas borradas antes de que la cascada
 *   las cubriera), vía índice `by_user`.
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
      await deletePersonCascade(ctx, person._id);
    }

    const orphanSaved = await ctx.db
      .query("savedIdeas")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();
    for (const s of orphanSaved) await ctx.db.delete(s._id);

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
