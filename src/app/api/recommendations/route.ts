import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { giftRecommendationsSchema, GIFT_TYPES, type GiftType } from "@/lib/gifts";
import { RELATIONSHIPS, REACTIONS } from "@/lib/schemas";

const GIFT_TYPE_VALUES = GIFT_TYPES.map((t) => t.value) as [GiftType, ...GiftType[]];

const requestSchema = z.object({
  personId: z.string().min(1),
  occasionLabel: z.string().min(1).max(40),
  giftType: z.enum(GIFT_TYPE_VALUES).default("fisica"),
  excludedTitles: z.array(z.string().max(80)).max(50).optional(),
});

const formatBudget = (budgetMin?: number, budgetMax?: number) => {
  const min = budgetMin !== undefined ? budgetMin / 100 : undefined;
  const max = budgetMax !== undefined ? budgetMax / 100 : undefined;
  if (min !== undefined && max !== undefined) return `entre ${min}€ y ${max}€`;
  if (min !== undefined) return `desde ${min}€`;
  if (max !== undefined) return `hasta ${max}€`;
  return "sin límite definido";
};

const reactionLabel = (r: string) =>
  REACTIONS.find((x) => x.value === r)?.label ?? r;

const buildPrompt = (
  person: {
    name: string;
    relationship: string;
    interests: string[];
    notes?: string;
    budgetMin?: number;
    budgetMax?: number;
    shoeSize?: string;
    clothingSize?: string;
    allergies?: string;
    dislikes?: string;
  },
  occasionLabel: string,
  giftType: GiftType,
  history: Array<{ giftName: string; occasionLabel: string; year?: number; reaction: string }>,
  excludedTitles?: string[],
) => {
  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;
  const budgetText = formatBudget(person.budgetMin, person.budgetMax);
  const interestsText =
    person.interests.length > 0 ? person.interests.join(", ") : "sin definir";
  const notesText = person.notes?.trim() || "ninguna";

  const practicalLines = [
    person.shoeSize ? `- Talla de zapato: ${person.shoeSize}` : "",
    person.clothingSize ? `- Talla de ropa: ${person.clothingSize}` : "",
    person.allergies ? `- Alergias / restricciones: ${person.allergies}` : "",
    person.dislikes ? `- Cosas que no le gustan: ${person.dislikes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const historyLines =
    history.length > 0
      ? `\nHistorial de regalos anteriores (para no repetir y afinar las sugerencias):\n${history
          .slice(0, 10)
          .map(
            (h) =>
              `- "${h.giftName}" (${h.occasionLabel}${h.year ? ` ${h.year}` : ""}): ${reactionLabel(h.reaction)}`,
          )
          .join("\n")}\nEvita sugerir regalos similares a los marcados negativamente.`
      : "";

  const typeRules: Record<GiftType, string> = {
    fisica: `- Todas las ideas deben ser productos físicos comprables en Amazon.es.
- "amazonQuery" debe ser una búsqueda específica de 3-6 palabras útil para encontrar el producto en Amazon.es.`,
    experiencia: `- Todas las ideas deben ser experiencias (cenas, talleres, escapadas, conciertos, actividades…). No productos físicos.
- "amazonQuery" debe ser una búsqueda de 3-6 palabras para encontrar esa experiencia en Google (ej. "cata de vinos Madrid", "taller cerámica Barcelona").`,
    "tiempo-juntos": `- Todas las ideas deben ser planes gratuitos o caseros: actividades para hacer juntos, recetas, rutas, vales artesanales, etc.
- "amazonQuery" debe ser una frase descriptiva de 3-5 palabras para buscar inspiración en Google (ej. "ruta senderismo fácil", "receta cena especial").
- Los precios deben ser bajos o cero (experiencias sin coste o materiales mínimos).`,
    sorprendeme: `- Mezcla libremente productos físicos, experiencias y planes juntos. Varía el tipo entre las 6 ideas.
- Para productos: "amazonQuery" útil para Amazon.es. Para experiencias/planes: "amazonQuery" útil para buscar en Google.`,
  };

  const excludedLines =
    excludedTitles && excludedTitles.length > 0
      ? `\nIdeas ya descartadas por el usuario (no las repitas ni sugieras conceptos muy similares):\n${excludedTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  return `Genera EXACTAMENTE 6 ideas de regalo para la siguiente persona.

Persona:
- Nombre: ${person.name}
- Relación con quien regala: ${relationshipLabel}
- Intereses: ${interestsText}
- Notas: ${notesText}
- Presupuesto: ${budgetText}
- Ocasión: ${occasionLabel}
${practicalLines ? practicalLines + "\n" : ""}${historyLines}${excludedLines}

Reglas:
${typeRules[giftType]}
- Los precios deben respetar el presupuesto indicado cuando sea posible.
- Varía las categorías (no todas del mismo tipo).
- "description" en español, máximo 2 frases, explicando por qué encaja con esta persona.
- "category" en español, una o dos palabras (ej: "Tecnología", "Hogar", "Libros", "Experiencia").
- "priceMinEuros" y "priceMaxEuros" en euros, valores enteros razonables.
- Responde en español.`;
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
  const { occasionLabel, giftType, excludedTitles } = parsed.data;

  const [person, history] = await Promise.all([
    fetchQuery(api.people.getById, { id: personId }, { token }),
    fetchQuery(api.giftHistory.getByPerson, { personId }, { token }),
  ]);

  if (!person) {
    return NextResponse.json(
      { error: "Persona no encontrada" },
      { status: 404 },
    );
  }

  // Rate limit: 10 recomendaciones por usuario y día (UTC).
  try {
    await fetchMutation(api.recommendationUsage.consume, {}, { token });
  } catch (err) {
    console.error("[recommendations] rate limit:", err);
    return NextResponse.json(
      { error: "Has alcanzado el límite diario de recomendaciones." },
      { status: 429 },
    );
  }

  const prompt = buildPrompt(person, occasionLabel, giftType, history, excludedTitles);

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: giftRecommendationsSchema,
      prompt,
    });

    await fetchMutation(
      api.recommendations.upsert,
      { personId, occasionLabel, giftType, ideas: object.ideas },
      { token },
    );

    return NextResponse.json(object);
  } catch (err) {
    console.error("[recommendations] gemini:", err);
    return NextResponse.json(
      { error: "Error generando recomendaciones." },
      { status: 500 },
    );
  }
}
