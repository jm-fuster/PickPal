"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { PersonForm } from "@/components/people/PersonForm";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import type { PersonFormValues } from "@/lib/schemas";

export default function EditPersonPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = use(params);
  const id = personId as Id<"people">;
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;

  const person = useQuery(api.people.getById, ready ? { id } : "skip");
  const update = useMutation(api.people.update);

  if (!ready || person === undefined) {
    return <LoadingFallback />;
  }
  if (person === null) {
    return <p className="p-8">Persona no encontrada.</p>;
  }

  const onSubmit = async (values: PersonFormValues) => {
    await update({
      id,
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
      shoeSize: values.shoeSize || undefined,
      clothingSize: values.clothingSize || undefined,
      allergies: values.allergies || undefined,
      dislikes: values.dislikes || undefined,
      avatarUrl: values.avatarUrl || undefined,
    });
    toast.success("Persona actualizada");
    router.push(`/people/${id}`);
  };

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Editar {person.name}
      </h1>
      <PersonForm
        defaultValues={{
          name: person.name,
          relationship: person.relationship,
          interests: person.interests,
          notes: person.notes ?? "",
          budgetMinEuros:
            person.budgetMin !== undefined ? person.budgetMin / 100 : undefined,
          budgetMaxEuros:
            person.budgetMax !== undefined ? person.budgetMax / 100 : undefined,
          shoeSize: person.shoeSize ?? "",
          clothingSize: person.clothingSize ?? "",
          allergies: person.allergies ?? "",
          dislikes: person.dislikes ?? "",
          avatarUrl: person.avatarUrl ?? undefined,
        }}
        onSubmit={onSubmit}
        submitLabel="Guardar cambios"
      />
    </main>
  );
}
