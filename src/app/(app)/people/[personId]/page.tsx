"use client";

import Link from "next/link";
import { use } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ImportantDateForm } from "@/components/people/ImportantDateForm";
import { RELATIONSHIPS } from "@/lib/schemas";

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const formatBudget = (cents?: number) =>
  cents === undefined ? null : `${(cents / 100).toFixed(0)}€`;

export default function PersonDetailPage({
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
  const dates = useQuery(
    api.importantDates.getByPerson,
    ready ? { personId: id } : "skip",
  );

  const removePerson = useMutation(api.people.remove);
  const removeDate = useMutation(api.importantDates.remove);

  if (!ready || person === undefined || dates === undefined) {
    return <p className="p-8 text-muted-foreground">Cargando…</p>;
  }

  if (person === null) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-8">
        <p>Persona no encontrada.</p>
        <Link href="/people" className={buttonVariants({ variant: "outline" })}>
          Volver
        </Link>
      </main>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a ${person.name}? Esto borra también sus fechas.`)) {
      return;
    }
    try {
      await removePerson({ id });
      toast.success("Persona eliminada");
      router.push("/people");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  };

  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;

  const budgetMin = formatBudget(person.budgetMin);
  const budgetMax = formatBudget(person.budgetMax);
  const budget =
    budgetMin && budgetMax
      ? `${budgetMin} – ${budgetMax}`
      : budgetMin || budgetMax;

  return (
    <main className="flex flex-1 flex-col gap-8 p-8">
      <header className="flex items-start gap-5">
        <Avatar className="size-20">
          {person.photoUrl ? <AvatarImage src={person.photoUrl} /> : null}
          <AvatarFallback className="text-lg">
            {person.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{person.name}</h1>
          <p className="text-sm text-muted-foreground">{relationshipLabel}</p>
          {budget ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Presupuesto:</span>{" "}
              {budget}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/people/${person._id}/gifts`}
            className={buttonVariants()}
          >
            Ideas de regalo
          </Link>
          <Link
            href={`/people/${person._id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            Editar
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </header>

      {person.interests.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Intereses
          </h2>
          <div className="flex flex-wrap gap-2">
            {person.interests.map((i) => (
              <Badge key={i} variant="secondary">
                {i}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {person.notes ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Notas</h2>
          <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Fechas importantes
        </h2>
        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay fechas guardadas.
          </p>
        ) : (
          <ul className="space-y-2">
            {dates.map((d) => (
              <li
                key={d._id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span>
                  <span className="font-medium">{d.label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {d.day} {MONTHS[d.month - 1]}
                    {d.year ? ` ${d.year}` : ""}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await removeDate({ id: d._id });
                      toast.success("Fecha eliminada");
                    } catch (err) {
                      toast.error(
                        err instanceof Error ? err.message : "Error",
                      );
                    }
                  }}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <ImportantDateForm personId={id} />
      </section>
    </main>
  );
}
