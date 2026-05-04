"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { PersonForm } from "@/components/people/PersonForm";
import type { PersonFormValues } from "@/lib/schemas";

export default function NewPersonPage() {
  const router = useRouter();
  const create = useMutation(api.people.create);
  const createDate = useMutation(api.importantDates.create);

  const onSubmit = async (values: PersonFormValues) => {
    const id = await create({
      name: values.name,
      relationship: values.relationship,
      interests: values.interests,
      notes: values.notes || undefined,
      budgetMin:
        values.budgetMinEuros !== undefined
          ? Math.round(values.budgetMinEuros * 100)
          : undefined,
      budgetMax:
        values.budgetMaxEuros !== undefined
          ? Math.round(values.budgetMaxEuros * 100)
          : undefined,
    });

    if (values.dates.length > 0) {
      const results = await Promise.allSettled(
        values.dates.map((d) =>
          createDate({
            personId: id,
            label: d.label,
            month: d.month,
            day: d.day,
            year: d.year,
          }),
        ),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.warning(
          `Persona creada, pero ${failed} fecha${failed === 1 ? "" : "s"} no se guardó.`,
        );
        router.push(`/people/${id}`);
        return;
      }
    }

    toast.success("Persona creada");
    router.push(`/people/${id}`);
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold tracking-tight">Nueva persona</h1>
      <PersonForm
        onSubmit={onSubmit}
        submitLabel="Crear persona"
        includeDates
      />
    </main>
  );
}
