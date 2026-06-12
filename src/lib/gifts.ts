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
const generatedIdeaSchema = baseRecommendationSchema.extend({
  imageKey: z.enum(GIFT_IMAGE_KEYS),
});

// Para tipos sin tiendas (experiencia, tiempo-juntos): campo ausente del schema
// para evitar que Gemini falle al intentar omitir un campo enum opcional.
const recommendationWithStoresSchema = generatedIdeaSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).min(1).max(STORE_IDS.length).optional(),
});

// Tipo de cara a la UI: imageKey opcional porque las ideas persistidas antes
// de este campo no lo tienen (la card cae al fallback por tipo de regalo).
export const giftRecommendationSchema = baseRecommendationSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).max(STORE_IDS.length).optional(),
  imageKey: z.enum(GIFT_IMAGE_KEYS).optional(),
});

export const giftRecommendationsSchema = z.object({
  ideas: z.array(recommendationWithStoresSchema).length(9),
});

export const giftRecommendationsSchemaNoStores = z.object({
  ideas: z.array(generatedIdeaSchema).length(9),
});

export type GiftRecommendation = z.infer<typeof giftRecommendationSchema>;
