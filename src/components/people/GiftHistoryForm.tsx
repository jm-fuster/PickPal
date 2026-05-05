"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { giftHistorySchema, type GiftHistoryFormValues, REACTIONS } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GiftHistoryForm({ personId }: { personId: Id<"people"> }) {
  const create = useMutation(api.giftHistory.create);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GiftHistoryFormValues>({
    resolver: zodResolver(giftHistorySchema),
    defaultValues: { giftName: "", occasionLabel: "Cumpleaños", reaction: "loved" },
  });

  const onSubmit = async (values: GiftHistoryFormValues) => {
    try {
      await create({
        personId,
        giftName: values.giftName,
        occasionLabel: values.occasionLabel,
        year: values.year,
        reaction: values.reaction as "loved" | "ok" | "bad",
        notes: values.notes || undefined,
      });
      toast.success("Regalo añadido al historial");
      reset({ giftName: "", occasionLabel: "Cumpleaños", reaction: "loved", year: undefined, notes: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al añadir");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4"
    >
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Añadir regalo pasado
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gh-name">Regalo</Label>
          <Input
            id="gh-name"
            placeholder="Libro de recetas, auriculares…"
            {...register("giftName")}
          />
          {errors.giftName ? (
            <p className="text-xs text-destructive">{errors.giftName.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gh-occasion">Ocasión</Label>
          <Input
            id="gh-occasion"
            placeholder="Cumpleaños, Navidad…"
            {...register("occasionLabel")}
          />
          {errors.occasionLabel ? (
            <p className="text-xs text-destructive">{errors.occasionLabel.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="gh-year">Año (opcional)</Label>
          <Input
            id="gh-year"
            type="number"
            min={1900}
            max={2100}
            placeholder="2023"
            {...register("year", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Reacción</Label>
          <Controller
            name="reaction"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REACTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.emoji} {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gh-notes">Notas (opcional)</Label>
        <Textarea
          id="gh-notes"
          rows={2}
          placeholder="Le encantó el color, pero la talla era equivocada…"
          {...register("notes")}
        />
      </div>

      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Guardando…" : "Añadir al historial"}
      </Button>
    </form>
  );
}
