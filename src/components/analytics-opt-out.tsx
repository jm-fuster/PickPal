"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  asksNotToTrack,
  browserStorage,
  readAnalyticsOptOut,
  writeAnalyticsOptOut,
} from "@/lib/privacySignals";

type Prefs = { optedOut: boolean; browserSignal: boolean };

// Interruptor «Contar mis visitas» de /privacidad: la forma de negarse a la
// analítica que pide la guía de cookies de la AEPD, junto a la señal GPC/DNT.
// Vale solo para este navegador. Ver docs/privacy.md §2.4.
export function AnalyticsOptOut() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);

  useEffect(() => {
    // En SSR no hay navegador que consultar: la preferencia y la señal solo
    // existen en el cliente. Mismo patrón que ThemeToggle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs({
      optedOut: readAnalyticsOptOut(browserStorage()),
      browserSignal: asksNotToTrack(navigator),
    });
  }, []);

  // Hasta montar no se sabe qué mostrar, y un interruptor que salta de estado
  // al hidratar confunde más que uno que aparece.
  if (!prefs) return null;

  if (prefs.browserSignal) {
    return (
      <p className="text-sm text-foreground">
        Tu navegador ya envía una de esas señales, así que tus visitas no se
        cuentan.
      </p>
    );
  }

  const handleChange = (count: boolean) => {
    if (!writeAnalyticsOptOut(browserStorage(), !count)) {
      toast.error("No se pudo guardar la preferencia en este navegador.");
      return;
    }
    setPrefs({ ...prefs, optedOut: !count });
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor="analytics-toggle">Contar mis visitas</Label>
        <p className="text-xs text-muted-foreground">
          Solo afecta a este navegador.
        </p>
      </div>
      <Switch
        id="analytics-toggle"
        checked={!prefs.optedOut}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
