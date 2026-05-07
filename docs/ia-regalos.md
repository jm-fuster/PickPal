# IA y recomendaciones de regalos

## Flujo completo

```
Usuario → selecciona un evento del perfil (Select)
  → elige tipo de regalo (tarjeta de tipo)
  → click "Generar 6 ideas"
    → POST /api/recommendations { personId, occasionLabel, giftType }
    → Busca persona en Convex (intereses, notas, tallas, alergias, dislikes)
    → Busca la importantDate cuyo label == occasionLabel (presupuesto)
    → Busca historial de regalos anteriores (para no repetir)
    → Llama a Gemini 2.5 Flash vía AI SDK con generateObject
    → Persiste las 6 ideas en Convex (tabla recommendations, upsert)
    → Devuelve 6 recomendaciones validadas por Zod
    → Cada tarjeta muestra título, descripción, precio, categoría y botón Amazon/Google
```

---

## Selección de evento (ocasión)

La pantalla muestra un `<Select>` con los eventos (`importantDates`) guardados en el perfil de esa persona. Solo se puede elegir entre ellos — no hay campo de texto libre.

- El presupuesto de la fecha seleccionada se aplica automáticamente al prompt (ver sección siguiente).
- El `<Select>` muestra el presupuesto junto al label cuando la fecha lo tiene definido: `Cumpleaños · 50–100€`.
- Si la persona no tiene ningún evento, la opción aparece deshabilitada: "Sin eventos guardados".
- El botón "Generar" queda deshabilitado hasta que se elige un evento.
- Al cambiar de evento, las ideas en pantalla se limpian (`ideas = null`) para que no queden ideas de una ocasión mezcladas con otra.

---

## Presupuesto por ocasión

El presupuesto (`budgetMin` / `budgetMax`) se asocia a cada **fecha importante** (`importantDates`), no a la persona. Esto permite gastar distinto en el cumpleaños y en el Día de la Madre de la misma persona.

- Almacenado en **céntimos** de euro en Convex (`budgetMin`, `budgetMax` en `importantDates`).
- Convertido a euros en los formularios (`value * 100` al guardar, `value / 100` al cargar).
- Al generar recomendaciones, `/api/recommendations` busca la `importantDate` cuyo `label` coincide con `occasionLabel` mediante `api.importantDates.getByPersonAndLabel`. Si la fecha no tiene presupuesto, se pasa `undefined` y el prompt dice "sin límite definido".
- El campo `budgetMin`/`budgetMax` en la tabla `people` se mantiene como **legacy opcional** para no romper documentos existentes en producción, pero ya no se usa en ningún flujo activo.

---

## Tipos de regalo

Cuatro opciones mutuamente excluyentes definidas en `src/lib/gifts.ts`:

| Valor | Icono (lucide) | Label | Descripción visible | Comportamiento del prompt |
|---|---|---|---|---|
| `fisica` | `ShoppingBag` | Producto físico | Algo que comprar y envolver | Productos comprables online. `amazonQuery` se usa como query de búsqueda en cada tienda favorita del usuario. |
| `experiencia` | `Ticket` | Experiencia | Cena, taller, escapada… | Cenas, talleres, escapadas, conciertos. `amazonQuery` para Google. |
| `tiempo-juntos` | `Heart` | Tiempo juntos | Planes sin coste o caseros | Planes gratuitos o caseros. Precios bajos o cero. |
| `sorprendeme` | `Shuffle` | Sorpréndeme | Mezcla de los tres tipos | Mezcla libre de los tres tipos anteriores. |

Se muestran como tarjetas en grid 2×2 (4×1 en `sm+`) con icono, nombre y descripción corta. Sin emojis — se usan iconos de lucide-react para coherencia con el resto de la UI. Cambiar el tipo limpia las ideas en pantalla (`ideas = null`).

---

## Estado de carga (skeletons)

