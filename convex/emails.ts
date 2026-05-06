import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { UserToNotify, EventToNotify } from "./notifications";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "PickPal <onboarding@resend.dev>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventLine(e: EventToNotify): string {
  const dd = String(e.day).padStart(2, "0");
  const mm = String(e.month).padStart(2, "0");
  const days =
    e.daysUntil === 0
      ? "hoy"
      : e.daysUntil === 1
        ? "mañana"
        : `en ${e.daysUntil} días`;
  return `<li><strong>${escapeHtml(e.personName)}</strong> — ${escapeHtml(e.label)} (${dd}/${mm}) · ${days}</li>`;
}

function buildSubject(events: EventToNotify[]): string {
  if (events.length === 1) {
    const e = events[0];
    const when =
      e.daysUntil === 0
        ? "hoy"
        : e.daysUntil === 1
          ? "mañana"
          : `en ${e.daysUntil} días`;
    return `PickPal · ${e.label} de ${e.personName} ${when}`;
  }
  return `PickPal · ${events.length} eventos próximos`;
}

function buildHtml(events: EventToNotify[]): string {
  const items = events.map(formatEventLine).join("");
  const intro =
    events.length === 1
      ? "Tienes un evento próximo:"
      : "Tienes varios eventos próximos:";
  return `<!doctype html>
<html lang="es">
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; line-height: 1.5;">
    <p>${intro}</p>
    <ul>${items}</ul>
    <p style="color:#666; font-size: 13px; margin-top: 24px;">
      Recibes este aviso porque activaste las notificaciones por correo en tus ajustes de PickPal.
    </p>
  </body>
</html>`;
}

export const sendBatchedReminderEmail = internalAction({
  args: {
    to: v.string(),
    events: v.array(
      v.object({
        dateId: v.id("importantDates"),
        occurrenceYear: v.number(),
        label: v.string(),
        personName: v.string(),
        month: v.number(),
        day: v.number(),
        daysUntil: v.number(),
      }),
    ),
  },
  handler: async (_ctx, { to, events }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY no configurada en Convex.");
    }
    const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: buildSubject(events),
        html: buildHtml(events),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend respondió ${res.status}: ${detail.slice(0, 200)}`);
    }
  },
});

export const runDailyEmailNotifications = internalAction({
  args: {},
  handler: async (ctx) => {
    const users: UserToNotify[] = await ctx.runQuery(
      internal.notifications.findEventsNeedingEmail,
      {},
    );

    let sentUsers = 0;
    let failedUsers = 0;
    for (const user of users) {
      try {
        await ctx.runAction(internal.emails.sendBatchedReminderEmail, {
          to: user.email,
          events: user.events,
        });
        await ctx.runMutation(internal.notifications.markEmailsSent, {
          clerkUserId: user.clerkUserId,
          items: user.events.map((e) => ({
            dateId: e.dateId,
            occurrenceYear: e.occurrenceYear,
          })),
        });
        sentUsers++;
      } catch (err) {
        failedUsers++;
        console.error(
          `[emails] Falló envío a usuario ${user.clerkUserId}:`,
          err,
        );
      }
    }
    console.log(
      `[emails] Cron diario: ${sentUsers} usuario(s) notificados, ${failedUsers} fallo(s).`,
    );
  },
});
