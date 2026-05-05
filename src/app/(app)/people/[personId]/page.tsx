"use client";

import Link from "next/link";
import { use, useState } from "react";
import { CalendarX2, Pencil, PencilLine, Repeat2, Sparkles, Trash2, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditImportantDateInline, ImportantDateForm } from "@/components/people/ImportantDateForm";
import { GiftHistoryForm } from "@/components/people/GiftHistoryForm";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { RELATIONSHIPS, REACTIONS } from "@/lib/schemas";

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

  const giftHistory = useQuery(
    api.giftHistory.getByPerson,
    ready ? { personId: id } : "skip",
  );

  const removePerson = useMutation(api.people.remove);
  const removeDate = useMutation(api.importantDates.remove);
  const removeHistoryEntry = useMutation(api.giftHistory.remove);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingDate, setEditingDate] = useState<NonNullable<typeof dates>[number] | null>(null);

  if (!ready || person === undefined || dates === undefined || giftHistory === undefined) {
    return <LoadingFallback />;
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
    setDeleting(true);
    try {
      await removePerson({ id });
      toast.success("Persona eliminada");
      router.push("/people");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
      setDeleting(false);
    }
  };

  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 w-full max-w-6xl">
      <Link
        href="/people"
        className="text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        ← Personas
      </Link>

      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar className="size-24 ring-1 ring-border">
          {person.avatarUrl ? (
            <AvatarImage src={person.avatarUrl} alt={person.name} />
          ) : null}
          <AvatarFallback className="text-xl">
            {person.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1.5">
          <h1 className="text-4xl font-medium leading-tight">{person.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{relationshipLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/people/${person._id}/gifts`}
            className={buttonVariants()}
          >
            <Sparkles className="size-4" aria-hidden />
            Ideas de regalo
          </Link>
          <Link
            href={`/people/${person._id}/edit`}
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Editar"
            title="Editar"
          >
            <Pencil className="size-4" aria-hidden />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Eliminar"
            title="Eliminar"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar a {person.name}?</DialogTitle>
            <DialogDescription>
              Se borrarán también todos sus eventos. Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={deleting}>
                  Cancelar
                </Button>
              }
            />
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Intereses
            </h2>
            {person.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {person.interests.map((i) => (
                  <Badge key={i} variant="outline">
                    {i}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aún no has anotado intereses. Edita la persona para añadirlos.
              </p>
            )}

            {person.notes ? (
              <>
                <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground pt-2">
                  Notas
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {person.notes}
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Eventos
            </h2>

            {dates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay eventos guardados. Añade el primero abajo.
              </p>
            ) : (
              <ul className="space-y-2">
                {dates.map((d) => (
                  <li key={d._id}>
                    {editingDate?._id === d._id ? (
                      <EditImportantDateInline
                        date={d}
                        onClose={() => setEditingDate(null)}
                      />
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <span className="font-medium">{d.label}</span>
                          {d.recurring === false ? (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <CalendarX2 className="size-3" aria-hidden />
                              Única
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <Repeat2 className="size-3" aria-hidden />
                              Anual
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {" · "}
                            {d.day} {MONTHS[d.month - 1]}
                            {d.year ? ` ${d.year}` : ""}
                            {(d.budgetMin !== undefined || d.budgetMax !== undefined) && (
                              <>
                                {" · "}
                                {d.budgetMin !== undefined && d.budgetMax !== undefined
                                  ? `${(d.budgetMin / 100).toFixed(0)}€ – ${(d.budgetMax / 100).toFixed(0)}€`
                                  : d.budgetMin !== undefined
                                    ? `desde ${(d.budgetMin / 100).toFixed(0)}€`
                                    : `hasta ${(d.budgetMax! / 100).toFixed(0)}€`}
                              </>
                            )}
                          </span>
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Editar evento"
                            title="Editar evento"
                            onClick={() => setEditingDate(d)}
                          >
                            <PencilLine className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Quitar evento"
                            title="Quitar evento"
                            onClick={async () => {
                              try {
                                await removeDate({ id: d._id });
                                toast.success("Evento eliminado");
                              } catch (err) {
                                toast.error(
                                  err instanceof Error ? err.message : "No se pudo eliminar el evento",
                                );
                              }
                            }}
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <ImportantDateForm personId={id} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Historial de regalos
          </h2>

          {giftHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay regalos registrados. Añade el primero para que la IA
              aprenda qué funciona y qué no.
            </p>
          ) : (
            <ul className="space-y-2">
              {giftHistory.map((h) => {
                const reaction = REACTIONS.find((r) => r.value === h.reaction);
                return (
                  <li
                    key={h._id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span aria-hidden className="text-base shrink-0">
                        {reaction?.emoji}
                      </span>
                      <span className="truncate">
                        <span className="font-medium">{h.giftName}</span>
                        <span className="text-muted-foreground">
                          {" · "}
                          {h.occasionLabel}
                          {h.year ? ` ${h.year}` : ""}
                        </span>
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Quitar entrada"
                      title="Quitar entrada"
                      onClick={async () => {
                        try {
                          await removeHistoryEntry({ id: h._id });
                          toast.success("Entrada eliminada");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "No se pudo eliminar la entrada",
                          );
                        }
                      }}
                    >
                      <X className="size-3.5" aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <GiftHistoryForm personId={id} />
        </CardContent>
      </Card>
    </main>
  );
}
