# IA y recomendaciones de regalos

## Flujo completo

```
Usuario → click "Generar ideas"
  → POST /api/recommendations { personId, occasionLabel, giftType }
  → Busca persona en Convex (intereses, notas, tallas, alergias, dislikes)
  → Busca la fecha importante que coincide con occasionLabel (presupuesto por ocasión)
  → Busca historial de regalos anteriores (para no repetir)
  → Llama a Gemini 2.5 Flash via AI SDK con generateObject
  → Persiste las 6 ideas en Convex (tabla recommendations, upsert)
  → Devuelve 6 recomendaciones validadas por Zod
  → Cada tarjeta muestra título, descripción, precio, categoría y botón Amazon/Google
```

## Presupuesto por ocasión

El presupuesto (`budgetMin` / `budgetMax`) se asocia a cada **fecha importante** (`importantDates`), no a la persona. Esto permite gastar distinto en el cumpleaños y en el Día de la Madre de la misma persona.

- Almacenado en **céntimos** de euro en Convex (`budgetMin`, `budgetMax` en `importantDates`).
- Convertido a euros en los formularios (`value * 100` al guardar, `value / 100` al cargar).
- Al generar recomendaciones, la ruta `/api/recommendations` busca la `importantDate` cuyo `label` coincide con `occasionLabel` mediante `api.importantDates.getByPersonAndLabel`. Si no hay fecha con ese label (o la fecha no tiene presupuesto), se pasa `undefined` y el prompt dice "sin límite definido".
- El campo `budgetMin`/`budgetMax` en la tabla `people` se mantiene como **legacy opcional** para no romper documentos existentes en producción, pero ya no se usa en ningún flujo activo.

## Implementación (`/api/recommendations/route.ts`)

```typescript
const [person, matchingDate, history] = await Promise.all([
  fetchQuery(api.people.getById, { id: personId }, { token }),
  fetchQuery(api.importantDates.getByPersonAndLabel, { personId, label: occasionLabel }, { token }),
  fetchQuery(api.giftHistory.getByPerson, { personId }, { token }),
]);

const prompt = buildPrompt(
  person,
  matchingDate?.budgetMin,   // céntimos → la fn formatea a euros
  matchingDate?.budgetMax,
  occasionLabel,
  giftType,
  history,
);

const { object } = await generateObject({
  model: google("gemini-2.5-flash"),
  schema: giftRecommendationsSchema,   // definido en src/lib/gifts.ts
  prompt,
});

await fetchMutation(api.recommendations.upsert,
  { personId, occasionLabel, giftType, ideas: object.ideas }, { token });
```

`generateObject` valida la respuesta contra el schema Zod automáticamente.

## Diseño del prompt (`buildPrompt`)

```
Genera EXACTAMENTE 6 ideas de regalo para la siguiente persona.

Persona:
- Nombre: {name}
- Relación: {relationship}
- Intereses: {interests} | sin definir
- Notas: {notes} | ninguna
- Presupuesto: entre Xmin€ y Xmax€ | sin límite definido
- Ocasión: {occasionLabel}
[Talla de zapato / ropa / alergias / dislikes — solo si están definidos]
[Historial de regalos anteriores — hasta 10 entradas, con reacción]

Reglas:
[según giftType: física / experiencia / tiempo-juntos / sorprendeme]
- Responde en español.
```

El presupuesto viene de `matchingDate?.budgetMin/Max` (convertido de céntimos a euros con `formatBudget`). Si la fecha no tiene presupuesto, el prompt dice "sin límite definido".

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

- [ ] Crear persona con intereses y **añadir una fecha con presupuesto definido**
- [ ] Ir a `/people/[id]/gifts`, seleccionar esa ocasión, hacer click en "Generar ideas"
- [ ] El prompt incluye el presupuesto de la fecha (verificar en logs del servidor)
- [ ] Aparecen 6 tarjetas con título, descripción, precio, categoría y botón de búsqueda
- [ ] Generar de nuevo (con ideas descartadas) produce sugerencias distintas
- [ ] Persona con fecha sin presupuesto → el prompt dice "sin límite definido", precios variados
- [ ] Persona sin intereses definidos → la IA igualmente devuelve 6 resultados genéricos
