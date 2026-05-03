"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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

interface PersonFormProps {
  defaultValues?: Partial<PersonFormValues>;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  submitLabel: string;
}

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel,
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
      photoUrl: "",
      ...defaultValues,
    },
  });

  const submit = async (values: PersonFormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5 max-w-xl">
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="budgetMinEuros">Presupuesto mín. (€)</Label>
          <Input
            id="budgetMinEuros"
            type="number"
            min={0}
            step={1}
            {...register("budgetMinEuros", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
          {errors.budgetMinEuros ? (
            <p className="text-xs text-destructive">
              {errors.budgetMinEuros.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="budgetMaxEuros">Presupuesto máx. (€)</Label>
          <Input
            id="budgetMaxEuros"
            type="number"
            min={0}
            step={1}
            {...register("budgetMaxEuros", {
              setValueAs: (v) => (v === "" || v === null ? undefined : Number(v)),
            })}
          />
          {errors.budgetMaxEuros ? (
            <p className="text-xs text-destructive">
              {errors.budgetMaxEuros.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photoUrl">URL foto (opcional)</Label>
        <Input
          id="photoUrl"
          type="url"
          placeholder="https://…"
          {...register("photoUrl")}
        />
        {errors.photoUrl ? (
          <p className="text-xs text-destructive">{errors.photoUrl.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
