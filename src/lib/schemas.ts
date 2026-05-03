import { z } from "zod";

export const RELATIONSHIPS = [
  { value: "friend", label: "Amigo/a" },
  { value: "family", label: "Familia" },
  { value: "partner", label: "Pareja" },
  { value: "colleague", label: "Compañero/a" },
  { value: "other", label: "Otro" },
] as const;

export const personFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
    relationship: z.enum(
      RELATIONSHIPS.map((r) => r.value) as [string, ...string[]],
    ),
    interests: z.array(z.string().trim().min(1)).max(20),
    notes: z.string().max(1000).optional(),
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
    photoUrl: z.url("URL no válida").optional().or(z.literal("")),
  })
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

export type PersonFormValues = z.infer<typeof personFormSchema>;

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
  })
  .refine(
    (v) => {
      const daysInMonth = new Date(v.year ?? 2024, v.month, 0).getDate();
      return v.day <= daysInMonth;
    },
    { message: "Día no válido para ese mes", path: ["day"] },
  );

export type ImportantDateFormValues = z.infer<typeof importantDateSchema>;
