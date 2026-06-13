"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Ticket,
  Heart,
  Shuffle,
  ArrowLeft,
  X,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { userErrorMessage } from "@/lib/errors";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GiftRecommendationCard } from "@/components/gifts/GiftRecommendationCard";
import { LoadingFallback } from "@/components/layout/LoadingFallback";
import { GIFT_TYPES, type GiftType, type GiftRecommendation } from "@/lib/gifts";
import { ALL_STORES, pickEffectiveStores, sanitizeFavoriteStores } from "@/lib/stores";

const formatBudget = (min?: number, max?: number) => {
  const toEur = (v: number) => Math.round(v / 100);
  if (min !== undefined && max !== undefined) return ` · ${toEur(min)}–${toEur(max)}€`;
  if (min !== undefined) return ` · desde ${toEur(min)}€`;
  if (max !== undefined) return ` · hasta ${toEur(max)}€`;
  return "";
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

interface GiftsPanelProps {
  personId: Id<"people">;
  initialOccasion?: string;
  embedded?: boolean;
  onClose?: () => void;
  backHref?: string;
}

export function GiftsPanel({
  personId,
  initialOccasion,
  embedded = false,
  onClose,
  backHref: _backHref = "/agenda",
}: GiftsPanelProps) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;

  const person = useQuery(api.people.getById, ready ? { id: personId } : "skip");
  const events = useQuery(
    api.importantDates.getByPerson,
    ready ? { personId } : "skip",
  );
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");
  const favoriteStores =
    settings && settings.favoriteStores.length > 0
      ? sanitizeFavoriteStores(settings.favoriteStores)
      : [...ALL_STORES];

  const [occasion, setOccasion] = useState(initialOccasion ?? "");
  const [giftType, setGiftType] = useState<GiftType>("fisica");
  const [ideas, setIdeas] = useState<GiftRecommendation[] | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHeaderRegen, setShowHeaderRegen] = useState(false);
  const [savedTitles, setSavedTitles] = useState<Set<string>>(new Set());
  const controlsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const removeIdea = useMutation(api.recommendations.removeIdea);
  const saveIdea = useMutation(api.savedIdeas.save);
  const pendingDiscards = useRef<
    Map<
      string,
      {
        idea: GiftRecommendation;
        insertAt: number;
        args: Parameters<typeof removeIdea>[0];
      }
    >
  >(new Map());

  useEffect(() => {
    return () => {
      pendingDiscards.current.forEach(({ args }) => {
        removeIdea(args).catch(() => {});
      });
      pendingDiscards.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!embedded) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const check = () => {
      const controls = controlsRef.current;
      if (!controls) { setShowHeaderRegen(false); return; }
      const controlsBottom = controls.getBoundingClientRect().bottom;
      const containerTop = container.getBoundingClientRect().top;
      setShowHeaderRegen(controlsBottom < containerTop);
    };
    check();
    container.addEventListener("scroll", check, { passive: true });
    return () => container.removeEventListener("scroll", check);
  }, [embedded, person]);

  useEffect(() => {
    if (embedded) return;
    const check = () => {
      const controls = controlsRef.current;
      if (!controls) { setShowHeaderRegen(false); return; }
      setShowHeaderRegen(controls.getBoundingClientRect().bottom < 0);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [embedded, person]);

  const cached = useQuery(
    api.recommendations.getByPersonOccasion,
    ready && occasion
      ? { personId, occasionLabel: occasion, giftType }
      : "skip",
  );

  if (!ready || person === undefined) {
    return embedded ? (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <LoadingFallback />
      </div>
    ) : (
      <LoadingFallback />
    );
  }

  if (person === null) {
    return (
      <div className="p-8 space-y-3">
        <p>Persona no encontrada.</p>
        {!embedded && (
          <Link href="/seres-queridos" className={cn(buttonVariants({ variant: "outline" }))}>
            Volver
          </Link>
        )}
      </div>
    );
  }

  const generate = async () => {
    setLoading(true);
    setIdeas(null);
    setSavedTitles(new Set());
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId, occasionLabel: occasion, giftType }),
      });
      if (!res.ok) {
        // `error` viene ya saneado por nuestra API route; nunca enseñamos
        // detalles internos del proveedor ni el status crudo.
        const data = await res.json().catch(() => ({}));
        toast.error(
          typeof data.error === "string"
            ? data.error
            : "No se pudieron generar ideas, inténtalo de nuevo",
        );
        return;
      }
      const data = (await res.json()) as {
        ideas: GiftRecommendation[];
        remaining?: number;
      };
      setIdeas(data.ideas);
      if (typeof data.remaining === "number") setRemaining(data.remaining);
    } catch {
      toast.error("No se pudieron generar ideas, inténtalo de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const hasCached = cached !== undefined && cached !== null;
  const showIdeas = ideas ?? (hasCached ? (cached!.ideas as GiftRecommendation[]) : null);

  const handleSave = async (idea: GiftRecommendation) => {
    if (!occasion) return;
    // Guard contra doble clic: el botón ya se deshabilita al guardar, pero
    // dos clics antes del primer render no deben crear dos filas.
    if (savedTitles.has(idea.title)) return;
    try {
      // Congelamos las tiendas EFECTIVAS que mostró la card (con el fallback a
      // favoritas), no las crudas de la IA, para que la idea guardada enseñe
      // exactamente lo mismo que se vio. Solo las físicas muestran tiendas.
      const effectiveStores =
        giftType === "fisica"
          ? pickEffectiveStores(favoriteStores, idea.suggestedStores).stores
          : undefined;
      await saveIdea({
        personId,
        occasionLabel: occasion,
        title: idea.title,
        description: idea.description,
        priceMinEuros: idea.priceMinEuros,
        priceMaxEuros: idea.priceMaxEuros,
        category: idea.category,
        amazonQuery: idea.amazonQuery,
        suggestedStores: effectiveStores,
        giftType,
        imageKey: idea.imageKey,
        image: idea.image,
      });
      setSavedTitles((prev) => new Set(prev).add(idea.title));
      toast.success(`Idea guardada en la ficha de ${person?.name ?? "esta persona"}`);
    } catch (err) {
      toast.error(userErrorMessage(err, "No se pudo guardar la idea"));
    }
  };

  const handleDiscard = (idea: GiftRecommendation, displayIndex: number) => {
    setIdeas((prev) => (prev ?? showIdeas ?? []).filter((_, i) => i !== displayIndex));

    const ideaCategories = Array.isArray(idea.category) ? idea.category : [idea.category];
    const args = { personId, occasionLabel: occasion, giftType, ideaTitle: idea.title, ideaCategories };
    pendingDiscards.current.set(idea.title, { idea, insertAt: displayIndex, args });

    toast("Descartada — la IA evitará ideas parecidas", {
      duration: Infinity,
      action: {
        label: "Deshacer",
        onClick: () => {
          const pending = pendingDiscards.current.get(idea.title);
          if (!pending) return;
          pendingDiscards.current.delete(idea.title);
          setIdeas((prev) => {
            const current = prev ?? [];
            const next = [...current];
            next.splice(pending.insertAt, 0, pending.idea);
            return next;
          });
        },
      },
      onDismiss: () => {
        if (!pendingDiscards.current.has(idea.title)) return;
        pendingDiscards.current.delete(idea.title);
        removeIdea(args).catch(() => {});
      },
    });
  };

  const content = (
    <div className="flex flex-col gap-6">
      {!embedded && (
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Volver
          </button>
          {person && (
            <Link
              href={`/seres-queridos/${personId}`}
              className="flex items-center gap-2.5 w-fit group"
            >
              <Avatar className="size-9 shrink-0">
                {person.avatarUrl ? <AvatarImage src={person.avatarUrl} /> : null}
                <AvatarFallback>{initials(person.name)}</AvatarFallback>
              </Avatar>
              <span className="font-medium group-hover:underline">{person.name}</span>
            </Link>
          )}
          <h1 className="text-4xl font-medium leading-tight">Ideas de regalo</h1>
          <p className="text-sm text-muted-foreground">
            Sugerencias personalizadas con sus intereses, notas y presupuesto.
          </p>
        </div>
      )}

      <div ref={controlsRef} className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-1.5">
            <Label>¿Para qué ocasión?</Label>
            <Select
              value={occasion}
              onValueChange={(v) => {
                if (!v) return;
                setOccasion(v);
                setIdeas(null);
                // savedTitles solo guarda títulos, no (ocasión, título): sin
                // resetearlo, una idea con el mismo título en la ocasión nueva
                // saldría como "guardada" (pulgar relleno) sin estarlo.
                setSavedTitles(new Set());
              }}
            >
              <SelectTrigger aria-label="Ocasión" className="w-full sm:w-56">
                <SelectValue placeholder="Elige un evento" />
              </SelectTrigger>
              <SelectContent>
                {events && events.length > 0 ? (
                  events.map((ev) => (
                    <SelectItem key={ev._id} value={ev.label}>
                      {ev.label}
                      {formatBudget(ev.budgetMin, ev.budgetMax)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__none__" disabled>
                    Sin eventos guardados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Desktop: botón inline junto al selector de ocasión */}
          <Button
            size="lg"
            className="hidden sm:inline-flex sm:w-auto"
            onClick={generate}
            disabled={loading || !occasion}
          >
            {hasCached ? (
              <RefreshCw className="size-4" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {loading ? "Generando…" : hasCached ? "Regenerar" : "Generar 9 ideas"}
          </Button>
        </div>

        <div className="space-y-2">
          <p id="gift-type-label" className="text-xs font-medium text-muted-foreground">Tipo de regalo</p>
          <div role="group" aria-labelledby="gift-type-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {GIFT_TYPES.map((t) => {
              const selected = giftType === t.value;
              const Icon = { ShoppingBag, Ticket, Heart, Shuffle }[t.icon];
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setGiftType(t.value);
                    setIdeas(null);
                    setSavedTitles(new Set());
                  }}
                  className={[
                    "flex flex-col items-start gap-1 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "bg-muted border border-border text-foreground"
                      : "border border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="font-medium leading-tight">{t.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {t.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Móvil: botón debajo del Tipo de regalo */}
        <Button
          size="lg"
          className="w-full sm:hidden"
          onClick={generate}
          disabled={loading || !occasion}
        >
          {hasCached ? (
            <RefreshCw className="size-4" aria-hidden />
          ) : (
            <Sparkles className="size-4" aria-hidden />
          )}
          {loading ? "Generando…" : hasCached ? "Regenerar" : "Generar 9 ideas"}
        </Button>

        {hasCached && !loading && (
          <p className="text-xs text-muted-foreground">
            Tienes ideas guardadas para esta combinación. Regenerar consume cuota diaria.
          </p>
        )}
        {remaining !== null && !loading && (
          <p className="text-xs text-muted-foreground">
            Te quedan {remaining} {remaining === 1 ? "generación" : "generaciones"} hoy.
          </p>
        )}
      </div>

      {/* Anuncio para lectores de pantalla del estado de la generación */}
      <p role="status" aria-live="polite" className="sr-only">
        {loading
          ? "Generando ideas de regalo…"
          : ideas
            ? `${ideas.length} ideas de regalo generadas`
            : ""}
      </p>

      {loading ? (
        <div className="grid gap-4 grid-cols-1" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-2xl border border-dashed border-border/60 bg-muted/40 animate-pulse"
            />
          ))}
        </div>
      ) : showIdeas && showIdeas.length > 0 ? (
        <div className={`grid gap-4 ${embedded ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {showIdeas.map((idea, i) => (
            <GiftRecommendationCard
              key={idea.title}
              idea={idea}
              index={i}
              giftType={giftType}
              favoriteStores={favoriteStores}
              favoriteBrands={person.favoriteBrands}
              saved={savedTitles.has(idea.title)}
              onSave={() => handleSave(idea)}
              onDiscard={() => handleDiscard(idea, i)}
            />
          ))}
        </div>
      ) : showIdeas ? (
        /* El usuario descartó las 9 ideas: estado vacío con CTA, no un grid en blanco */
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ✨
          </div>
          <h2 className="text-2xl font-medium mb-2">Has descartado todas las ideas</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            La próxima tanda evitará sugerencias parecidas a las que has descartado.
          </p>
          <Button onClick={generate} disabled={loading} className="hover:bg-primary/80">
            <RefreshCw className="size-4" aria-hidden />
            Generar de nuevo
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
          <div className="text-4xl mb-3" aria-hidden>
            ✨
          </div>
          {events && events.length === 0 ? (
            <>
              <h2 className="text-2xl font-medium mb-2">Sin eventos todavía</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                Para generar ideas necesitas al menos un evento — cumpleaños, aniversario, lo que sea.
              </p>
              <Link
                href={`/seres-queridos/${personId}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Añadir evento a {person.name}
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-medium mb-2">A medida para {person.name}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                La IA combinará intereses, notas y presupuesto que has guardado con la ocasión y el tipo de regalo que elijas para sugerir nueve ideas concretas.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden h-full flex flex-col">
        {/* Cabecera fija */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-9 shrink-0">
              {person.avatarUrl ? (
                <AvatarImage src={person.avatarUrl} alt={person.name} />
              ) : null}
              <AvatarFallback>{initials(person.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{person.name}</p>
              <p className="text-xs text-muted-foreground">Ideas de regalo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(hasCached || ideas) && (
              <Button
                size="sm"
                onClick={generate}
                disabled={loading}
                className={[
                  "transition-opacity duration-200",
                  showHeaderRegen ? "opacity-100" : "opacity-0 pointer-events-none",
                ].join(" ")}
              >
                <RefreshCw className="size-3.5" aria-hidden />
                {loading ? "Generando…" : "Regenerar"}
              </Button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar panel"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
        {/* Cuerpo scrollable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/60 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border)/0.6)_transparent]">
          {content}
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 sm:p-6 lg:p-8 max-w-6xl">
      {/* Header fijo móvil — aparece con fade cuando los controles salen de pantalla */}
      <div
        aria-hidden={!showHeaderRegen}
        className={[
          "fixed top-0 left-0 right-0 z-40 lg:hidden",
          "flex items-center justify-between gap-3 px-4 py-3",
          "bg-background/90 backdrop-blur-sm border-b border-border/40",
          "transition-all duration-200",
          showHeaderRegen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none",
        ].join(" ")}
      >
        <Link
          href={`/seres-queridos/${personId}`}
          className="flex items-center gap-2.5 min-w-0"
        >
          <Avatar className="size-8 shrink-0">
            {person.avatarUrl ? <AvatarImage src={person.avatarUrl} alt={person.name} /> : null}
            <AvatarFallback>{initials(person.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate">{person.name}</span>
        </Link>
        {(hasCached || ideas) && (
          <Button size="sm" onClick={generate} disabled={loading} className="shrink-0">
            <RefreshCw className="size-3.5" aria-hidden />
            {loading ? "Generando…" : "Regenerar"}
          </Button>
        )}
      </div>
      {content}
    </main>
  );
}
