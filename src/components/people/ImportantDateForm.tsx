"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  importantDateSchema,
  type ImportantDateFormValues,
} from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function ImportantDateForm({ personId }: { personId: Id<"people"> }) {
  const create = useMutation(api.importantDates.create);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImportantDateFormValues>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: { label: "Cumpleaños", month: 1, day: 1 },
  });

  const onSubmit = async (values: ImportantDateFormValues) => {
    try {
      await create({ personId, ...values });
      toast.success("Fecha añadida");
      reset({ label: "Cumpleaños", month: 1, day: 1, year: undefined });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo añadir la fecha");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Añadir fecha
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="date-label">Etiqueta</Label>
          <Input id="date-label" {...register("label")} />
          {errors.label ? (
            <p className="text-xs text-destructive">{errors.label.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-month">Mes</Label>
          <select
            id="date-month"
            className="h-8 w-full rounded-md border bg-background px-2 text-sm"
            {...register("month", { valueAsNumber: true })}
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date-day">Día</Label>
          <Input
            id="date-day"
            type="number"
            min={1}
            max={31}
            {...register("day", { valueAsNumber: true })}
          />
          {errors.day ? (
            <p className="text-xs text-destructive">{errors.day.message}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label htmlFor="date-year">Año (opcional)</Label>
        <Input
          id="date-year"
          type="number"
          min={1900}
          max={2100}
          placeholder="Vacío = se repite cada año"
          {...register("year", {
            setValueAs: (v) =>
              v === "" || v === null ? undefined : Number(v),
          })}
        />
      </div>

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Añadir fecha"}
      </Button>
    </form>
  );
}
