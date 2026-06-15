"use client";

import { useState } from "react";
import { ExternalLink, Tags, ThumbsDown, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  findBrandStore,
  generateBrandProductSearchUrl,
  generateBrandSearchUrl,
  generateBrandStoreUrl,
  matchFavoriteBrands,
} from "@/lib/brands";
import {
  ALL_STORES,
  STORE_ICONS,
  STORE_LABELS,
  generateStoreSearchUrl,
  pickEffectiveStores,
  type StoreId,
} from "@/lib/stores";
import { resolveGiftImage } from "@/lib/giftImages";
import type { GiftRecommendation, GiftType } from "@/lib/gifts";

const formatRange = (min: number, max: number) =>
  min === max
    ? `${Math.round(min)}€`
    : `${Math.round(min)}–${Math.round(max)}€`;

const generateGoogleUrl = (query: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

// Eyebrow que rotula cada grupo de botones de compra. Solo aparece cuando hay
// botón de marca, para que el usuario distinga de dónde sale cada enlace: la
// tienda oficial de la marca (que añadió en la ficha de la persona) vs. los
// marketplaces (que eligió en Ajustes > Tiendas).
const STORE_SECTION_LABEL_CLASS =
  "font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

/**
 * Botón de marca favorita matcheada. Si la idea trae la tienda oficial resuelta
 * (`matchedBrandStores`, vía Brandfetch), muestra su logo y enlaza a la web de
 * la marca: a la búsqueda del producto dentro de la tienda si esta la admite
 * (`supportsSearch`), o a su home en caso contrario. Si no se resolvió, cae al
 * botón de búsqueda de marca en Google (Capa 0) con el icono `Tags`. Logo con
 * `bg-white` para que se vea en modo oscuro (igual que los logos de tienda) y
 * fallback al icono si la imagen falla.
 */
function BrandStoreLink({
  brand,
  idea,
}: {
  brand: string;
  idea: GiftRecommendation;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const store = findBrandStore(brand, idea.matchedBrandStores);
  const href = store
    ? store.supportsSearch
      ? generateBrandProductSearchUrl(store.domain, idea.amazonQuery)
      : generateBrandStoreUrl(store.domain)
    : generateBrandSearchUrl(idea.amazonQuery, brand);
  const logo = store?.logoUrl && !logoFailed ? store.logoUrl : null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        store && !store.supportsSearch
          ? `Ir a la tienda de ${brand} (abre en una pestaña nueva)`
          : `Buscar ${idea.title} en ${brand} (abre en una pestaña nueva)`
      }
      className={cn(
        buttonVariants({ size: "default", variant: "outline" }),
        "col-span-2 min-w-0 border-secondary/40 text-secondary hover:text-secondary",
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setLogoFailed(true)}
          className="size-4 shrink-0 rounded-sm object-contain bg-white p-px"
        />
      ) : (
        <Tags className="size-4 shrink-0" aria-hidden />
      )}
      <span className="truncate">{brand}</span>
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}

interface GiftRecommendationCardProps {
  idea: GiftRecommendation;
  index?: number;
  giftType?: GiftType;
  favoriteStores?: StoreId[];
  favoriteBrands?: string[];
  saved?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
}

