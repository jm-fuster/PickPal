import { z } from "zod";

export const REACTIONS = [
  { value: "loved", label: "Le encantó", emoji: "❤️" },
  { value: "ok", label: "Ni fu ni fa", emoji: "👍" },
  { value: "bad", label: "Lo devolvió / No gustó", emoji: "😞" },
] as const;

export const giftHistorySchema = z.object({
  giftName: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  occasionLabel: z.string().trim().min(1, "La ocasión es obligatoria").max(40),
  year: z.number().int().min(1900).max(2100).optional(),
  reaction: z.enum(["loved", "ok", "bad"] as [string, ...string[]]),
  notes: z.string().max(500).optional(),
});

export type GiftHistoryFormValues = z.infer<typeof giftHistorySchema>;

export const RELATIONSHIPS = [
  { value: "friend", label: "Amigo/a" },
  { value: "family", label: "Familia" },
  { value: "partner", label: "Pareja" },
  { value: "colleague", label: "Compañero/a" },
  { value: "other", label: "Otro" },
] as const;

export const importantDateSchema = z
  .object({
    label: z.string().trim().min(1, "Etiqueta obligatoria").max(40),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    year: z
      .number()
      .int()
      .min(1900)
      .max(2100)
      .optional()
      .or(z.literal(undefined)),
    budgetMinEuros: z
      .number({ error: "Debe ser un número" })
      .min(0)
      .max(100000)
      .optional(),
    budgetMaxEuros: z
      .number({ error: "Debe ser un número" })
      .min(0)
      .max(100000)
      .optional(),
  })
  .refine(
    (v) => {
      const daysInMonth = new Date(v.year ?? 2024, v.month, 0).getDate();
      return v.day <= daysInMonth;
    },
    { message: "Día no válido para ese mes", path: ["day"] },
  )
  .refine(
    (v) =>
      v.budgetMinEuros === undefined ||
      v.budgetMaxEuros === undefined ||
      v.budgetMinEuros <= v.budgetMaxEuros,
    {
      message: "El mínimo debe ser menor o igual al máximo",
      path: ["budgetMaxEuros"],
    },
  );

export type ImportantDateFormValues = z.infer<typeof importantDateSchema>;

export const personFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
    relationship: z.enum(
      RELATIONSHIPS.map((r) => r.value) as [string, ...string[]],
    ),
    interests: z.array(z.string().trim().min(1)).max(20),
    notes: z.string().max(1000).optional(),
    dates: z.array(importantDateSchema).max(10),
    shoeSize: z.string().max(20).optional(),
    clothingSize: z.string().max(20).optional(),
    allergies: z.string().max(200).optional(),
    dislikes: z.string().max(200).optional(),
    avatarUrl: z.string().url().optional(),
  });

export type PersonFormValues = z.infer<typeof personFormSchema>;
