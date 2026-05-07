"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import {
  ALL_STORES,
  STORE_LABELS,
  sanitizeFavoriteStores,
  type StoreId,
} from "@/lib/stores";

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");
  const setMine = useMutation(api.settings.setMine);
  const { resolvedTheme, setTheme } = useTheme();

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailDays, setEmailDays] = useState<number | "">("");
  const [favoriteStores, setFavoriteStores] = useState<StoreId[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Sincroniza el form con el valor cargado desde Convex la primera vez
    // que llega; nuevas escrituras no necesitan reset porque el cliente ya
    // tiene el valor optimista tras la mutation.
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmailEnabled(settings.emailNotificationsEnabled);
      setEmailDays(settings.emailNotifyDaysBefore);
      setFavoriteStores(sanitizeFavoriteStores(settings.favoriteStores));
    }
  }, [settings]);

  if (!ready || settings === undefined) {
    return <LoadingFallback />;
  }

  const onSave = async () => {
    if (emailEnabled && (emailDays === "" || !Number.isInteger(emailDays))) {
      toast.error("Introduce los días de antelación del correo.");
      return;
    }
    if (emailEnabled && !settings.email) {
      toast.error(
        "No encontramos tu email. Verifícalo en tu cuenta para activar las notificaciones.",
      );
      return;
    }
    if (favoriteStores.length === 0) {
      toast.error("Selecciona al menos una tienda.");
      return;
    }
    setSaving(true);
    try {
      await setMine({
        notifyDaysBefore: settings.notifyDaysBefore,
        emailNotificationsEnabled: emailEnabled,
        emailNotifyDaysBefore:
          emailDays === "" ? undefined : (emailDays as number),
        favoriteStores,
      });
      toast.success("Ajustes guardados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const savedStores = sanitizeFavoriteStores(settings.favoriteStores);
  const storesChanged =
    favoriteStores.length !== savedStores.length ||
    favoriteStores.some((s, i) => savedStores[i] !== s);
  const dirty =
    settings.emailNotificationsEnabled !== emailEnabled ||
    settings.emailNotifyDaysBefore !== emailDays ||
    storesChanged;

  const toggleStore = (store: StoreId) => {
    setFavoriteStores((prev) => {
      if (prev.includes(store)) {
        return prev.filter((s) => s !== store);
      }
      const next = [...prev, store];
      // Mantener orden canónico para que `dirty` sea estable
      return ALL_STORES.filter((s) => next.includes(s));
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-xl">
      <div>
        <h1 className="text-4xl font-medium">Ajustes</h1>
        <p className="text-muted-foreground">
          Personaliza cómo se comportan las notificaciones.
        </p>
      </div>

      <section className="space-y-3 rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="theme-toggle">Modo oscuro</Label>
            <p className="text-xs text-muted-foreground">
              Cambia entre tema claro y oscuro.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-muted-foreground" aria-hidden />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              suppressHydrationWarning
            />
            <Moon className="size-4 text-muted-foreground" aria-hidden />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border p-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-toggle">Notificaciones por correo</Label>
              <p className="text-xs text-muted-foreground">
                Recibe un email cuando se acerquen tus eventos importantes.
              </p>
            </div>
            <Switch
              id="email-toggle"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>

          {emailEnabled && (
            <div className="space-y-3 pt-1">
              {settings.email ? (
                <p className="text-xs text-muted-foreground">
                  Los avisos llegarán a{" "}
                  <span className="font-medium text-foreground">
                    {settings.email}
                  </span>
                  .
                </p>
              ) : (
                <p className="text-xs text-destructive">
                  No encontramos tu email. Verifícalo en tu cuenta para activar
                  las notificaciones.
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email-days">Días de antelación del correo</Label>
                <Input
                  id="email-days"
                  type="number"
                  min={1}
                  max={365}
                  value={emailDays}
                  onChange={(e) =>
                    setEmailDays(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="max-w-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Te enviaremos un correo el día que falten exactamente este
                  número de días para cada evento.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border p-5">
        <div className="space-y-0.5">
          <Label>Tiendas para recomendaciones</Label>
          <p className="text-xs text-muted-foreground">
            Elige en qué tiendas quieres buscar regalos físicos. Los enlaces se
            generan como búsquedas en cada tienda.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {ALL_STORES.map((store) => {
            const checked = favoriteStores.includes(store);
            return (
              <label
                key={store}
                htmlFor={`store-${store}`}
                className={[
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors",
                  checked
                    ? "border-border bg-muted"
                    : "border-border/50 hover:border-border",
                ].join(" ")}
              >
                <input
                  id={`store-${store}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStore(store)}
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="font-medium">{STORE_LABELS[store]}</span>
              </label>
            );
          })}
        </div>
      </section>

      <Button
        onClick={onSave}
        disabled={saving || !dirty}
        className="w-fit"
      >
        {saving ? "Guardando…" : "Guardar"}
      </Button>
    </main>
  );
}
