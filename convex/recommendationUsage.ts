import { mutation } from "./_generated/server";
import { requireUser } from "./auth";

const DAILY_LIMIT = 10;

const todayUTC = (): string => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Consume una unidad de la cuota diaria de recomendaciones del usuario.
 * Lanza error si ya alcanzó el límite del día (UTC).
 * Devuelve { count, limit, remaining } tras incrementar.
 */
export const consume = mutation({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const day = todayUTC();

    const existing = await ctx.db
      .query("recommendationUsage")
      .withIndex("by_user_day", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("day", day),
      )
      .unique();

    if (existing) {
      if (existing.count >= DAILY_LIMIT) {
        throw new Error(
          `Has alcanzado el límite diario de ${DAILY_LIMIT} recomendaciones. Vuelve mañana.`,
        );
      }
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
      return {
        count: existing.count + 1,
        limit: DAILY_LIMIT,
        remaining: DAILY_LIMIT - (existing.count + 1),
      };
    }

    await ctx.db.insert("recommendationUsage", {
      clerkUserId,
      day,
      count: 1,
    });
    return { count: 1, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - 1 };
  },
});
