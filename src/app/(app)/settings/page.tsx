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

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");
  const setMine = useMutation(api.settings.setMine);
  const { resolvedTheme, setTheme } = useTheme();

  const [notifyDays, setNotifyDays] = useState<number | "">("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailDays, setEmailDays] = useState<number | "">("");
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
      setNotifyDays(settings.notifyDaysBefore);
      setEmailEnabled(settings.emailNotificationsEnabled);
      setEmailDays(settings.emailNotifyDaysBefore);
    }
  }, [settings]);

  if (!ready || settings === undefined) {
    return <LoadingFallback />;
  }

  const onSave = async () => {
    if (notifyDays === "" || !Number.isInteger(notifyDays)) {
      toast.error("Introduce un número entero de días.");
      return;
    }
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
    setSaving(true);
    try {
      await setMine({
        notifyDaysBefore: notifyDays,
        emailNotificationsEnabled: emailEnabled,
        emailNotifyDaysBefore:
          emailDays === "" ? undefined : (emailDays as number),
      });
      toast.success("Ajustes guardados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    settings.notifyDaysBefore !== notifyDays ||
    settings.emailNotificationsEnabled !== emailEnabled ||
    settings.emailNotifyDaysBefore !== emailDays;

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
        <div className="space-y-1.5">
          <Label htmlFor="notify-days">Días de aviso</Label>
          <Input
            id="notify-days"
            type="number"
            min={1}
            max={365}
            value={notifyDays}
            onChange={(e) =>
              setNotifyDays(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="max-w-[140px]"
          />
          <p className="text-xs text-muted-foreground">
            La campanita en la cabecera y el contador del dashboard mostrarán
            las fechas que ocurran dentro de este número de días.
          </p>
        </div>

        <div className="border-t pt-4 space-y-3">
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

        <Button onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </section>
    </main>
  );
}
