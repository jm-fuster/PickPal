import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { giftRecommendationsSchema } from "@/lib/gifts";
import { RELATIONSHIPS } from "@/lib/schemas";

const requestSchema = z.object({
  personId: z.string().min(1),
  occasionLabel: z.string().min(1).max(40),
});

const formatBudget = (budgetMin?: number, budgetMax?: number) => {
  const min = budgetMin !== undefined ? budgetMin / 100 : undefined;
  const max = budgetMax !== undefined ? budgetMax / 100 : undefined;
  if (min !== undefined && max !== undefined) return `entre ${min}€ y ${max}€`;
  if (min !== undefined) return `desde ${min}€`;
  if (max !== undefined) return `hasta ${max}€`;
  return "sin límite definido";
};

export async function POST(req: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error(
      "[recommendations] Falta GOOGLE_GENERATIVE_AI_API_KEY en el entorno del servidor.",
    );
    return NextResponse.json(
      { error: "Servicio temporalmente no disponible." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const personId = parsed.data.personId as Id<"people">;
  const occasionLabel = parsed.data.occasionLabel;

  const person = await fetchQuery(
    api.people.getById,
    { id: personId },
    { token },
  );
  if (!person) {
    return NextResponse.json(
      { error: "Persona no encontrada" },
      { status: 404 },
    );
  }

  // Rate limit: 10 recomendaciones por usuario y día (UTC).
  // Protege la cuota gratuita de Gemini frente a abuso.
  try {
    await fetchMutation(api.recommendationUsage.consume, {}, { token });
  } catch (err) {
    console.error("[recommendations] rate limit:", err);
    return NextResponse.json(
      { error: "Has alcanzado el límite diario de recomendaciones." },
      { status: 429 },
    );
  }

  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;
  const budgetText = formatBudget(person.budgetMin, person.budgetMax);
  const interestsText =
    person.interests.length > 0 ? person.interests.join(", ") : "sin definir";
  const notesText = person.notes?.trim() || "ninguna";

  const prompt = `Genera EXACTAMENTE 6 ideas de regalo para la siguiente persona.

Persona:
- Nombre: ${person.name}
- Relación con quien regala: ${relationshipLabel}
- Intereses: ${interestsText}
- Notas: ${notesText}
- Presupuesto: ${budgetText}
- Ocasión: ${occasionLabel}

Reglas:
- Todas las ideas deben ser comprables en Amazon.es.
- Los precios deben respetar el presupuesto indicado cuando sea posible.
- Varía las categorías (no todos del mismo tipo).
- "amazonQuery" debe ser una búsqueda específica de 3-6 palabras útil para encontrar el producto en Amazon.
- "description" en español, máximo 2 frases, explicando por qué encaja con esta persona.
- "category" en español, palabra o dos (ej: "Tecnología", "Hogar", "Libros").
- "priceMinEuros" y "priceMaxEuros" en euros, valores enteros razonables.
- Responde en español.`;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: giftRecommendationsSchema,
      prompt,
    });
    return NextResponse.json(object);
  } catch (err) {
    console.error("[recommendations] gemini:", err);
    return NextResponse.json(
      { error: "Error generando recomendaciones." },
      { status: 500 },
    );
  }
}
