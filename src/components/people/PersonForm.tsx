"use client";

import { useState } from "react";
import {
  useForm,
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarDays, Plus, Ruler, Trash2 } from "lucide-react";
import {
  personFormSchema,
  importantDateSchema,
  type PersonFormValues,
  type ImportantDateFormValues,
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
} from "@/components/ui/select";

import { InterestTagInput } from "./InterestTagInput";
import { AvatarPicker } from "./AvatarPicker";
import { BudgetRangeSlider } from "./BudgetRangeSlider";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatEventDate(day: number, month: number, year?: number) {
  const m = MONTHS[month - 1]?.toLowerCase() ?? "";
  return year ? `${day} de ${m} de ${year}` : `${day} de ${m}`;
}

// ─── Inline add-event form ────────────────────────────────────────────────────

function AddEventForm({
  onAdd,
  onCancel,
}: {
  onAdd: (values: ImportantDateFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ImportantDateFormValues>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: {
      label: "",
      month: undefined as unknown as number,
      day: undefined as unknown as number,
      year: undefined,
      recurring: true,
      budgetMinEuros: undefined,
      budgetMaxEuros: undefined,
    },
  });

  const watchedBudgetMin = useWatch({ control, name: "budgetMinEuros" });
  const watchedBudgetMax = useWatch({ control, name: "budgetMaxEuros" });
  const watchedRecurring = useWatch({ control, name: "recurring" });
  const watchedYear = useWatch({ control, name: "year" });
  const watchedMonth = useWatch({ control, name: "month" });

  return (
    <div className="space-y-3 rounded-lg bg-background/60 p-3">
      {/* Etiqueta */}
      <div className="space-y-1.5">
        <Label htmlFor="ae-label" className="text-xs">Etiqueta</Label>
        <Input id="ae-label" placeholder="Cumpleaños, Aniversario…" {...register("label")} />
        {errors.label ? (
          <p className="text-xs text-destructive">{errors.label.message}</p>
        ) : null}
      </div>

      {/* Día / Mes / Año */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ae-day" className="text-xs">Día</Label>
          <Input
            id="ae-day"
            type="number"
            min={1}
            max={31}
            placeholder="Día"
            {...register("day", { valueAsNumber: true })}
          />
          {errors.day ? (
            <p className="text-xs text-destructive">{errors.day.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mes</Label>
          <Select
            value={watchedMonth ? String(watchedMonth) : ""}
            onValueChange={(v) => { if (v) setValue("month", Number(v)); }}
          >
            <SelectTrigger className="w-full">
              <span>{watchedMonth ? MONTHS[watchedMonth - 1] : "Mes"}</span>
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.month ? (
            <p className="text-xs text-destructive">{errors.month.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ae-year" className="text-xs">Año (opc.)</Label>
          <Input
            id="ae-year"
            type="number"
            min={1900}
            max={2100}
            placeholder="Año"
            {...register("year", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
          {errors.year ? (
            <p className="text-xs text-destructive">{errors.year.message}</p>
          ) : null}
        </div>
      </div>

      {/* Recurrencia */}
      <div className="space-y-1.5 max-w-[14rem]">
        <Label className="text-xs">Recurrencia</Label>
        <Select
          value={watchedRecurring === false ? "false" : "true"}
          onValueChange={(v) => { if (v) setValue("recurring", v === "true"); }}
        >
          <SelectTrigger className="w-full">
            <span>{watchedRecurring === false ? "Fecha única" : "Todos los años"}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Todos los años</SelectItem>
            <SelectItem value="false">Fecha única</SelectItem>
          </SelectContent>
        </Select>
        {watchedRecurring === false && !watchedYear ? (
          <p className="text-xs text-muted-foreground">
            Indica el año (obligatorio para fechas únicas).
          </p>
        ) : null}
      </div>

      {/* Presupuesto */}
      <BudgetRangeSlider
        minValue={watchedBudgetMin}
        maxValue={watchedBudgetMax}
        onMinChange={(v) => setValue("budgetMinEuros", v)}
        onMaxChange={(v) => setValue("budgetMaxEuros", v)}
        minError={errors.budgetMinEuros?.message}
        maxError={errors.budgetMaxEuros?.message}
      />

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit(onAdd)}>Añadir evento</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Events section ───────────────────────────────────────────────────────────

function EventsSection({
  control,
}: {
  control: Control<PersonFormValues>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { fields, append, remove } = useFieldArray({ control, name: "dates" });

  const handleAdd = (values: ImportantDateFormValues) => {
    append(values);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
        <CalendarDays className="size-3.5" aria-hidden />
        Eventos (opcional)
      </p>
      <p className="text-xs text-muted-foreground">
        Añade cumpleaños, aniversarios u otras fechas clave para recibir un aviso con tiempo y no pillarte por sorpresa.
      </p>

      {/* List of added events */}
      {fields.map((field, idx) => (
        <div
          key={field.id}
          className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 text-sm"
        >
          <div>
            <span className="font-medium">{field.label}</span>
            <span className="ml-2 text-muted-foreground">
              {formatEventDate(field.day, field.month, field.year)}
            </span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => remove(idx)}
            aria-label="Quitar evento"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      {/* Add form or button */}
      {showAddForm ? (
        <AddEventForm
          onAdd={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden />
          Añadir evento
        </button>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface PersonFormProps {
  defaultValues?: Partial<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  submitLabel: string;
  includeDates?: boolean;
  onCancel?: () => void;
}

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel,
  includeDates = false,
  onCancel,
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
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* ── Left column: identity ── */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Avatar</Label>
            <Controller
              name="avatarUrl"
              control={control}
              render={({ field }) => (
                <AvatarPicker value={field.value} onChange={field.onChange} />
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
                  <SelectTrigger className="w-full">
                    <span>
                      {RELATIONSHIPS.find((r) => r.value === field.value)?.label ?? "Selecciona relación"}
                    </span>
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
                <InterestTagInput value={field.value} onChange={field.onChange} />
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
        </div>

        {/* ── Right column: practical info + events ── */}
        <div className="space-y-5">
          <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/40 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
              <Ruler className="size-3.5" aria-hidden />
              Datos prácticos (opcional)
            </p>
            <p className="text-xs text-muted-foreground">
              Cuanto más sepamos, mejores sugerencias de regalo recibirás. Las tallas y restricciones evitan regalos que no se pueden usar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shoeSize">Talla de zapato</Label>
                <Input id="shoeSize" placeholder="EU 42, 38…" {...register("shoeSize")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clothingSize">Talla de ropa</Label>
                <Input id="clothingSize" placeholder="M, L, 38…" {...register("clothingSize")} />
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

          {includeDates ? <EventsSection control={control} /> : null}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}
