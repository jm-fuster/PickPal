import { ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
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
 * Comprueba si el usuario tiene cuota disponible sin consumirla.
 * Lanza ConvexError si ya alcanzó el límite.
 */
export const check = query({
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
    const count = existing?.count ?? 0;
    if (count >= DAILY_LIMIT) {
      throw new ConvexError(
        `Has alcanzado el límite diario de ${DAILY_LIMIT} recomendaciones. Vuelve mañana.`,
      );
    }
    return { count, limit: DAILY_LIMIT, remaining: DAILY_LIMIT - count };
  },
});

/**
 * Reserva atómicamente una unidad de cuota ANTES de llamar al proveedor de IA.
 * Lanza ConvexError si el usuario ya alcanzó el límite diario.
 *
 * Al incrementar dentro de la mutation (transacción Convex), dos peticiones
 * concurrentes en el límite no pueden superar las 10 generaciones/día — la
 * pareja check+consume anterior dejaba una ventana entre verificar y consumir.
 * Devuelve { count, limit, remaining } tras reservar.
 */
export const reserve = mutation({
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

    const count = existing?.count ?? 0;
    if (count >= DAILY_LIMIT) {
      throw new ConvexError(
        `Has alcanzado el límite diario de ${DAILY_LIMIT} recomendaciones. Vuelve mañana.`,
      );
    }

    if (existing) {
      await ctx.db.patch(existing._id, { count: count + 1 });
    } else {
      await ctx.db.insert("recommendationUsage", {
        clerkUserId,
        day,
        count: 1,
      });
    }
    return {
      count: count + 1,
      limit: DAILY_LIMIT,
      remaining: DAILY_LIMIT - (count + 1),
    };
  },
});

/**
 * Devuelve una unidad reservada con `reserve`. Solo se llama desde la API
 * route cuando el proveedor falla de forma retriable (503/timeout) y no se
 * generó nada: el usuario no pierde cuota por una caída ajena. Nunca baja
 * el contador de 0.
 */
export const refund = mutation({
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

    if (existing && existing.count > 0) {
      await ctx.db.patch(existing._id, { count: existing.count - 1 });
    }
    return null;
  },
});
