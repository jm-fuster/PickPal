import { z } from "zod";

export const GIFT_TYPES = [
  { value: "fisica", label: "Producto físico", emoji: "📦" },
  { value: "experiencia", label: "Experiencia", emoji: "🎭" },
  { value: "tiempo-juntos", label: "Tiempo juntos", emoji: "🫂" },
  { value: "sorprendeme", label: "Sorpréndeme", emoji: "✨" },
] as const;

export type GiftType = (typeof GIFT_TYPES)[number]["value"];

export const giftRecommendationSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  priceMinEuros: z.number().min(0),
  priceMaxEuros: z.number().min(0),
  category: z.string().min(1).max(40),
  amazonQuery: z.string().min(1).max(120),
});

export const giftRecommendationsSchema = z.object({
  ideas: z.array(giftRecommendationSchema).length(6),
});

export type GiftRecommendation = z.infer<typeof giftRecommendationSchema>;
