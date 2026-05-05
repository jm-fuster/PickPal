"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  personFormSchema,
  type PersonFormValues,
  RELATIONSHIPS,
} from "@/lib/schemas";
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
import { InterestTagInput } from "./InterestTagInput";
import { AvatarPicker } from "./AvatarPicker";

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

interface PersonFormProps {
  defaultValues?: Partial<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  submitLabel: string;
  includeDates?: boolean;
}

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel,
  includeDates = false,
}: PersonFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      name: "",
      relationship: "friend",
      interests: [],
      notes: "",
      dates: [],
      avatarUrl: undefined,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "dates" });
  const watchedName = useWatch({ control, name: "name" });

  const submit = async (values: PersonFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 max-w-xl">
      <div className="space-y-1.5">
        <Label>Avatar</Label>
        <Controller
          name="avatarUrl"
          control={control}
          render={({ field }) => (
            <AvatarPicker
              name={watchedName}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" {...register("name")} />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label>Relación</Label>
        <Controller
          name="relationship"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Intereses</Label>
        <Controller
          name="interests"
          control={control}
          render={({ field }) => (
            <InterestTagInput
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {errors.interests ? (
          <p className="text-xs text-destructive">
            {errors.interests.message as string}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Restricciones, preferencias, contexto…"
          {...register("notes")}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Datos prácticos (opcional)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shoeSize">Talla de zapato</Label>
            <Input
              id="shoeSize"
              placeholder="EU 42, 38…"
              {...register("shoeSize")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clothingSize">Talla de ropa</Label>
            <Input
              id="clothingSize"
              placeholder="M, L, 38…"
              {...register("clothingSize")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="allergies">Alergias o restricciones</Label>
          <Textarea
            id="allergies"
            rows={2}
            placeholder="Frutos secos, gluten, látex…"
            {...register("allergies")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dislikes">Cosas que no le gustan</Label>
          <Textarea
            id="dislikes"
            rows={2}
            placeholder="Color amarillo, perfumes fuertes, libros de autoayuda…"
            {...register("dislikes")}
          />
        </div>
      </div>

      {includeDates ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Fechas importantes (opcional)
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                append({ label: "Cumpleaños", month: 1, day: 1, year: undefined, budgetMinEuros: undefined, budgetMaxEuros: undefined })
              }
            >
              <Plus className="size-3.5" />
              Añadir fecha
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Cumpleaños, aniversarios… las podrás recordar antes de tiempo.
            </p>
          ) : null}

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-2 gap-2 rounded-lg bg-background/60 p-3 md:grid-cols-[1fr_8rem_5rem_6rem_6rem_6rem_2rem]"
            >
              <div className="space-y-1 md:col-span-1">
                <Label htmlFor={`dates.${idx}.label`} className="text-xs">
                  Etiqueta
                </Label>
                <Input
                  id={`dates.${idx}.label`}
                  {...register(`dates.${idx}.label` as const)}
                />
                {errors.dates?.[idx]?.label ? (
                  <p className="text-xs text-destructive">
                    {errors.dates[idx]?.label?.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dates.${idx}.month`} className="text-xs">
                  Mes
                </Label>
                <select
                  id={`dates.${idx}.month`}
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  {...register(`dates.${idx}.month` as const, {
                    valueAsNumber: true,
                  })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dates.${idx}.day`} className="text-xs">
                  Día
                </Label>
                <Input
                  id={`dates.${idx}.day`}
                  type="number"
                  min={1}
                  max={31}
                  {...register(`dates.${idx}.day` as const, {
                    valueAsNumber: true,
                  })}
                />
                {errors.dates?.[idx]?.day ? (
                  <p className="text-xs text-destructive">
                    {errors.dates[idx]?.day?.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dates.${idx}.year`} className="text-xs">
                  Año
                </Label>
                <Input
                  id={`dates.${idx}.year`}
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder="Opc."
                  {...register(`dates.${idx}.year` as const, {
                    setValueAs: (v) =>
                      v === "" || v === null ? undefined : Number(v),
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dates.${idx}.budgetMinEuros`} className="text-xs">
                  Mín €
                </Label>
                <Input
                  id={`dates.${idx}.budgetMinEuros`}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Opc."
                  {...register(`dates.${idx}.budgetMinEuros` as const, {
                    setValueAs: (v) =>
                      v === "" || v === null ? undefined : Number(v),
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`dates.${idx}.budgetMaxEuros`} className="text-xs">
                  Máx €
                </Label>
                <Input
                  id={`dates.${idx}.budgetMaxEuros`}
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Opc."
                  {...register(`dates.${idx}.budgetMaxEuros` as const, {
                    setValueAs: (v) =>
                      v === "" || v === null ? undefined : Number(v),
                  })}
                />
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(idx)}
                  aria-label="Quitar fecha"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
