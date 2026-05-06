import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Días enteros entre hoy (UTC, hora 0) y la fecha objetivo (UTC, hora 0).
 * Devuelve negativo si la fecha ya pasó.
 */
function daysFromTodayUTC(target: Date): number {
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const t = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  return Math.round((t - today) / 86_400_000);
}

/**
 * Para una fecha importante, calcula `{ daysUntil, occurrenceYear }` de la
 * próxima ocurrencia. Devuelve null si no hay (no recurrente y ya pasó).
 *
 * - No recurrente: usa `year` literal. Si no hay year o ya pasó → null.
 * - Recurrente (default): usa el próximo aniversario futuro de (mes/día).
 *   Si el aniversario de este año ya pasó, salta al siguiente.
 */
function nextOccurrence(
  date: Doc<"importantDates">,
): { daysUntil: number; occurrenceYear: number } | null {
  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (date.recurring === false) {
    if (date.year === undefined) return null;
    const target = new Date(Date.UTC(date.year, date.month - 1, date.day));
    const daysUntil = daysFromTodayUTC(target);
    if (daysUntil < 0) return null;
    return { daysUntil, occurrenceYear: date.year };
  }

  const thisYear = todayUTC.getUTCFullYear();
  let target = new Date(Date.UTC(thisYear, date.month - 1, date.day));
  let occurrenceYear = thisYear;
  if (daysFromTodayUTC(target) < 0) {
    occurrenceYear = thisYear + 1;
    target = new Date(Date.UTC(occurrenceYear, date.month - 1, date.day));
  }
  return { daysUntil: daysFromTodayUTC(target), occurrenceYear };
}

export type EventToNotify = {
  dateId: Id<"importantDates">;
  personId: Id<"people">;
  occurrenceYear: number;
  label: string;
  personName: string;
  month: number;
  day: number;
  daysUntil: number;
};

export type UserToNotify = {
  clerkUserId: string;
  email: string;
  events: EventToNotify[];
};

export const findEventsNeedingEmail = internalQuery({
  args: {},
  handler: async (ctx): Promise<UserToNotify[]> => {
    const allSettings = await ctx.db.query("userSettings").collect();
    const targets = allSettings.filter(
      (s) =>
        s.emailNotificationsEnabled === true &&
        typeof s.email === "string" &&
        s.email.length > 0 &&
        typeof s.emailNotifyDaysBefore === "number",
    );

    const result: UserToNotify[] = [];

    for (const s of targets) {
      const lead = s.emailNotifyDaysBefore as number;
      const people = await ctx.db
        .query("people")
        .withIndex("by_user", (q) => q.eq("clerkUserId", s.clerkUserId))
        .collect();

      const events: EventToNotify[] = [];
      for (const person of people) {
        const dates = await ctx.db
          .query("importantDates")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .collect();
        for (const date of dates) {
          const next = nextOccurrence(date);
          if (next === null) continue;
          if (next.daysUntil !== lead) continue;

          const already = await ctx.db
            .query("emailNotifications")
            .withIndex("by_date_year", (q) =>
              q
                .eq("importantDateId", date._id)
                .eq("occurrenceYear", next.occurrenceYear),
            )
            .unique();
          if (already) continue;

          events.push({
            dateId: date._id,
            personId: person._id,
            occurrenceYear: next.occurrenceYear,
            label: date.label,
            personName: person.name,
            month: date.month,
            day: date.day,
            daysUntil: next.daysUntil,
          });
        }
      }

      if (events.length > 0) {
        result.push({
          clerkUserId: s.clerkUserId,
          email: s.email as string,
          events,
        });
      }
    }

    return result;
  },
});

export const markEmailsSent = internalMutation({
  args: {
    clerkUserId: v.string(),
    items: v.array(
      v.object({
        dateId: v.id("importantDates"),
        occurrenceYear: v.number(),
      }),
    ),
  },
  handler: async (ctx, { clerkUserId, items }) => {
    const sentAt = Date.now();
    for (const item of items) {
      await ctx.db.insert("emailNotifications", {
        clerkUserId,
        importantDateId: item.dateId,
        occurrenceYear: item.occurrenceYear,
        sentAt,
      });
    }
  },
});
