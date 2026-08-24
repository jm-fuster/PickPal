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
      favoriteBrands: values.favoriteBrands.length > 0 ? values.favoriteBrands : undefined,
      notes: values.notes || undefined,
      shoeSize: values.shoeSize || undefined,
      clothingSize: values.clothingSize || undefined,
      allergies: values.allergies || undefined,
      dislikes: values.dislikes || undefined,
      avatarUrl: values.avatarUrl || undefined,
    });

    if (values.dates.length > 0) {
      const results = await Promise.allSettled(
        values.dates.map((d) => {
          const { budgetMinEuros, budgetMaxEuros, ...rest } = d;
          return createDate({
            personId: id,
            ...rest,
            budgetMin: budgetMinEuros !== undefined ? Math.round(budgetMinEuros * 100) : undefined,
            budgetMax: budgetMaxEuros !== undefined ? Math.round(budgetMaxEuros * 100) : undefined,
          });
        }),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toast.warning(
          `Persona creada, pero ${failed} fecha${failed === 1 ? "" : "s"} no se guardó.`,
        );
        router.replace(`/seres-queridos/${id}`);
        return;
      }
    }

    toast.success("Persona creada");
    router.replace(`/seres-queridos/${id}`);
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-medium">Nueva persona</h1>
        <p className="text-sm text-muted-foreground">
          Solo el nombre es obligatorio. Lo demás puedes rellenarlo ahora o cuando quieras.
        </p>
      </div>
      <PersonForm
        onSubmit={onSubmit}
        submitLabel="Crear persona"
        includeDates
        onCancel={() => router.push("/seres-queridos")}
      />
    </main>
  );
}
