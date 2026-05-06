"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  CalendarX2, Camera, PencilLine, Repeat2, Sparkles, Trash2, X,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import { EditImportantDateInline, ImportantDateForm } from "@/components/people/ImportantDateForm";
import { EditGiftHistoryInline, GiftHistoryForm } from "@/components/people/GiftHistoryForm";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { AvatarPicker } from "@/components/people/AvatarPicker";
import { InterestTagInput } from "@/components/people/InterestTagInput";
import { RELATIONSHIPS, REACTIONS } from "@/lib/schemas";

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

// ─── Inner component — person is guaranteed loaded ────────────────────────────

type Person = NonNullable<Awaited<ReturnType<typeof api.people.getById>>>;
type Dates = NonNullable<Awaited<ReturnType<typeof api.importantDates.getByPerson>>>;
type GiftHistory = NonNullable<Awaited<ReturnType<typeof api.giftHistory.getByPerson>>>;

function PersonDetailContent({
  person,
  dates,
  giftHistory,
}: {
  person: Person;
  dates: Dates;
  giftHistory: GiftHistory;
}) {
  const id = person._id as Id<"people">;
  const router = useRouter();
  const updatePerson = useMutation(api.people.update);
  const removePerson = useMutation(api.people.remove);
  const removeDate = useMutation(api.importantDates.remove);
  const removeHistoryEntry = useMutation(api.giftHistory.remove);

  // ── Header ──
  const [headerName, setHeaderName] = useState(person.name);
  const [headerRelationship, setHeaderRelationship] = useState(person.relationship);
  const [headerAvatar, setHeaderAvatar] = useState<string | undefined>(person.avatarUrl);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [headerSaving, setHeaderSaving] = useState(false);
  const headerDirty =
    headerName.trim() !== person.name ||
    headerRelationship !== person.relationship ||
    headerAvatar !== person.avatarUrl;

  // ── Interests + Notes ──
  const [localInterests, setLocalInterests] = useState<string[]>(person.interests);
  const [localNotes, setLocalNotes] = useState(person.notes ?? "");
  const [interestsSaving, setInterestsSaving] = useState(false);
  const interestsDirty =
    JSON.stringify(localInterests) !== JSON.stringify(person.interests) ||
    localNotes !== (person.notes ?? "");

  // ── Practical data ──
  const [localShoeSize, setLocalShoeSize] = useState(person.shoeSize ?? "");
  const [localClothingSize, setLocalClothingSize] = useState(person.clothingSize ?? "");
  const [localAllergies, setLocalAllergies] = useState(person.allergies ?? "");
  const [localDislikes, setLocalDislikes] = useState(person.dislikes ?? "");
  const [practicalSaving, setPracticalSaving] = useState(false);
  const practicalDirty =
    localShoeSize !== (person.shoeSize ?? "") ||
    localClothingSize !== (person.clothingSize ?? "") ||
    localAllergies !== (person.allergies ?? "") ||
    localDislikes !== (person.dislikes ?? "");

  // ── Delete / inline edit / nav guard ──
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingDate, setEditingDate] = useState<Dates[number] | null>(null);
  const [editingGift, setEditingGift] = useState<GiftHistory[number] | null>(null);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const anyDirty = headerDirty || interestsDirty || practicalDirty;

  useEffect(() => {
    if (!anyDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [anyDirty]);

  const navigateSafe = (href: string) => {
    if (anyDirty) { setPendingNav(href); } else { router.push(href); }
  };

  // ── Save handlers ──
  const saveHeader = async () => {
    if (!headerName.trim()) { toast.error("El nombre no puede estar vacío"); return; }
    setHeaderSaving(true);
    try {
      await updatePerson({ id, name: headerName.trim(), relationship: headerRelationship, avatarUrl: headerAvatar });
      toast.success("Cambios guardados");
    } catch { toast.error("No se pudo guardar"); }
    finally { setHeaderSaving(false); }
  };

  const saveInterests = async () => {
    setInterestsSaving(true);
    try {
      await updatePerson({ id, interests: localInterests, notes: localNotes || undefined });
      toast.success("Cambios guardados");
    } catch { toast.error("No se pudo guardar"); }
    finally { setInterestsSaving(false); }
  };

  const savePractical = async () => {
    setPracticalSaving(true);
    try {
      await updatePerson({
        id,
        shoeSize: localShoeSize || undefined,
        clothingSize: localClothingSize || undefined,
        allergies: localAllergies || undefined,
        dislikes: localDislikes || undefined,
      });
      toast.success("Cambios guardados");
    } catch { toast.error("No se pudo guardar"); }
    finally { setPracticalSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removePerson({ id });
      toast.success("Persona eliminada");
      router.push("/people");
    } catch { toast.error("Algo salió mal"); setDeleting(false); }
  };

  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ?? person.relationship;

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 w-full max-w-6xl">
      <button
        type="button"
        onClick={() => navigateSafe("/people")}
        className="text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        ← Seres queridos
      </button>

      {/* ── Header ── */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Avatar with camera overlay */}
        <div className="relative shrink-0 w-24 h-24 group">
          <Avatar className="size-24 ring-1 ring-border">
            {headerAvatar ? <AvatarImage src={headerAvatar} alt={headerName} /> : null}
            <AvatarFallback className="text-xl">
              {headerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => setAvatarDialogOpen(true)}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Cambiar avatar"
          >
            <Camera className="size-6 text-white" />
          </button>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {/* Name input styled as heading */}
          <input
            value={headerName}
            onChange={(e) => setHeaderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveHeader()}
            className="w-full text-4xl font-medium bg-transparent border-0 border-b-2 border-transparent outline-none focus:border-primary/40 transition-colors leading-tight"
            aria-label="Nombre"
          />
          {/* Relationship select */}
          <Select value={headerRelationship} onValueChange={setHeaderRelationship}>
            <SelectTrigger className="w-fit border-0 border-b-2 border-transparent focus:border-primary/40 bg-transparent h-auto py-0.5 pl-0 text-sm text-muted-foreground">
              <span>{RELATIONSHIPS.find((r) => r.value === headerRelationship)?.label ?? headerRelationship}</span>
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href={`/people/${person._id}/gifts`} className={buttonVariants()}>
            <Sparkles className="size-4" aria-hidden />
            Ideas de regalo
          </Link>
          {headerDirty && (
            <Button size="sm" onClick={saveHeader} disabled={headerSaving}>
              {headerSaving ? "Guardando…" : "Guardar"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Eliminar"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

      {/* Avatar picker dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar avatar</DialogTitle>
          </DialogHeader>
          <AvatarPicker
            value={headerAvatar}
            onChange={(url) => {
              setHeaderAvatar(url);
              if (url) setAvatarDialogOpen(false);
            }}
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cerrar</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved changes nav guard */}
      <Dialog open={pendingNav !== null} onOpenChange={(o) => !o && setPendingNav(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambios sin guardar</DialogTitle>
            <DialogDescription>
              Tienes cambios sin guardar. Si sales ahora se perderán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingNav(null)}>Quedarme</Button>
            <Button variant="destructive" onClick={() => { router.push(pendingNav!); setPendingNav(null); }}>
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar a {person.name}?</DialogTitle>
            <DialogDescription>
              Se borrarán también todos sus eventos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={deleting}>Cancelar</Button>} />
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ── Interests + Notes card ── */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Intereses
              </h2>
              {interestsDirty && (
                <Button size="sm" onClick={saveInterests} disabled={interestsSaving}>
                  {interestsSaving ? "Guardando…" : "Guardar"}
                </Button>
              )}
            </div>
            <InterestTagInput value={localInterests} onChange={setLocalInterests} />

            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground pt-2">
              Notas
            </h2>
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              rows={4}
              placeholder="Restricciones, preferencias, contexto…"
            />
          </CardContent>
        </Card>

        {/* ── Events card ── */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
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
                      <EditImportantDateInline date={d} onClose={() => setEditingDate(null)} />
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <span className="font-medium">{d.label}</span>
                          {d.recurring === false ? (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <CalendarX2 className="size-3" aria-hidden />Única
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <Repeat2 className="size-3" aria-hidden />Anual
                            </Badge>
                          )}
                          <span className="text-muted-foreground">
                            {" · "}{d.day} {MONTHS[d.month - 1]}{d.year ? ` ${d.year}` : ""}
                            {(d.budgetMin !== undefined || d.budgetMax !== undefined) && (
                              <>{" · "}{d.budgetMin !== undefined && d.budgetMax !== undefined
                                ? `${(d.budgetMin / 100).toFixed(0)}€ – ${(d.budgetMax / 100).toFixed(0)}€`
                                : d.budgetMin !== undefined
                                  ? `desde ${(d.budgetMin / 100).toFixed(0)}€`
                                  : `hasta ${(d.budgetMax! / 100).toFixed(0)}€`}</>
                            )}
                          </span>
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon-sm" aria-label="Editar evento" onClick={() => setEditingDate(d)}>
                            <PencilLine className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm" aria-label="Quitar evento"
                            onClick={async () => {
                              try { await removeDate({ id: d._id }); toast.success("Evento eliminado"); }
                              catch { toast.error("No se pudo eliminar el evento"); }
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

      {/* ── Practical data card ── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Datos prácticos
            </h2>
            {practicalDirty && (
              <Button size="sm" onClick={savePractical} disabled={practicalSaving}>
                {practicalSaving ? "Guardando…" : "Guardar"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Tallas y restricciones que ayudan a la IA a sugerir regalos que realmente se pueden usar.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shoeSize">Talla de zapato</Label>
              <Input id="shoeSize" placeholder="EU 42, 38…" value={localShoeSize} onChange={(e) => setLocalShoeSize(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clothingSize">Talla de ropa</Label>
              <Input id="clothingSize" placeholder="M, L, 38…" value={localClothingSize} onChange={(e) => setLocalClothingSize(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allergies">Alergias o restricciones</Label>
            <Textarea id="allergies" rows={2} placeholder="Frutos secos, gluten, látex…" value={localAllergies} onChange={(e) => setLocalAllergies(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dislikes">Cosas que no le gustan</Label>
            <Textarea id="dislikes" rows={2} placeholder="Color amarillo, perfumes fuertes…" value={localDislikes} onChange={(e) => setLocalDislikes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* ── Gift history card ── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Historial de regalos
          </h2>
          {giftHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay regalos registrados. Añade el primero para que la IA aprenda qué funciona y qué no.
            </p>
          ) : (
            <ul className="space-y-2">
              {giftHistory.map((h) => {
                const reaction = REACTIONS.find((r) => r.value === h.reaction);
                return (
                  <li key={h._id}>
                    {editingGift?._id === h._id ? (
                      <EditGiftHistoryInline entry={h} onClose={() => setEditingGift(null)} />
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="truncate">
                            <span className="font-medium">{h.giftName}</span>
                            <span className="text-muted-foreground">
                              {" · "}{h.occasionLabel}{h.year ? ` ${h.year}` : ""}{reaction ? ` · ${reaction.label}` : ""}
                            </span>
                          </span>
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon-sm" aria-label="Editar regalo" onClick={() => setEditingGift(h)}>
                            <PencilLine className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm" aria-label="Quitar entrada"
                            onClick={async () => {
                              try { await removeHistoryEntry({ id: h._id }); toast.success("Entrada eliminada"); }
                              catch { toast.error("No se pudo eliminar la entrada"); }
                            }}
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                    )}
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

// ─── Page shell — loads data ──────────────────────────────────────────────────

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = use(params);
  const id = personId as Id<"people">;
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;

  const person = useQuery(api.people.getById, ready ? { id } : "skip");
  const dates = useQuery(api.importantDates.getByPerson, ready ? { personId: id } : "skip");
  const giftHistory = useQuery(api.giftHistory.getByPerson, ready ? { personId: id } : "skip");

  if (!ready || person === undefined || dates === undefined || giftHistory === undefined) {
    return <LoadingFallback />;
  }

  if (person === null) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-8">
        <p>Persona no encontrada.</p>
        <Link href="/people" className={buttonVariants({ variant: "outline" })}>Volver</Link>
      </main>
    );
  }

  return <PersonDetailContent person={person} dates={dates} giftHistory={giftHistory} />;
}
