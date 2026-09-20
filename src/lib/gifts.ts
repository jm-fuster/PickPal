import { z } from "zod";
import { STORE_IDS } from "./stores";

export const GIFT_TYPES = [
  { value: "fisica", label: "Producto físico", icon: "ShoppingBag", description: "Algo que comprar y envolver" },
  { value: "experiencia", label: "Experiencia", icon: "Ticket", description: "Cena, taller, escapada…" },
  { value: "tiempo-juntos", label: "Tiempo juntos", icon: "Heart", description: "Planes sin coste o caseros" },
  { value: "sorprendeme", label: "Sorpréndeme", icon: "Shuffle", description: "Mezcla de los tres tipos" },
] as const;

export type GiftType = (typeof GIFT_TYPES)[number]["value"];

// Catálogo cerrado de claves visuales para la cabecera de las cards de ideas.
// La IA elige una por idea (enum en el schema de generación); el mapeo
// clave → icono lucide + tinte vive en src/lib/giftImages.ts. Espejado en
// ALLOWED_IMAGE_KEYS de convex/validators.ts — si añades una clave,
// actualiza ambos sitios y el mapa de giftImages.ts.
export const GIFT_IMAGE_KEYS = [
  "tecnologia",
  "audio",
  "gaming",
  "fotografia",
  "libros",
  "musica",
  "arte-manualidades",
  "juegos-mesa",
  "papeleria",
  "bricolaje",
  "joyeria-relojes",
  "moda",
  "belleza",
  "cocina",
  "gourmet",
  "vino-bebidas",
  "cafe-te",
  "hogar-decoracion",
  "plantas",
  "mascotas",
  "deporte",
  "aire-libre",
  "viajes",
  "experiencia-gastronomica",
  "experiencia-cultural",
  "experiencia-aventura",
  "experiencia-bienestar",
  "taller-curso",
  "plan-casero",
  "regalo-generico",
] as const;

export type GiftImageKey = (typeof GIFT_IMAGE_KEYS)[number];

const baseRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  priceMinEuros: z.number().min(0),
  priceMaxEuros: z.number().min(0),
  category: z.array(z.string().min(1).max(40)).min(1).max(3),
  amazonQuery: z.string().min(1).max(120),
});

// En generación imageKey es obligatorio: un enum opcional hace fallar a
// Gemini cuando intenta omitirlo (mismo motivo que suggestedStores abajo).
// imageQuery alimenta la búsqueda de foto de stock en Pexels (server-side,
// en /api/recommendations); se elimina antes de persistir la idea.
const generatedIdeaSchema = baseRecommendationSchema.extend({
  imageKey: z.enum(GIFT_IMAGE_KEYS),
  imageQuery: z.string().min(1).max(60),
});

// Para tipos sin tiendas (experiencia, tiempo-juntos): campo ausente del schema
// para evitar que Gemini falle al intentar omitir un campo enum opcional.
//
// Sin `.min()`/`.max()` a propósito: Gemini 3 rechaza con 400 INVALID_ARGUMENT
// cualquier array de enum que lleve minItems/maxItems. Ni el enum ni los límites
// molestan por separado — `category` es un array de string con min/max y pasa,
// y un enum suelto también — - es la combinación. Comprobado por bisección
// contra gemini-3.8-flash el 20-sep-2026 al migrar desde 2.5.
// El tope real no se pierde: `validateRecommendationIdeas` en
// convex/validators.ts corta en MAX_SUGGESTED_STORES y valida cada id contra la
// allowlist antes de persistir, y `sanitizeFavoriteStores` descarta los
// desconocidos. Este schema es una pista para el modelo; el límite lo impone el
// servidor.
const recommendationWithStoresSchema = generatedIdeaSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).optional(),
});

// Foto de stock (Pexels) adjuntada server-side tras la generación. Opcional
// en todos los niveles: sin PEXELS_API_KEY, sin resultados o con carga rota,
// la card cae a la cabecera de icono (imageKey).
export const giftStockImageSchema = z.object({
  url: z.string().url().max(512),
  photographer: z.string().max(120).optional(),
  photographerUrl: z.string().url().max(512).optional(),
});

export type GiftStockImage = z.infer<typeof giftStockImageSchema>;

// Tienda oficial de una marca favorita, resuelta server-side (Brandfetch) tras
// la generación y adjuntada a la idea — igual que `image` (Pexels). Opcional en
// todos los niveles: sin BRANDFETCH_CLIENT_ID, sin match o sin resolución, la
// card cae al botón de búsqueda de marca (Capa 0). `domain` validado como
// hostname y `logoUrl` por prefijo del CDN de Brandfetch en convex/validators.ts
// antes de persistir.
export const matchedBrandStoreSchema = z.object({
  brand: z.string().min(1).max(40),
  domain: z.string().min(1).max(253),
  logoUrl: z.string().url().max(512).optional(),
  // true si la tienda admite la ruta de búsqueda estándar `/search?q=`
  // (detectado como Shopify al generar). Permite enlazar a la búsqueda del
  // producto dentro de la web de la marca en vez de a su home. Sin esto (o
  // false), el botón cae a la home — nunca a una ruta de búsqueda inventada.
  supportsSearch: z.boolean().optional(),
});

export type MatchedBrandStore = z.infer<typeof matchedBrandStoreSchema>;

// Tipo de cara a la UI: imageKey/image/matchedBrandStores opcionales porque las
// ideas persistidas antes de estos campos no los tienen (la card cae al
// fallback correspondiente). Sin imageQuery: solo existe durante la generación.
export const giftRecommendationSchema = baseRecommendationSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).max(STORE_IDS.length).optional(),
  imageKey: z.enum(GIFT_IMAGE_KEYS).optional(),
  image: giftStockImageSchema.optional(),
  matchedBrandStores: z.array(matchedBrandStoreSchema).max(10).optional(),
});

// El prompt pide 9 ideas, pero aceptamos 6–9: una tanda con alguna idea de
// menos no debe tirarse entera (antes `.length(9)` exacto fallaba toda la
// generación). El validador server-side (`validateRecommendationIdeas`) y la UI
// ya toleran < 9.
export const giftRecommendationsSchema = z.object({
  ideas: z.array(recommendationWithStoresSchema).min(6).max(9),
});

export const giftRecommendationsSchemaNoStores = z.object({
  ideas: z.array(generatedIdeaSchema).min(6).max(9),
});

export type GiftRecommendation = z.infer<typeof giftRecommendationSchema>;
