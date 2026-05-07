import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexError } from "convex/values";
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
    shoeSize?: string;
    clothingSize?: string;
    allergies?: string;
    dislikes?: string;
  },
  budgetMin: number | undefined,
  budgetMax: number | undefined,
  occasionLabel: string,
  giftType: GiftType,
  history: Array<{ giftName: string; occasionLabel: string; year?: number; reaction: string }>,
) => {
  const relationshipLabel =
    RELATIONSHIPS.find((r) => r.value === person.relationship)?.label ??
    person.relationship;
  const budgetText = formatBudget(budgetMin, budgetMax);
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

  const storesGuide = `- "suggestedStores": array de 1-7 elementos indicando en qué tiendas online tiene sentido buscar este producto concreto. Valores válidos: "amazon", "elcorteingles", "aliexpress", "miravia", "decathlon", "ikea", "pccomponentes".
  Criterios por tienda — incluye solo las que realmente encajen, no copies todas:
  - "amazon": generalista. Tech, libros, productos de marca internacional, envío rápido. Inclúyela en la mayoría de productos físicos salvo nichos muy claros.
  - "elcorteingles": gran almacén español. Gourmet, vinos, moda media-alta, perfumería, juguetes, electrodomésticos, libros, regalos premium nacionales. Útil cuando la marca o la calidad importan, o cuando el producto es muy "español".
  - "aliexpress": gadgets baratos, accesorios sin marca, productos chinos genéricos. Útil para precio bajo + espera larga aceptable. Excluye gourmet español, moda media-alta, calidad relevante, artesanía.
  - "miravia": marketplace asiático/europeo más curado que AliExpress, con énfasis en moda y belleza. Mismo criterio general que AliExpress.
  - "decathlon": deporte y outdoor. Ropa deportiva, equipamiento (running, ciclismo, montaña, fitness, natación, fútbol), camping, mochilas técnicas. Inclúyela SOLO si la idea es claramente deportiva/outdoor.
  - "ikea": hogar, muebles, decoración, textil hogar, vajilla, iluminación, organización, plantas. Útil para regalos de mudanza o parejas que estrenan piso. Excluye tech, moda, deporte, libros.
  - "pccomponentes": tech especializada — componentes PC, periféricos, gaming, monitores, sillas gaming, smart home, móviles/portátiles. Inclúyela junto a Amazon cuando la idea es claramente tech serio.
  Incluye SIEMPRE al menos una tienda generalista ("amazon" o "elcorteingles"), excepto si el producto es claramente nicho (artesanal, gourmet local, hecho a medida) — en ese caso indica solo las que realmente encajen.
  Para productos muy específicos (deporte → "decathlon"; muebles → "ikea"; tech serio → "pccomponentes" + "amazon"; libros y cultura → "amazon" + "elcorteingles"), incluye la tienda especialista junto a la generalista para dar al usuario más opciones de calidad-precio.`;

  const typeRules: Record<GiftType, string> = {
    fisica: `- Todas las ideas deben ser productos físicos comprables online.
- "amazonQuery" debe ser una búsqueda específica de 3-6 palabras útil para encontrar el producto en cualquier tienda online.
- Si la idea es ropa o calzado y conoces la talla, inclúyela en "amazonQuery" (ej: "zapatillas running hombre talla 42", "camiseta algodón mujer talla M").
${storesGuide}`,
    experiencia: `- Todas las ideas deben ser experiencias (cenas, talleres, escapadas, conciertos, actividades…). No productos físicos.
- "amazonQuery" debe ser una búsqueda de 3-6 palabras para encontrar esa experiencia en Google (ej. "cata de vinos Madrid", "taller cerámica Barcelona").
- Omite "suggestedStores" en este tipo de ideas (no aplica).
- "category" debe referenciar los intereses concretos de la persona que motivan la experiencia (ej: ["Fotografía"], ["Cocina"], ["Senderismo"]). Si la experiencia no encaja con ningún interés definido, usa una etiqueta específica a la actividad (ej: ["Escape Room"], no ["Aventura"]).`,
    "tiempo-juntos": `- Todas las ideas deben ser planes gratuitos o caseros: actividades para hacer juntos, recetas, rutas, vales artesanales, etc.
- "amazonQuery" debe ser una frase descriptiva de 3-5 palabras para buscar inspiración en Google (ej. "ruta senderismo fácil", "receta cena especial").
- Los precios deben ser bajos o cero (experiencias sin coste o materiales mínimos).
- Omite "suggestedStores" en este tipo de ideas (no aplica).
- "category" debe referenciar los intereses concretos de la persona que motivan el plan (ej: ["Leer"], ["Cocina"]). Si el plan no encaja con ningún interés definido, usa una etiqueta específica al plan (ej: ["Paseo al atardecer"], no ["Romántico"]).`,
    sorprendeme: `- Mezcla libremente productos físicos, experiencias y planes juntos. Varía el tipo entre las 9 ideas.
- Para productos: "amazonQuery" útil para buscar online y rellena "suggestedStores" siguiendo los criterios. Para experiencias/planes: "amazonQuery" útil para Google y omite "suggestedStores".
- Si la idea es ropa o calzado y conoces la talla, inclúyela en "amazonQuery".
${storesGuide}`,
  };

  return `Genera EXACTAMENTE 9 ideas de regalo para la siguiente persona.

Persona:
- Nombre: ${person.name}
- Relación con quien regala: ${relationshipLabel}
- Intereses: ${interestsText}
- Notas: ${notesText}
- Presupuesto: ${budgetText}
- Ocasión: ${occasionLabel}
${practicalLines ? practicalLines + "\n" : ""}${historyLines}

Reglas:
${typeRules[giftType]}
- Los precios deben respetar el presupuesto indicado cuando sea posible.
- Varía las categorías (no todas del mismo tipo).
- "description" en español, máximo 2 frases, explicando por qué encaja con esta persona.
- "category" es un array JSON de 1 a 3 strings en español. Usa intereses concretos del perfil que justifiquen la idea (ej: ["Senderismo", "Fotografía"], ["Cocina japonesa"], ["Gaming", "Tecnología"]). Si la idea no encaja con ningún interés definido, usa una etiqueta descriptiva específica al regalo (ej: ["Accesorios viaje"], no ["Viajes"]). Nunca uses categorías genéricas sueltas como ["Tecnología"], ["Hogar"] o ["Libros"] si hay intereses más concretos disponibles.
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
  const { occasionLabel, giftType } = parsed.data;

  const [person, matchingDate, history] = await Promise.all([
    fetchQuery(api.people.getById, { id: personId }, { token }),
    fetchQuery(api.importantDates.getByPersonAndLabel, { personId, label: occasionLabel }, { token }),
    fetchQuery(api.giftHistory.getByPerson, { personId }, { token }),
  ]);

  if (!person) {
    return NextResponse.json(
      { error: "Persona no encontrada" },
      { status: 404 },
    );
  }

  // Rate limit: verificar cuota sin consumirla aún.
  try {
    await fetchQuery(api.recommendationUsage.check, {}, { token });
  } catch (err) {
    if (err instanceof ConvexError) {
      return NextResponse.json(
        { error: typeof err.data === "string" ? err.data : "Has alcanzado el límite diario de recomendaciones." },
        { status: 429 },
      );
    }
    console.error("[recommendations] rate limit check:", err);
    return NextResponse.json(
      { error: "Error interno al verificar el límite de uso." },
      { status: 500 },
    );
  }

  const prompt = buildPrompt(person, matchingDate?.budgetMin, matchingDate?.budgetMax, occasionLabel, giftType, history);

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: giftRecommendationsSchema,
      prompt,
    });

    // Guardar primero; consumir cuota solo si el upsert tiene éxito.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await fetchMutation(api.recommendations.upsert, { personId, occasionLabel, giftType, ideas: object.ideas as any }, { token });
    await fetchMutation(api.recommendationUsage.consume, {}, { token });

    return NextResponse.json(object);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[recommendations] gemini:", message, err);
    // AI_RetryError wraps the real cause in lastError
    const statusCode =
      err != null && typeof err === "object"
        ? (err as Record<string, unknown>).statusCode ??
          (
            (err as Record<string, unknown>).lastError as
              | Record<string, unknown>
              | undefined
          )?.statusCode
        : undefined;
    const isOverloaded = statusCode === 503;
    return NextResponse.json(
      {
        error: isOverloaded
          ? "La IA está saturada ahora mismo — no se ha consumido cuota. Inténtalo en unos minutos."
          : "No hemos podido conectar con la IA en este momento, inténtalo de nuevo.",
        ...(process.env.NODE_ENV !== "production" && { detail: message }),
      },
      { status: isOverloaded ? 503 : 500 },
    );
  }
}
