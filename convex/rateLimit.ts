import { MutationCtx } from "./_generated/server";

const todayUTC = (): string => {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Incrementa el contador del bucket para (usuario, día) o lanza si excede el
 * límite. Se ejecuta dentro de la misma transacción que la mutation que lo
 * llama, así que es atómico frente a inserts concurrentes.
 */
export async function checkAndIncrement(
  ctx: MutationCtx,
  clerkUserId: string,
  bucket: string,
  limitPerDay: number,
): Promise<void> {
  const day = todayUTC();
  const existing = await ctx.db
    .query("rateLimitBuckets")
    .withIndex("by_user_day_bucket", (q) =>
      q.eq("clerkUserId", clerkUserId).eq("day", day).eq("bucket", bucket),
    )
    .unique();

  if (existing) {
    if (existing.count >= limitPerDay) {
      throw new Error(
        `Límite diario alcanzado (${limitPerDay}). Vuelve mañana.`,
      );
    }
    await ctx.db.patch(existing._id, { count: existing.count + 1 });
    return;
  }

  await ctx.db.insert("rateLimitBuckets", {
    clerkUserId,
    day,
    bucket,
    count: 1,
  });
}