Mientras la petición a Gemini está en curso (`loading === true`):
- El botón muestra "Generando…" y queda deshabilitado.
- Se muestran 6 tarjetas placeholder con `animate-pulse` y fondo `bg-muted/40` para indicar actividad.
- Al llegar la respuesta, las tarjetas reales aparecen con animación escalonada (`animationDelay: index * 60ms`).

---

## Caché de ideas

Las ideas generadas se persisten en Convex (`tabla recommendations`) indexadas por `(clerkUserId, personId, occasionLabel, giftType)`. Esto permite:

- Mostrar las últimas ideas al volver a la pantalla sin consumir cuota.
- El botón cambia a "Regenerar" (con icono `RefreshCw`) cuando existen ideas cacheadas para la combinación seleccionada.
- Un aviso informa al usuario de que regenerar consume cuota diaria.
- Las ideas locales (state React) tienen prioridad sobre las cacheadas: `showIdeas = ideas ?? cached?.ideas`.

---

## Límite de uso (rate limit)

10 generaciones por usuario por día (UTC). El flujo es en dos pasos para que los errores de la IA **no consuman cuota**:

1. `api.recommendationUsage.check` (query, sin efecto): verifica que el usuario tiene cuota disponible. Si está agotada lanza `ConvexError` y la API devuelve `429`.
2. Gemini se llama solo si el check pasa.
3. `api.recommendationUsage.consume` (mutation): incrementa el contador **únicamente si Gemini devuelve éxito**. Se ejecuta en paralelo con `api.recommendations.upsert`.

Si Gemini falla (saturación, error de modelo, etc.) el contador no se toca y el usuario puede volver a intentarlo sin perder cuota.

---

## Descartar ideas (botón X)

Cada tarjeta tiene un botón X en la esquina superior derecha.

### UX de descarte

1. Al pulsar X, la tarjeta desaparece inmediatamente de la pantalla (optimistic update en el state local).
2. Aparece un **toast permanente** (sin temporizador de auto-cierre) con el mensaje "Esta idea no se volverá a mostrar" y un botón "Deshacer".
3. La idea **no se elimina de Convex todavía** — queda en una cola de pendientes (`pendingDiscards` ref).

### Cuándo se hace efectivo el descarte en Convex

| Acción del usuario | Resultado |
|---|---|
| Cierra el toast manualmente (X del toast) | `removeIdea` se llama en `onDismiss` |
| Navega fuera de la pantalla | El `useEffect` de cleanup llama `removeIdea` por cada pendiente |
| Pulsa "Deshacer" | Se borra la entrada del mapa de pendientes; la idea vuelve a su posición original; `removeIdea` **no** se llama |

### Por qué el descarte usa título (no índice)

La mutación `removeIdea` busca la idea por `ideaTitle`, no por posición en el array. Esto evita que descartes múltiples rápidos desajusten los índices entre el estado local y el array de Convex.

```typescript
// convex/recommendations.ts
await ctx.db.patch(existing._id, {
  ideas: existing.ideas.filter((idea) => idea.title !== ideaTitle),
  discardedTitles: [...(existing.discardedTitles ?? []), ideaTitle],
});
```

### Campo `discardedTitles`

Los títulos descartados se acumulan en `recommendations.discardedTitles` (array de strings). El propósito es que al regenerar, el prompt pueda excluirlos — **esta parte aún no está implementada en `buildPrompt`**, es una mejora pendiente.

---

## Implementación (`/api/recommendations/route.ts`)

```typescript
// 1. Datos de contexto + check de cuota en paralelo
const [[person, matchingDate, history]] = await Promise.all([
  Promise.all([
    fetchQuery(api.people.getById, { id: personId }, { token }),
    fetchQuery(api.importantDates.getByPersonAndLabel, { personId, label: occasionLabel }, { token }),
    fetchQuery(api.giftHistory.getByPerson, { personId }, { token }),
  ]),
]);

// 2. Verificar cuota sin consumirla (lanza ConvexError si agotada)
await fetchQuery(api.recommendationUsage.check, {}, { token });

// 3. Llamar a Gemini — si falla aquí, la cuota no se toca
const { object } = await generateObject({
  model: google("gemini-2.5-flash"),
  schema: giftRecommendationsSchema,   // definido en src/lib/gifts.ts
  prompt,
});

// 4. Solo si Gemini tuvo éxito: consumir cuota y persistir ideas
await Promise.all([
  fetchMutation(api.recommendationUsage.consume, {}, { token }),
  fetchMutation(api.recommendations.upsert,
    { personId, occasionLabel, giftType, ideas: object.ideas }, { token }),
]);
```

