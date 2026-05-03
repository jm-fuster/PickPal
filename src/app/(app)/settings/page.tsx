"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");
  const setMine = useMutation(api.settings.setMine);

  const [notifyDays, setNotifyDays] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Sincroniza el form con el valor cargado desde Convex la primera vez
    // que llega; nuevas escrituras no necesitan reset porque el cliente ya
    // tiene el valor optimista tras la mutation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (settings) setNotifyDays(settings.notifyDaysBefore);
  }, [settings]);

  if (!ready || settings === undefined) {
    return <p className="p-8 text-muted-foreground">Cargando…</p>;
  }

  const onSave = async () => {
    if (notifyDays === "" || !Number.isInteger(notifyDays)) {
      toast.error("Introduce un número entero de días.");
      return;
    }
    setSaving(true);
    try {
      await setMine({ notifyDaysBefore: notifyDays });
      toast.success("Ajustes guardados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const dirty = settings.notifyDaysBefore !== notifyDays;

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-muted-foreground">
          Personaliza cómo se comportan las notificaciones.
        </p>
      </div>

      <section className="space-y-3 rounded-md border p-5">
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
        <Button onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </section>
    </main>
  );
}
