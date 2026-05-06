import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { UserToNotify, EventToNotify } from "./notifications";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "PickPal <onboarding@resend.dev>";
const APP_BASE_URL = "https://pickpal-app.vercel.app";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventCard(e: EventToNotify): string {
  const dd = String(e.day).padStart(2, "0");
  const mm = String(e.month).padStart(2, "0");
  const daysText =
    e.daysUntil === 0
      ? '<span style="color:#D97757;font-weight:600;">hoy</span>'
      : e.daysUntil === 1
        ? '<span style="color:#D97757;font-weight:600;">mañana</span>'
        : `<span style="color:#D97757;font-weight:600;">en ${e.daysUntil} días</span>`;
  return `
    <div style="background:#ffffff;border:1px solid #E0D5C5;border-radius:10px;padding:16px 20px;margin-bottom:12px;">
      <div style="font-size:15px;font-weight:600;color:#3D2E1E;">${escapeHtml(e.personName)}</div>
      <div style="font-size:13px;color:#9A8A75;margin-top:4px;">${escapeHtml(e.label)} · ${dd}/${mm} · ${daysText}</div>
    </div>`;
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

function buildCta(events: EventToNotify[]): string {
  const href =
    events.length === 1
      ? `${APP_BASE_URL}/people/${events[0].personId}`
      : `${APP_BASE_URL}/people`;
  const label =
    events.length === 1
      ? `Generar ideas de regalo para ${escapeHtml(events[0].personName)}`
      : "Ver mis eventos próximos";
  return `
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${href}"
         style="display:inline-block;background:#2D4033;color:#FBF7EE;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;letter-spacing:0.01em;">
        ${label}
      </a>
    </div>`;
}

function buildHtml(events: EventToNotify[]): string {
  const cards = events.map(formatEventCard).join("");
  const intro =
    events.length === 1
      ? "Tienes un evento próximo:"
      : "Tienes varios eventos próximos:";
  const cta = buildCta(events);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0ebe2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:#2D4033;border-radius:12px 12px 0 0;padding:28px 32px 24px;">
              <div style="font-size:22px;font-weight:700;color:#FBF7EE;letter-spacing:-0.01em;">PickPal</div>
              <div style="font-size:13px;color:#a8c0a0;margin-top:4px;">Recordatorio de evento</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FBF7EE;padding:28px 32px 8px;border-left:1px solid #E0D5C5;border-right:1px solid #E0D5C5;">
              <p style="margin:0 0 20px;font-size:15px;color:#3D2E1E;">${intro}</p>
              ${cards}
              ${cta}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FBF7EE;border-radius:0 0 12px 12px;border:1px solid #E0D5C5;border-top:none;padding:16px 32px 24px;">
              <p style="margin:0;font-size:12px;color:#9A8A75;line-height:1.6;">
                Si no quieres seguir recibiendo estos recordatorios, desactívalos en tus
                <a href="${APP_BASE_URL}/settings" style="color:#9A8A75;text-decoration:underline;">ajustes</a>
                de PickPal.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const sendBatchedReminderEmail = internalAction({
  args: {
    to: v.string(),
    events: v.array(
      v.object({
        dateId: v.id("importantDates"),
        personId: v.id("people"),
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