`generateObject` valida la respuesta contra el schema Zod automáticamente.

---

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

---

## Tiendas soportadas (`src/lib/stores.ts`)

Para regalos físicos la tarjeta muestra un chip por cada tienda que el usuario tiene marcada como favorita. Cada chip enlaza a una **búsqueda determinista** construida desde el `amazonQuery` que devuelve la IA — no se le pide a Gemini que invente URLs.

| Store ID | Plantilla de URL |
|---|---|
| `amazon` | `https://www.amazon.es/s?k={query}` |
| `aliexpress` | `https://es.aliexpress.com/w/wholesale-{query}.html` |
| `miravia` | `https://www.miravia.es/search?q={query}` |
| `elcorteingles` | `https://www.elcorteingles.es/search/?s={query}` |

Notas:

- El campo se llama `amazonQuery` por motivos legacy (antes solo había Amazon). Su contenido es una query genérica de 3-6 palabras, válida para cualquier tienda. Renombrarlo a `searchQuery` requiere migración Convex y queda fuera de alcance.
- El usuario configura sus tiendas favoritas en `/settings` (campo `userSettings.favoriteStores`). Si nunca lo ha tocado, por defecto aparecen las cuatro.
- Para `experiencia`, `tiempo-juntos` y `sorprendeme` se mantiene el botón único a Google (no tiene sentido buscar "cena romántica" en Aliexpress).
- Sin API keys ni cuentas de afiliado. Futuro: parámetros de afiliación por tienda para monetización (Amazon Associates, AliExpress Affiliate, etc.).

### Tiendas sugeridas por idea (`suggestedStores`)

Para evitar enseñar chips a tiendas que claramente no tienen el producto (ej. miel artesanal en AliExpress), Gemini devuelve un campo opcional `suggestedStores: StoreId[]` por idea. La UI cruza esa lista con las favoritas del usuario:

| Caso | Comportamiento |
|---|---|
| `suggestedStores` ausente o vacío (idea pre-v2 cacheada) | Muestra todas las favoritas, sin hint |
| Intersección no vacía con favoritas | Muestra solo la intersección |
| Sugerencias presentes pero ninguna coincide con favoritas | Fallback a todas las favoritas + hint "Búsqueda genérica — esta idea encaja mejor en otras tiendas" |

Reglas que el prompt impone a Gemini:

- "amazon": casi siempre, salvo productos artesanales/locales claros.
- "aliexpress" / "miravia": gadgets baratos, accesorios, productos sin marca; excluir gourmet español, moda media-alta, artesanía.
- "elcorteingles": gourmet, vinos, moda media-alta, hogar, perfumería, regalos premium nacionales.
- Incluir SIEMPRE al menos una generalista (`amazon` o `elcorteingles`) salvo en casos claramente nicho.

Implementación: `pickEffectiveStores` en [`src/lib/stores.ts`](../src/lib/stores.ts). Es pura y testeada en `stores.test.ts`. La validación Zod (`giftRecommendationSchema`) usa `z.enum(STORE_IDS)` así que cualquier valor inválido devuelto por Gemini hace fallar la generación entera.

### Setting `favoriteStores`

- Se persiste en `userSettings.favoriteStores: string[]` (opcional en el schema).
- Validado server-side en `convex/settings.ts` contra la lista de tiendas conocidas — valores desconocidos se descartan.
- Si el usuario intenta guardar el array vacío, la mutation lanza error y la UI muestra un toast.
- Cliente y servidor sanitizan con `sanitizeFavoriteStores` para mantener orden canónico y filtrar valores caducados (por si se elimina una tienda en el futuro).