export function GiftRecommendationCard({
  idea,
  index = 0,
  giftType = "fisica",
  favoriteStores,
  favoriteBrands,
  saved = false,
  onSave,
  onDiscard,
}: GiftRecommendationCardProps) {
  const isPhysical = giftType === "fisica";
  const isSurprise = giftType === "sorprendeme";

  // Cierra el círculo: si la IA usó de verdad una marca favorita, la card lo
  // muestra (heurística sobre el texto que ya devolvió, sin pedirle nada extra).
  const matchedBrands = matchFavoriteBrands(idea, favoriteBrands);

  const userFavorites =
    favoriteStores && favoriteStores.length > 0
      ? ALL_STORES.filter((s) => favoriteStores.includes(s))
      : [...ALL_STORES];

  const { stores: storesToRender, isFallback } = pickEffectiveStores(
    userFavorites,
    idea.suggestedStores ?? undefined,
  );

  const nonPhysicalLabel = isSurprise
    ? "Buscar"
    : giftType === "tiempo-juntos"
      ? "Ideas"
      : "Buscar";

  const visual = resolveGiftImage(idea.imageKey, giftType);
  const VisualIcon = visual.icon;
  // Foto de stock rota (CDN caducado, red): cae a la cabecera de icono.
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = !photoFailed && idea.image?.url ? idea.image : null;

  return (
    <Card
      className="flex flex-col h-full border-border/60 shadow-sm transition-shadow hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Layout fijo desde arriba: título (2 líneas) + descripción (4 líneas)
          tienen altura reservada para que el precio quede a la misma altura
          entre cards; los botones de tienda alargan la card hacia abajo. */}
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {/* Cabecera visual: foto de stock (Pexels) si la generación encontró
            una; si no hay foto o falla su carga, tinte plano + icono lucide
            del catálogo de claves (imageKey). La imagen es ilustrativa de la
            categoría, no del producto exacto — decorativa para lectores. */}
        {photo ? (
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt=""
              aria-hidden
              loading="lazy"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex h-24 shrink-0 items-center justify-center rounded-xl",
              visual.container,
            )}
          >
            <VisualIcon
              className={cn("size-9", visual.iconClass)}
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
        )}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-medium leading-snug line-clamp-2 min-h-[2.75rem]">
              {idea.title}
            </h3>
            {(onSave || onDiscard) && (
              <div className="flex gap-0.5 shrink-0">
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saved}
                    aria-label={saved ? "Idea guardada" : "Guardar idea"}
                    aria-pressed={saved}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:pointer-events-none"
                  >
                    <ThumbsUp className="size-3.5" aria-hidden fill={saved ? "currentColor" : "none"} />
                  </button>
                )}
                {onDiscard && (
                  <button
                    type="button"
                    onClick={onDiscard}
                    aria-label="No me interesa"
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive hover:bg-muted/60 transition-colors"
                  >
                    <ThumbsDown className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>
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
            {(Array.isArray(idea.category)
              ? idea.category
              : (idea.category as unknown as string).split(" · ")
            ).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground min-h-24 line-clamp-4">
          {idea.description}
        </p>

        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="text-lg font-medium tracking-tight">
            {formatRange(idea.priceMinEuros, idea.priceMaxEuros)}
          </div>

          {idea.amazonQuery ? (
            isPhysical ? (
              <div className="space-y-3">
                {/* Marcas favoritas matcheadas: van primero y a ancho completo
                    porque son la vía que de verdad funciona. Muchas marcas (DTC
                    tipo Brandy Melville) no están en los marketplaces. Si se
                    resolvió su tienda oficial (Brandfetch), el botón lleva ahí con
                    su logo; si no, cae a una búsqueda de Google acotada a la marca.
                    El eyebrow solo se rotula cuando hay marca, para que el usuario
                    entienda que sale de las marcas que añadió a esta persona. */}
                {matchedBrands.length > 0 && (
                  <div className="space-y-1.5">
                    <p className={STORE_SECTION_LABEL_CLASS}>Tienda de marca</p>
                    <div className="grid grid-cols-2 gap-2">
                      {matchedBrands.map((brand) => (
                        <BrandStoreLink key={`brand-${brand}`} brand={brand} idea={idea} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  {matchedBrands.length > 0 && (
                    <p className={STORE_SECTION_LABEL_CLASS}>Buscar en tiendas</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {storesToRender.map((store, i) => {
                      const isLastOdd =
                        storesToRender.length % 2 === 1 &&
                        i === storesToRender.length - 1;
                      return (
                        <a
                          key={store}
                          href={generateStoreSearchUrl(store, idea.amazonQuery, {
                            minEuros: idea.priceMinEuros,
                            maxEuros: idea.priceMaxEuros,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buscar ${idea.title} en ${STORE_LABELS[store]} (abre en una pestaña nueva)`}
                          className={cn(
                            buttonVariants({ size: "default", variant: "outline" }),
                            "min-w-0",
                            isLastOdd && "col-span-2",
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={STORE_ICONS[store]} alt="" className="size-4 shrink-0 rounded-sm object-contain bg-white p-px" aria-hidden />
                          <span className="truncate">{STORE_LABELS[store]}</span>
                          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                        </a>
                      );
                    })}
                  </div>
                  {isFallback && (
                    <p className="text-[11px] text-muted-foreground">
                      Búsqueda genérica — esta idea encaja mejor en otras tiendas.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <a
                href={generateGoogleUrl(idea.amazonQuery)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${nonPhysicalLabel}: ${idea.title} (abre en una pestaña nueva)`}
                className={cn(buttonVariants({ size: "default", variant: "outline" }), "w-full")}
              >
                {nonPhysicalLabel}
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
