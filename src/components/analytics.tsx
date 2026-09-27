"use client";

import {
  Analytics as VercelAnalytics,
  type BeforeSend,
} from "@vercel/analytics/next";
import { asksNotToTrack } from "@/lib/privacySignals";

// Vercel Web Analytics no usa cookies, pero su script envía cada visita, y eso
// también cae bajo el art. 22.2 LSSI. La guía de cookies de la AEPD (2023) lo
// tolera para medición propia y agregada si se informa y se deja negarse, y
// la forma de negarse es la señal del navegador. Ver docs/privacy.md §2.4.
const respectPrivacySignals: BeforeSend = (event) =>
  asksNotToTrack(navigator) ? null : event;

export function Analytics() {
  return <VercelAnalytics beforeSend={respectPrivacySignals} />;
}
