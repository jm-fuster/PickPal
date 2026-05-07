"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useTheme } from "next-themes";
import { Check, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import {
  ALL_STORES,
  STORE_ICONS,
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
  // Tras la primera carga, ignoramos cambios externos en `settings` para no
  // pisar actualizaciones optimistas que aún están viajando al servidor.
  const initializedRef = useRef(false);
  // Pill flotante "Guardado" — mismo patrón que /people/[id]/page.tsx
  const [savedRecently, setSavedRecently] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  useEffect(() => {
    if (settings && !initializedRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmailEnabled(settings.emailNotificationsEnabled);
      setEmailDays(settings.emailNotifyDaysBefore);
      setFavoriteStores(sanitizeFavoriteStores(settings.favoriteStores));
      initializedRef.current = true;
    }
  }, [settings]);

  if (!ready || settings === undefined) {
    return <LoadingFallback />;
  }

  // Helper: aplica patch optimista, llama al servidor, dispara el pill
  // "Guardado" en éxito y revierte + toast.error en fallo. Mismo patrón que
  // el autosave de la ficha de persona (silencio en éxito, toast en error).
  const save = async (
    patch: Parameters<typeof setMine>[0],
    revert: () => void,
  ) => {
    try {
      await setMine(patch);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      setSavedRecently(true);
      savedTimerRef.current = setTimeout(() => setSavedRecently(false), 2000);
    } catch (err) {
      revert();
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    }
  };

  const handleEmailToggle = (checked: boolean) => {
    if (checked && !settings.email) {
      toast.error(
        "No encontramos tu email. Verifícalo en tu cuenta para activar las notificaciones.",
      );
      return;
    }
    const previous = emailEnabled;
    setEmailEnabled(checked);
    save(
      { emailNotificationsEnabled: checked },
      () => setEmailEnabled(previous),
    );
  };

  const handleEmailDaysBlur = () => {
    if (!emailEnabled) return;
    if (
      emailDays === "" ||
      !Number.isInteger(emailDays) ||
      (emailDays as number) < 1 ||
      (emailDays as number) > 365
    ) {
      toast.error("Introduce un número entre 1 y 365.");
      setEmailDays(settings.emailNotifyDaysBefore);
      return;
    }
    if (emailDays === settings.emailNotifyDaysBefore) return;
    const previous = settings.emailNotifyDaysBefore;
    save(
      { emailNotifyDaysBefore: emailDays as number },
      () => setEmailDays(previous),
    );
  };

  const handleStoreToggle = (store: StoreId) => {
    const willCheck = !favoriteStores.includes(store);
    const next = willCheck
      ? ALL_STORES.filter((s) => [...favoriteStores, store].includes(s))
      : favoriteStores.filter((s) => s !== store);

    if (next.length === 0) {
      toast.error("Selecciona al menos una tienda.");
      return;
    }
    const previous = favoriteStores;
    setFavoriteStores(next);
    save({ favoriteStores: next }, () => setFavoriteStores(previous));
  };

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-xl">
      <div>
        <h1 className="text-4xl font-medium">Ajustes</h1>
        <p className="text-muted-foreground">
          Los cambios se guardan automáticamente.
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
              onCheckedChange={handleEmailToggle}
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
                  onBlur={handleEmailDaysBlur}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {ALL_STORES.map((store) => {
            const checked = favoriteStores.includes(store);
            const StoreIcon = STORE_ICONS[store];
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
                  onChange={() => handleStoreToggle(store)}
                  className="size-4 rounded border-border accent-primary"
                />
                <StoreIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                <span className="font-medium">{STORE_LABELS[store]}</span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Pill flotante "Guardado" — mismo patrón que la ficha de persona */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-md transition-all duration-300 ${
          savedRecently
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <Check className="size-3" aria-hidden />
        Guardado
      </div>
    </main>
  );
}
