import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const remapMapValidator = v.array(
  v.object({ oldClerkUserId: v.string(), newClerkUserId: v.string() }),
);

/**
 * Inventario: todos los clerkUserId distintos que tienen algún documento en
 * cualquiera de las 7 tablas. Se usa antes de migrar, para confirmar que el
 * mapa old->new cubre a todo el mundo y nadie se queda huérfano.
 *
 *   npx convex run migrations:listDistinctClerkUserIds --prod
 */
export const listDistinctClerkUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const ids = new Set<string>();

    for (const doc of await ctx.db.query("people").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("userSettings").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("emailNotifications").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("recommendationUsage").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("rateLimitBuckets").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("recommendations").collect()) {
      ids.add(doc.clerkUserId);
    }
    for (const doc of await ctx.db.query("savedIdeas").collect()) {
      ids.add(doc.clerkUserId);
    }

    return Array.from(ids).sort();
  },
});

/**
 * Migración Clerk dev → Clerk prod: reescribe `clerkUserId` (viejo → nuevo)
 * en las 7 tablas que lo llevan. `importantDates` y `giftHistory` cuelgan de
 * `personId`, no de `clerkUserId`, y se arrastran solas con `people`.
 *
 * Uso (dry run primero, siempre):
 *   npx convex run migrations:remapClerkUserId '{"map":[{"oldClerkUserId":"user_old","newClerkUserId":"user_new"}],"dryRun":true}'
 *   npx convex run migrations:remapClerkUserId '{"map":[...],"dryRun":false}'
 *   (añade --prod para correrla contra el deployment de producción)
 *
 * Idempotente: una vez migrado un doc, ya no matchea `oldClerkUserId`, así
 * que repetir la llamada no vuelve a tocarlo.
 */
export const remapClerkUserId = internalMutation({
  args: {
    map: remapMapValidator,
    dryRun: v.boolean(),
  },
  handler: async (ctx, { map, dryRun }) => {
    const counts: Record<string, Record<string, number>> = {};

    for (const { oldClerkUserId, newClerkUserId } of map) {
      const perTable: Record<string, number> = {};

      const people = await ctx.db
        .query("people")
        .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
        .collect();
      perTable.people = people.length;
      if (!dryRun) {
        for (const doc of people) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const userSettings = await ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
        .collect();
      perTable.userSettings = userSettings.length;
      if (!dryRun) {
        for (const doc of userSettings) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const emailNotifications = await ctx.db
        .query("emailNotifications")
        .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
        .collect();
      perTable.emailNotifications = emailNotifications.length;
      if (!dryRun) {
        for (const doc of emailNotifications) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const recommendationUsage = await ctx.db
        .query("recommendationUsage")
        .withIndex("by_user_day", (q) => q.eq("clerkUserId", oldClerkUserId))
        .collect();
      perTable.recommendationUsage = recommendationUsage.length;
      if (!dryRun) {
        for (const doc of recommendationUsage) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const rateLimitBuckets = await ctx.db
        .query("rateLimitBuckets")
        .withIndex("by_user_day_bucket", (q) =>
          q.eq("clerkUserId", oldClerkUserId),
        )
        .collect();
      perTable.rateLimitBuckets = rateLimitBuckets.length;
      if (!dryRun) {
        for (const doc of rateLimitBuckets) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const recommendations = await ctx.db
        .query("recommendations")
        .withIndex("by_user_person_occasion_type", (q) =>
          q.eq("clerkUserId", oldClerkUserId),
        )
        .collect();
      perTable.recommendations = recommendations.length;
      if (!dryRun) {
        for (const doc of recommendations) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      const savedIdeas = await ctx.db
        .query("savedIdeas")
        .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
        .collect();
      perTable.savedIdeas = savedIdeas.length;
      if (!dryRun) {
        for (const doc of savedIdeas) {
          await ctx.db.patch(doc._id, { clerkUserId: newClerkUserId });
        }
      }

      counts[oldClerkUserId] = perTable;
    }

    return { dryRun, counts };
  },
});

/**
 * Verificación post-migración: para cada `oldClerkUserId`, cuenta cuántos
 * documentos siguen referenciándolo en las 7 tablas. Todo en 0 = migración
 * completa; cualquier valor > 0 apunta a qué tabla quedó sin migrar.
 *
 *   npx convex run migrations:findRemainingOldClerkUserIds '{"oldClerkUserIds":["user_old1","user_old2"]}'
 */
export const findRemainingOldClerkUserIds = internalQuery({
  args: { oldClerkUserIds: v.array(v.string()) },
  handler: async (ctx, { oldClerkUserIds }) => {
    const remaining: Record<string, Record<string, number>> = {};

    for (const oldClerkUserId of oldClerkUserIds) {
      const perTable: Record<string, number> = {};

      perTable.people = (
        await ctx.db
          .query("people")
          .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
          .collect()
      ).length;

      perTable.userSettings = (
        await ctx.db
          .query("userSettings")
          .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
          .collect()
      ).length;

      perTable.emailNotifications = (
        await ctx.db
          .query("emailNotifications")
          .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
          .collect()
      ).length;

      perTable.recommendationUsage = (
        await ctx.db
          .query("recommendationUsage")
          .withIndex("by_user_day", (q) =>
            q.eq("clerkUserId", oldClerkUserId),
          )
          .collect()
      ).length;

      perTable.rateLimitBuckets = (
        await ctx.db
          .query("rateLimitBuckets")
          .withIndex("by_user_day_bucket", (q) =>
            q.eq("clerkUserId", oldClerkUserId),
          )
          .collect()
      ).length;

      perTable.recommendations = (
        await ctx.db
          .query("recommendations")
          .withIndex("by_user_person_occasion_type", (q) =>
            q.eq("clerkUserId", oldClerkUserId),
          )
          .collect()
      ).length;

      perTable.savedIdeas = (
        await ctx.db
          .query("savedIdeas")
          .withIndex("by_user", (q) => q.eq("clerkUserId", oldClerkUserId))
          .collect()
      ).length;

      remaining[oldClerkUserId] = perTable;
    }

    return remaining;
  },
});
