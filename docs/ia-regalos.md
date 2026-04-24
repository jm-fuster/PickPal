# IA y recomendaciones de regalos

## Flujo completo

```
Usuario → click "Generar ideas"
  → POST /api/recommendations { personId, occasionLabel }
  → Busca persona en Convex (intereses, notas, presupuesto)
  → Llama a Gemini via AI SDK con generateObject
  → Devuelve 6 recomendaciones validadas por Zod
  → Cada tarjeta muestra título, descripción, precio y botón Amazon
```

## Implementación (`/api/recommendations/route.ts`)

```typescript
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const GiftSchema = z.object({
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priceRange: z.string(),                   // ej: "25€–40€"
    category: z.enum([
      "Experiencia", "Tech", "Libros", "Moda",
      "Comida", "Bienestar", "Hogar", "Hobby", "Suscripción"
    ]),
    amazonSearchQuery: z.string(),            // términos específicos para Amazon
    reasoningNote: z.string(),               // qué interés motivó esta idea
  })).length(6),
})

const { object } = await generateObject({
  model: google("gemini-2.0-flash"),
  schema: GiftSchema,
  prompt: buildGiftPrompt(person, occasionLabel),
})
```

`generateObject` valida la respuesta contra el schema Zod automáticamente — no hay parsing manual ni riesgo de respuestas malformadas.

## Diseño del prompt (`buildGiftPrompt`)

```
Eres un experto en regalos personalizados.
Genera 6 ideas de regalo para la siguiente persona:

- Nombre: {name}
- Relación: {relationship}
- Ocasión: {occasionLabel}
- Intereses: {interests.join(", ")}
- Notas: {notes || "ninguna"}
- Presupuesto: {budgetText}  (ej: "25€–75€" o "flexible")

Reglas:
- No repitas la misma categoría más de 2 veces
- No sugieras tarjetas regalo
- amazonSearchQuery debe ser específico (ej: "cuaderno punteado cuero A5", no solo "cuaderno")
- Los precios deben estar dentro del presupuesto indicado
- reasoningNote debe mencionar qué interés o detalle concreto motivó la idea
```

## URLs de Amazon (`src/lib/amazon.ts`)

```typescript
export function generateAmazonUrl(query: string): string {
  return `https://www.amazon.es/s?${new URLSearchParams({ k: query })}`
}
```

- Sin API key ni cuenta de afiliado.
- El modelo genera queries específicas para maximizar la relevancia de los resultados.
- Futuro: añadir parámetro `tag` de Amazon Associates para monetización.

## Verificación manual

- [ ] Crear persona con intereses y presupuesto definido
- [ ] Ir a `/people/[id]/gifts` y hacer click en "Generar ideas"
- [ ] Aparecen 6 tarjetas con título, descripción, precio y categoría
- [ ] Cada tarjeta tiene botón "Buscar en Amazon" que abre búsqueda relevante
- [ ] Generar de nuevo produce ideas diferentes
- [ ] Persona sin intereses definidos → la IA igualmente devuelve 6 resultados genéricos
- [ ] Persona sin presupuesto → los precios son variados
