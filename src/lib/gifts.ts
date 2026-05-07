import { z } from "zod";
import { STORE_IDS } from "./stores";

export const GIFT_TYPES = [
  { value: "fisica", label: "Producto físico", icon: "ShoppingBag", description: "Algo que comprar y envolver" },
  { value: "experiencia", label: "Experiencia", icon: "Ticket", description: "Cena, taller, escapada…" },
  { value: "tiempo-juntos", label: "Tiempo juntos", icon: "Heart", description: "Planes sin coste o caseros" },
  { value: "sorprendeme", label: "Sorpréndeme", icon: "Shuffle", description: "Mezcla de los tres tipos" },
] as const;

export type GiftType = (typeof GIFT_TYPES)[number]["value"];

const baseRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  priceMinEuros: z.number().min(0),
  priceMaxEuros: z.number().min(0),
  category: z.array(z.string().min(1).max(40)).min(1).max(3),
  amazonQuery: z.string().min(1).max(120),
});

// Para tipos sin tiendas (experiencia, tiempo-juntos): campo ausente del schema
// para evitar que Gemini falle al intentar omitir un campo enum opcional.
const recommendationWithStoresSchema = baseRecommendationSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).min(1).max(STORE_IDS.length).optional(),
});

export const giftRecommendationSchema = baseRecommendationSchema.extend({
  suggestedStores: z.array(z.enum(STORE_IDS)).max(STORE_IDS.length).optional(),
});

export const giftRecommendationsSchema = z.object({
  ideas: z.array(recommendationWithStoresSchema).length(9),
});

export const giftRecommendationsSchemaNoStores = z.object({
  ideas: z.array(baseRecommendationSchema).length(9),
});

export type GiftRecommendation = z.infer<typeof giftRecommendationSchema>;
