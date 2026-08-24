"use client";

import Link from "next/link";
import { use, useRef, useState } from "react";
import {
  CalendarDays, CalendarX2, Camera, Check, ExternalLink, Gift, NotebookPen, PencilLine, Repeat2, Ruler, Star, Tags, Trash2, ThumbsUp, X,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EditImportantDateInline, ImportantDateForm } from "@/components/people/ImportantDateForm";
import { EditGiftHistoryInline, GiftHistoryForm } from "@/components/people/GiftHistoryForm";
import { BackLink } from "@/components/layout/BackLink";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { AvatarPickerDialog } from "@/components/people/AvatarPickerDialog";
import { InterestTagInput } from "@/components/people/InterestTagInput";
import { BrandTagInput } from "@/components/people/BrandTagInput";
import { AiNotesNotice } from "@/components/people/AiNotesNotice";
import { RELATIONSHIPS, REACTIONS } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { ALL_STORES, generateStoreSearchUrl, pickEffectiveStores, sanitizeFavoriteStores, STORE_ICONS, STORE_LABELS, type StoreId } from "@/lib/stores";
import { matchFavoriteBrands } from "@/lib/brands";
import { BrandStoreLink } from "@/components/gifts/BrandStoreLink";

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

const googleSearchUrl = (q: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(q)}`;

// ─── Inner component — person is guaranteed loaded ────────────────────────────

type Person = NonNullable<FunctionReturnType<typeof api.people.getById>>;
type Dates = NonNullable<FunctionReturnType<typeof api.importantDates.getByPerson>>;
type GiftHistory = NonNullable<FunctionReturnType<typeof api.giftHistory.getByPerson>>;
type SavedIdeas = NonNullable<FunctionReturnType<typeof api.savedIdeas.getByPerson>>;

const formatPriceRange = (min: number, max: number) =>
  min === max ? `${Math.round(min)}€` : `${Math.round(min)}–${Math.round(max)}€`;

function PersonDetailContent({
  person,
  dates,
  giftHistory,
  savedIdeas,
  favoriteStores,
}: {
  person: Person;
  dates: Dates;
  giftHistory: GiftHistory;
  savedIdeas: SavedIdeas;
  favoriteStores: StoreId[];
}) {
  const id = person._id as Id<"people">;
  const router = useRouter();
  const updatePerson = useMutation(api.people.update);
  const removePerson = useMutation(api.people.remove);
  const removeDate = useMutation(api.importantDates.remove);
  const removeHistoryEntry = useMutation(api.giftHistory.remove);
  const removeSavedIdea = useMutation(api.savedIdeas.remove);
  const createHistoryEntry = useMutation(api.giftHistory.create);

  // ── Local state (mirrors DB, kept in sync on every autosave) ──
  const [headerName, setHeaderName] = useState(person.name);
  const [headerRelationship, setHeaderRelationship] = useState(person.relationship);
  const [headerAvatar, setHeaderAvatar] = useState<string | undefined>(person.avatarUrl);
  const [localInterests, setLocalInterests] = useState<string[]>(person.interests);
  const [localBrands, setLocalBrands] = useState<string[]>(person.favoriteBrands ?? []);
  const [localNotes, setLocalNotes] = useState(person.notes ?? "");
  const [localShoeSize, setLocalShoeSize] = useState(person.shoeSize ?? "");
  const [localClothingSize, setLocalClothingSize] = useState(person.clothingSize ?? "");
  const [localAllergies, setLocalAllergies] = useState(person.allergies ?? "");
  const [localDislikes, setLocalDislikes] = useState(person.dislikes ?? "");

  // ── Saved indicator ──
  const [savedRecently, setSavedRecently] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Delete / inline edit ──
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingDate, setEditingDate] = useState<Dates[number] | null>(null);
  const [editingGift, setEditingGift] = useState<GiftHistory[number] | null>(null);

  // ── Convert saved idea to history ──
  const [convertingIdea, setConvertingIdea] = useState<SavedIdeas[number] | null>(null);
  const [convertReaction, setConvertReaction] = useState("");
  const [convertYear, setConvertYear] = useState<string>("");
  const [convertNotes, setConvertNotes] = useState("");
  const [converting, setConverting] = useState(false);

  // ── Shared save (silent on success, toast on error) ──
  type SaveFields = {
    name?: string; relationship?: string; interests?: string[];
    favoriteBrands?: string[];
    notes?: string; shoeSize?: string; clothingSize?: string;
    allergies?: string; dislikes?: string; avatarUrl?: string;
  };
  const save = async (fields: SaveFields) => {
    try {
      await updatePerson({ id, ...fields });
      clearTimeout(savedTimerRef.current);
      setSavedRecently(true);
      savedTimerRef.current = setTimeout(() => setSavedRecently(false), 2000);
    } catch {
      toast.error("No se pudo guardar");
    }
  };

  const handleConvertToHistory = async () => {
    if (!convertingIdea || !convertReaction) return;
    // El <input type=number> no impide teclear años fuera de [1900, 2100]; sin
    // este guard el server los rechaza con un toast genérico. Validamos antes
    // para dar un mensaje preciso.
    const year = convertYear ? parseInt(convertYear, 10) : undefined;
    if (year !== undefined && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
      toast.error("El año debe estar entre 1900 y 2100.");
      return;
    }
    setConverting(true);
    try {
      await createHistoryEntry({
        personId: id,
        giftName: convertingIdea.title,
        occasionLabel: convertingIdea.occasionLabel,
        year,
        reaction: convertReaction as "loved" | "ok" | "bad",
        notes: convertNotes || undefined,
      });
      await removeSavedIdea({ id: convertingIdea._id });
      toast.success("Añadido al historial de regalos");
      setConvertingIdea(null);
      setConvertReaction("");
      setConvertYear("");
      setConvertNotes("");
    } catch {
      toast.error("No se pudo guardar en el historial");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removePerson({ id });
      toast.success("Persona eliminada");
      router.push("/seres-queridos");
    } catch { toast.error("Algo salió mal"); setDeleting(false); }
  };

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 w-full max-w-6xl">
      {/* Título de página para navegación por encabezados (el nombre visible es un input editable) */}
      <h1 className="sr-only">{headerName}</h1>
      <BackLink />

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
          <AvatarPickerDialog
            value={headerAvatar}
            onChange={(url) => { setHeaderAvatar(url); if (url) save({ avatarUrl: url }); }}
            trigger={
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cambiar avatar"
              >
                <Camera className="size-6 text-white" />
              </button>
            }
          />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          {/* Name — autosave on blur / Enter */}
          <input
            value={headerName}
            onChange={(e) => setHeaderName(e.target.value)}
            onBlur={() => { if (headerName.trim()) save({ name: headerName.trim() }); }}
            onKeyDown={(e) => { if (e.key === "Enter" && headerName.trim()) { (e.target as HTMLInputElement).blur(); } }}
            className="w-full text-4xl font-medium bg-transparent border-0 border-b-2 border-transparent outline-none focus:border-primary/40 transition-colors leading-tight"
            aria-label="Nombre"
          />
          {/* Relationship — autosave on change */}
          <Select
            value={headerRelationship}
            onValueChange={(v) => {
              if (!v) return;
              setHeaderRelationship(v);
              save({ relationship: v });
            }}
          >
            <SelectTrigger aria-label="Relación" className="w-fit">
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
          <Link href={`/seres-queridos/${person._id}/gifts?from=person`} className={buttonVariants()}>
            <Gift className="size-4" aria-hidden />
            Ideas de regalo
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label={`Eliminar a ${person.name}`}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </header>

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
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
              <Star className="size-3.5" aria-hidden />
              Intereses
            </h2>
            {/* Interests — autosave on each tag change */}
            <InterestTagInput
              value={localInterests}
              onChange={(tags) => {
                setLocalInterests(tags);
                save({ interests: tags });
              }}
            />

            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2 pt-2">
              <Tags className="size-3.5" aria-hidden />
              Marcas favoritas
            </h2>
            <p className="text-xs text-muted-foreground">
              Si tiene predilección por alguna marca, la IA la tendrá en cuenta y sus recomendaciones podrán enlazar a la tienda oficial de la marca.
            </p>
            {/* Favorite brands — autosave on each tag change */}
            <BrandTagInput
              value={localBrands}
              onChange={(tags) => {
                setLocalBrands(tags);
                save({ favoriteBrands: tags });
              }}
            />

            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2 pt-2">
              <NotebookPen className="size-3.5" aria-hidden />
              Notas
            </h2>
            {/* Notes — autosave on blur */}
            <Textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => save({ notes: localNotes || undefined })}
              rows={4}
              placeholder="Restricciones, preferencias, contexto…"
            />
            <AiNotesNotice />
          </CardContent>
        </Card>

        {/* ── Events card ── */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
              <CalendarDays className="size-3.5" aria-hidden />
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
                      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
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
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {d.day} {MONTHS[d.month - 1]}{d.year ? ` ${d.year}` : ""}
                          </p>
                          {(d.budgetMin !== undefined || d.budgetMax !== undefined) && (
                            <p className="text-xs text-muted-foreground">
                              Presupuesto:{" "}
                              {d.budgetMin !== undefined && d.budgetMax !== undefined
                                ? `${(d.budgetMin / 100).toFixed(0)}€ – ${(d.budgetMax / 100).toFixed(0)}€`
                                : d.budgetMin !== undefined
                                  ? `desde ${(d.budgetMin / 100).toFixed(0)}€`
                                  : `hasta ${(d.budgetMax! / 100).toFixed(0)}€`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
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
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <Ruler className="size-3.5" aria-hidden />
            Datos prácticos
          </h2>
          <p className="text-xs text-muted-foreground">
            Tallas y restricciones que ayudan a la IA a sugerir regalos que realmente se pueden usar.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shoeSize">Talla de zapato</Label>
              <Input
                id="shoeSize"
                placeholder="EU 42, 38…"
                value={localShoeSize}
                onChange={(e) => setLocalShoeSize(e.target.value)}
                onBlur={() => save({ shoeSize: localShoeSize || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clothingSize">Talla de ropa</Label>
              <Input
                id="clothingSize"
                placeholder="M, L, 38…"
                value={localClothingSize}
                onChange={(e) => setLocalClothingSize(e.target.value)}
                onBlur={() => save({ clothingSize: localClothingSize || undefined })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias o restricciones</Label>
            <Textarea
              id="allergies"
              rows={2}
              placeholder="Frutos secos, gluten, látex…"
              value={localAllergies}
              onChange={(e) => setLocalAllergies(e.target.value)}
              onBlur={() => save({ allergies: localAllergies || undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dislikes">Cosas que no le gustan</Label>
            <Textarea
              id="dislikes"
              rows={2}
              placeholder="Color amarillo, perfumes fuertes…"
              value={localDislikes}
              onChange={(e) => setLocalDislikes(e.target.value)}
              onBlur={() => save({ dislikes: localDislikes || undefined })}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Autosave indicator (fixed, always visible) ──
          El texto se renderiza condicionalmente DENTRO de la región aria-live:
          un cambio de opacidad no se anuncia; la inserción de contenido sí. */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-md transition-all duration-300 ${
          savedRecently ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {savedRecently ? (
          <>
            <Check className="size-3" aria-hidden />
            Guardado
          </>
        ) : null}
      </div>

      {/* ── Saved ideas card ── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <ThumbsUp className="size-3.5" aria-hidden />
            Ideas guardadas
          </h2>
          {savedIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Las ideas que guardes desde el panel de sugerencias aparecerán aquí para convertirlas en historial cuando las regales.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {savedIdeas.map((s) => {
                const cats = Array.isArray(s.category) ? s.category : [s.category];
                // Mismas tiendas que mostró la card al generar: solo las físicas
                // (e ideas viejas sin tipo) muestran chips; experiencias, planes
                // y sorpréndeme → Google. Las ideas nuevas ya guardan el snapshot
                // de tiendas efectivas, así que se muestran tal cual; las viejas
                // sin ese dato caen al fallback de favoritas.
                const isPhysicalLike = !s.giftType || s.giftType === "fisica";
                const storeChips = !isPhysicalLike
                  ? []
                  : s.suggestedStores && s.suggestedStores.length > 0
                    ? sanitizeFavoriteStores(s.suggestedStores)
                    : favoriteStores;
                // Marcas favoritas que la idea menciona — misma heurística que la
                // card de generación. El badge sale para cualquier tipo; el botón
                // a la tienda de marca, solo en físicas (igual que los chips).
                const matchedBrands = matchFavoriteBrands(s, localBrands);
                return (
                  <li key={s._id}>
                    <div className="flex h-full flex-col gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium leading-snug line-clamp-2">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.occasionLabel} · {formatPriceRange(s.priceMinEuros, s.priceMaxEuros)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            className="text-xs h-7 px-2 hover:bg-primary/80"
                            onClick={() => {
                              setConvertingIdea(s);
                              setConvertReaction("");
                              setConvertYear("");
                              setConvertNotes("");
                            }}
                          >
                            Lo regalé
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Quitar idea guardada"
                            onClick={async () => {
                              try { await removeSavedIdea({ id: s._id }); }
                              catch { toast.error("No se pudo eliminar la idea"); }
                            }}
                          >
                            <X className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </div>
                      {s.description && (
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {matchedBrands.map((brand) => (
                          <Badge
                            key={`brand-${brand}`}
                            variant="outline"
                            className="gap-1 text-xs text-secondary border-secondary/40"
                          >
                            <Tags className="size-3" aria-hidden />
                            <span className="sr-only">Marca favorita: </span>
                            {brand}
                          </Badge>
                        ))}
                        {cats.map((c) => (
                          <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                      {s.amazonQuery && (
                        <div className="mt-auto flex flex-col gap-2 pt-1">
                          {isPhysicalLike && matchedBrands.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {matchedBrands.map((brand) => (
                                <BrandStoreLink
                                  key={`brand-${brand}`}
                                  brand={brand}
                                  query={s.amazonQuery}
                                  title={s.title}
                                  matchedBrandStores={s.matchedBrandStores}
                                  size="sm"
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                          {storeChips.length > 0 ? (
                            storeChips.map((store) => (
                              <a
                                key={store}
                                href={generateStoreSearchUrl(store, s.amazonQuery, {
                                  minEuros: s.priceMinEuros,
                                  maxEuros: s.priceMaxEuros,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Buscar ${s.title} en ${STORE_LABELS[store]} (abre en una pestaña nueva)`}
                                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={STORE_ICONS[store]} alt="" className="size-3.5 shrink-0 rounded-sm object-contain bg-white p-px" aria-hidden />
                                {STORE_LABELS[store]}
                                <ExternalLink className="size-3 shrink-0" aria-hidden />
                              </a>
                            ))
                          ) : (
                            <a
                              href={googleSearchUrl(s.amazonQuery)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Buscar ${s.title} (abre en una pestaña nueva)`}
                              className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                            >
                              Buscar
                              <ExternalLink className="size-3 shrink-0" aria-hidden />
                            </a>
                          )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Convert saved idea to history dialog ── */}
      <Dialog
        open={convertingIdea !== null}
        onOpenChange={(open) => { if (!open) setConvertingIdea(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir al historial de regalos</DialogTitle>
            <DialogDescription>
              {convertingIdea?.title} · {convertingIdea?.occasionLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reacción</Label>
              <Select value={convertReaction} onValueChange={(v) => setConvertReaction(v ?? "")}>
                <SelectTrigger aria-label="Reacción">
                  <SelectValue placeholder="¿Cómo le sentó?" />
                </SelectTrigger>
                <SelectContent>
                  {REACTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="convert-year">Año (opcional)</Label>
              <Input
                id="convert-year"
                type="number"
                min={1900}
                max={2100}
                placeholder={String(new Date().getFullYear())}
                value={convertYear}
                onChange={(e) => setConvertYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convert-notes">Notas (opcional)</Label>
              <Textarea
                id="convert-notes"
                rows={2}
                placeholder="Le encantó, pero la talla era pequeña…"
                value={convertNotes}
                onChange={(e) => setConvertNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={converting}>Cancelar</Button>} />
            <Button onClick={handleConvertToHistory} disabled={converting || !convertReaction}>
              {converting ? "Guardando…" : "Añadir al historial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Gift history card ── */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-2">
            <Gift className="size-3.5" aria-hidden />
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
                        <div className="flex items-center gap-1 shrink-0">
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
  const savedIdeas = useQuery(api.savedIdeas.getByPerson, ready ? { personId: id } : "skip");
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");

  if (!ready || person === undefined || dates === undefined || giftHistory === undefined || savedIdeas === undefined) {
    return <LoadingFallback />;
  }

  const favoriteStores =
    settings && settings.favoriteStores.length > 0
      ? sanitizeFavoriteStores(settings.favoriteStores)
      : [...ALL_STORES];

  if (person === null) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-8">
        <p>Persona no encontrada.</p>
        <Link href="/seres-queridos" className={cn(buttonVariants({ variant: "outline" }))}>Volver</Link>
      </main>
    );
  }

  // key fuerza el remount al navegar entre fichas (back/forward): el estado
  // local se siembra desde props una sola vez y, sin remount, la ficha B
  // mostraría datos de A y un blur de autosave los escribiría en B.
  return <PersonDetailContent key={person._id} person={person} dates={dates} giftHistory={giftHistory} savedIdeas={savedIdeas} favoriteStores={favoriteStores} />;
}