---

## Configuración de la API key de Google

La variable de entorno `GOOGLE_GENERATIVE_AI_API_KEY` debe configurarse en Vercel.

**Requisitos para que funcione en producción:**
1. Crear la API key en [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. El proyecto de Google Cloud asociado **debe tener facturación activada** — sin billing, la cuota del free tier es 0 y todas las llamadas fallan con 429.
3. Configurar un **spending cap** en [ai.studio/spend](https://ai.studio/spend) (recomendado: 1–5 €) para no incurrir en costes inesperados. Con el volumen actual de PickPal el coste real es < 0,01 €/mes.
4. Con billing activo y cap > 0, el free tier de `gemini-2.5-flash` (1 500 req/día, 15 RPM) es suficiente para cientos de usuarios activos diarios.

**Modelo actual:** `gemini-2.5-flash`. `gemini-2.0-flash` está retirado para API keys nuevas.

---

## Archivos clave

| Archivo | Rol |
|---|---|
| [`src/app/(app)/people/[personId]/gifts/page.tsx`](../src/app/%28app%29/people/%5BpersonId%5D/gifts/page.tsx) | Página principal: selector de evento, tipo, generación, descarte con toast+undo |
| [`src/components/gifts/GiftRecommendationCard.tsx`](../src/components/gifts/GiftRecommendationCard.tsx) | Tarjeta de idea: título, descripción, precio, categoría, botón de búsqueda, botón X |
| [`src/app/api/recommendations/route.ts`](../src/app/api/recommendations/route.ts) | API route: fetches Convex, llama a Gemini, persiste resultado |
| [`convex/recommendations.ts`](../convex/recommendations.ts) | `getByPersonOccasion`, `upsert`, `removeIdea` |
| [`convex/recommendationUsage.ts`](../convex/recommendationUsage.ts) | Rate limit: `check` (query sin efecto) + `consume` (mutation, solo tras éxito) |
| [`src/lib/gifts.ts`](../src/lib/gifts.ts) | Tipos `GiftType`, `GiftRecommendation`, schema Zod, constante `GIFT_TYPES` |
| [`src/lib/stores.ts`](../src/lib/stores.ts) | Tiendas soportadas, builder de URLs de búsqueda, helpers de validación |
| [`convex/settings.ts`](../convex/settings.ts) | `userSettings.favoriteStores` con validación y default |

---

## Mejoras pendientes

- **Excluir `discardedTitles` en `buildPrompt`**: el campo ya se persiste, pero el prompt todavía no los inyecta para evitar que la IA repita ideas descartadas al regenerar.
- **Afiliación**: añadir parámetros de afiliado por tienda en `generateStoreSearchUrl` cuando haya cuentas (Amazon Associates, AliExpress Affiliate, etc.).
- **Recordatorios escalonados**: no relacionado con IA, pero la estructura de `importantDates` ya lo soporta.

---

## Verificación manual

- [ ] Crear persona con intereses y **añadir una fecha con presupuesto definido**
- [ ] Ir a `/people/[id]/gifts`, el `<Select>` muestra los eventos con presupuesto
- [ ] Seleccionar evento → botón "Generar" se activa
- [ ] Click en "Generar" → aparecen 6 skeletons con fondo visible mientras carga
- [ ] Aparecen 6 tarjetas con título, descripción, precio, categoría y botón de búsqueda
- [ ] Volver a la pantalla sin regenerar → las ideas cacheadas aparecen y el botón dice "Regenerar"
- [ ] Pulsar X en una tarjeta → desaparece, toast permanente con "Deshacer"
- [ ] Pulsar "Deshacer" → la tarjeta vuelve a su posición
- [ ] Cerrar el toast manualmente → la idea se elimina de Convex (verificar en dashboard de Convex)
- [ ] Navegar fuera de la pantalla con toasts abiertos → las ideas pendientes se eliminan de Convex al desmontar
