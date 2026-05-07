import { z } from "zod";
import { STORE_IDS } from "./stores";

export const GIFT_TYPES = [
  { value: "fisica", label: "Producto físico", icon: "ShoppingBag", description: "Algo que comprar y envolver" },
  { value: "experiencia", label: "Experiencia", icon: "Ticket", description: "Cena, taller, escapada…" },
  { value: "tiempo-juntos", label: "Tiempo juntos", icon: "Heart", description: "Planes sin coste o caseros" },
  { value: "sorprendeme", label: "Sorpréndeme", icon: "Shuffle", description: "Mezcla de los tres tipos" },
] as const;

export type GiftType = (typeof GIFT_TYPES)[number]["value"];

export const giftRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  priceMinEuros: z.number().min(0),
  priceMaxEuros: z.number().min(0),
  category: z.string().min(1).max(40),
  amazonQuery: z.string().min(1).max(120),
  // Tiendas en las que tiene sentido buscar este producto. Opcional para
  // mantener compatibilidad con ideas cacheadas pre-v2; el prompt actual
  // pide a la IA que lo incluya siempre para regalos físicos. El cap es
  // `STORE_IDS.length` (no menor) para que la IA pueda devolver todas las
  // tiendas en productos genéricos sin que falle el schema.
  suggestedStores: z
    .array(z.enum(STORE_IDS))
    .min(1)
    .max(STORE_IDS.length)
    .optional(),
});

export const giftRecommendationsSchema = z.object({
  ideas: z.array(giftRecommendationSchema).length(9),
});

export type GiftRecommendation = z.infer<typeof giftRecommendationSchema>;
