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

## Multi-tienda

Para regalos físicos cada tarjeta muestra un chip por cada tienda relevante. El click abre una búsqueda en esa tienda con la query que generó la IA. La lista de tiendas que se ven en cada tarjeta resulta del cruce entre tres señales:

1. Las **tiendas soportadas** (4 hardcoded por la app).
2. Las **favoritas del usuario** (configuradas en `/settings`).
3. Las **sugeridas por la IA** para esa idea concreta (`suggestedStores`).

### Por qué multi-tienda

Antes solo había Amazon. Ampliar a 4 tiendas amplía el rango calidad-precio sin coste técnico: Gemini no consulta catálogos reales — devuelve una query de búsqueda genérica de 3-6 palabras y la app construye URLs deterministas por tienda. Cero alucinaciones de URL, cero claves API, fácil añadir tiendas.

### Tiendas soportadas

Definidas en [`src/lib/stores.ts`](../src/lib/stores.ts). Lista cerrada con allowlist en cliente (`STORE_IDS`) y servidor (`ALLOWED_STORES` en [`convex/validators.ts`](../convex/validators.ts)).

| Store ID | Etiqueta | Plantilla de URL | Encaje típico |
|---|---|---|---|
| `amazon` | Amazon | `https://www.amazon.es/s?k={query}` | Generalista. Tech, libros, marcas internacionales, envío rápido |
| `elcorteingles` | El Corte Inglés | `https://www.elcorteingles.es/search/?s={query}` | Gourmet, vinos, moda media-alta, hogar, regalos premium nacionales |
| `aliexpress` | AliExpress | `https://es.aliexpress.com/w/wholesale-{query}.html` | Gadgets baratos, accesorios sin marca, espera larga |
| `miravia` | Miravia | `https://www.miravia.es/search?q={query}` | Marketplace asiático/europeo curado, moda y belleza |
| `decathlon` | Decathlon | `https://www.decathlon.es/es/search?Ntt={query}` | Deporte y outdoor: running, ciclismo, montaña, fitness, camping |
| `ikea` | IKEA | `https://www.ikea.com/es/es/search/?q={query}` | Hogar, muebles, decoración, textil hogar, organización, iluminación |
| `pccomponentes` | PcComponentes | `https://www.pccomponentes.com/search/?query={query}` | Tech especializada: componentes PC, periféricos, gaming, monitores |

Las URLs se construyen con `encodeURIComponent` sobre la query, así que cualquier carácter especial queda escapado correctamente. Los enlaces siempre llevan `target="_blank" rel="noopener noreferrer"`.

### Filtro de precio en la URL

Algunas tiendas aceptan filtro de precio en la query string, otras no. La lista actual está en `STORES_WITH_PRICE_FILTER` (`src/lib/stores.ts`):

| Tienda | Filtro precio | Sintaxis |
|---|---|---|
| `amazon` | ✅ | `&low-price={n}&high-price={m}` |
| `aliexpress` | ✅ | `?minPrice={n}&maxPrice={m}` |
| `elcorteingles` | ❌ | Filtros van en path, no en query string |
| `miravia` | ❌ | Filtros JS-driven, URL params no honran |
| `decathlon` | ❌ | Filtros JS-driven, parámetros desconocidos redirigen a home |
| `ikea` | ❌ | Filtros JS-driven |
| `pccomponentes` | ❌ | Sintaxis no documentada con fiabilidad |

En las tiendas que NO soportan filtro fiable, el chip enlaza a la búsqueda sin filtrar — preferible a un filtro silencioso que la tienda ignore.

**Padding de la franja**: `padPriceRange(min, max)` ensancha `[min × 0.8, max × 1.3]` antes de pasarla al filtro. Motivo: la IA estima precios y suele subestimarlos un poco; un filtro estricto sobre una estimación deja la página vacía con frecuencia. Ejemplos: `[30, 50] → [24, 65]`, `[10, 15] → [8, 20]`, `[30, 30] → [24, 39]`.

El padding solo afecta a la URL del filtro. La etiqueta de precio en la card sigue mostrando los valores originales que devolvió Gemini.

Notas:

- El campo de la idea se llama `amazonQuery` por motivos legacy (antes solo existía Amazon). Su contenido ya es una query genérica de 3-6 palabras válida para cualquier tienda. Renombrarlo a `searchQuery` requiere migración Convex y queda fuera de alcance.
- Para `experiencia`, `tiempo-juntos` y `sorprendeme` se mantiene un único botón a Google (no tiene sentido buscar "cena romántica" en AliExpress).
- Sin afiliación. Futuro: parámetros de afiliado por tienda para monetización (Amazon Associates, AliExpress Affiliate, etc.).

### Setting `favoriteStores` (preferencia del usuario)

Cada usuario elige en `/settings` qué tiendas quiere ver en sus tarjetas.

- **Storage**: `userSettings.favoriteStores: string[]` (opcional en el schema). Si nunca se ha tocado, `getMine` devuelve `DEFAULT_FAVORITE_STORES` (las 4).
- **UI**: 4 checkboxes en `/settings`. Validación cliente "selecciona al menos una tienda" antes de llamar la mutation.
- **Mutation**: `setMine` en [`convex/settings.ts`](../convex/settings.ts) llama `sanitizeStores` (allowlist contra `ALLOWED_STORES`) y rechaza el array vacío con error.
- **Lectura**: tanto `getMine` como el cliente vuelven a pasar el array por `sanitizeFavoriteStores` para mantener orden canónico y filtrar valores caducados (por si se elimina una tienda en el futuro — p.ej. Etsy quedó como valor legacy filtrado tras retirarla).

### Tiendas sugeridas por idea (`suggestedStores`)

Para evitar mostrar chips a tiendas que claramente no tienen el producto (miel artesanal de un pueblo en AliExpress), la IA marca por idea en qué tiendas tiene sentido buscar.

- **Schema**: campo opcional en `giftRecommendationSchema` con `z.array(z.enum(STORE_IDS)).min(1).max(4)`. Opcional por compatibilidad con ideas cacheadas pre-v2 que no lo tienen.
- **Persistencia**: `recommendations.ideas[].suggestedStores: v.optional(v.array(v.string()))` en el schema Convex.
- **Reglas que el prompt impone a Gemini** (ver `buildPrompt` en [`src/app/api/recommendations/route.ts`](../src/app/api/recommendations/route.ts)):
  - **Incluir siempre al menos una generalista** (`amazon` o `elcorteingles`) salvo en casos claramente nicho (artesanal, gourmet hiper-local, hecho a medida).
  - **Generalistas** (`amazon`, `elcorteingles`): Amazon en la mayoría de tech/libros/marcas internacionales; ECI cuando marca/calidad importan o es producto muy "español".
  - **Marketplaces baratos** (`aliexpress`, `miravia`): solo cuando la idea funciona con producto barato + espera larga aceptable; excluir gourmet español, moda media-alta, calidad relevante.
  - **Especialistas** — la IA tiene que añadir la tienda especialista junto a la generalista cuando claramente encaja:
    - `decathlon` → solo si la idea es claramente deportiva/outdoor.
    - `ikea` → hogar, muebles, decoración, textil; útil para mudanzas o pareja que estrena piso.
    - `pccomponentes` → tech serio (PCs, periféricos gaming, monitores, smart home).
  - Solo se pide para `fisica` y para los items físicos dentro de `sorprendeme`. Para `experiencia` y `tiempo-juntos` el prompt instruye explícitamente a omitir el campo.

### Lógica de renderizado

`pickEffectiveStores(favoriteStores, suggestedStores)` en [`src/lib/stores.ts`](../src/lib/stores.ts) decide qué chips mostrar. Es pura y testeada en `stores.test.ts`.

| Caso | `stores` devuelto | `isFallback` | UI |
|---|---|---|---|
| `suggestedStores` ausente o vacío (idea cacheada pre-v2 o tipo no físico) | Todas las favoritas | `false` | Chips sin hint |
| Hay intersección entre sugeridas y favoritas | Solo la intersección | `false` | Chips sin hint |
| Hay sugeridas pero ninguna coincide con favoritas | Todas las favoritas | `true` | Chips + texto "Búsqueda genérica — esta idea encaja mejor en otras tiendas" |

El orden de los chips es siempre el canónico de `ALL_STORES` (Amazon, AliExpress, Miravia, El Corte Inglés), sin importar el orden en que llegan los inputs.

### Defensa en profundidad

La salida de un LLM se trata como input no confiable. El flujo de validación tiene 3 capas:

```
Gemini  →  generateObject + Zod (giftRecommendationSchema)  →  fetchMutation(api.recommendations.upsert)  →  validateRecommendationIdeas  →  Convex DB
                          [/api/recommendations/route.ts]                                                     [convex/validators.ts]
```

1. **Zod** rechaza cualquier idea con campos fuera de tipo o tienda no listada (`z.enum(STORE_IDS)`).
2. **`validateRecommendationIdeas`** se ejecuta dentro de la mutation Convex y revalida tamaños, rangos numéricos, allowlist de tiendas, no-duplicados, y exactamente 6 ideas. Cierra el agujero de "atacante autenticado llama a `api.recommendations.upsert` directamente saltándose la API route" (ver [`docs/security.md`](security.md) sección "Validar tamaños y rangos en el servidor").
3. **`encodeURIComponent`** al construir la URL impide cualquier inyección desde la query string al path/dominio.

Si en algún momento futuro Gemini empieza a devolver datos hostiles (prompt injection vía `notes`/`interests` del usuario), el daño máximo es: query de búsqueda rara que el propio usuario abriría en su navegador. Sin amplificación cross-user, sin escape a otros endpoints.

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
| [`src/lib/gifts.ts`](../src/lib/gifts.ts) | Tipos `GiftType`, `GiftRecommendation`, schema Zod (incluye `suggestedStores`), constante `GIFT_TYPES` |
| [`src/lib/stores.ts`](../src/lib/stores.ts) | `STORE_IDS`, `STORE_LABELS`, `generateStoreSearchUrl`, `pickEffectiveStores`, `sanitizeFavoriteStores` |
| [`src/lib/stores.test.ts`](../src/lib/stores.test.ts) | Tests unitarios de URL building, sanitización y `pickEffectiveStores` |
| [`convex/settings.ts`](../convex/settings.ts) | `getMine` y `setMine` con `favoriteStores`; importa `ALLOWED_STORES` de `validators.ts` |
| [`convex/validators.ts`](../convex/validators.ts) | Allowlist `ALLOWED_STORES` y `validateRecommendationIdeas` (defensa en profundidad sobre `upsert`) |
| [`src/app/(app)/settings/page.tsx`](../src/app/%28app%29/settings/page.tsx) | UI de selector de tiendas favoritas (4 checkboxes) |

---

## Mejoras pendientes

- **Excluir `discardedTitles` en `buildPrompt`**: el campo ya se persiste, pero el prompt todavía no los inyecta para evitar que la IA repita ideas descartadas al regenerar.
- **Afiliación**: añadir parámetros de afiliado por tienda en `generateStoreSearchUrl` cuando haya cuentas (Amazon Associates, AliExpress Affiliate, etc.).
- **Recordatorios escalonados**: no relacionado con IA, pero la estructura de `importantDates` ya lo soporta.

---

## Verificación manual

### Flujo base
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

### Multi-tienda
- [ ] En `/settings` aparece la sección "Tiendas para recomendaciones" con 4 checkboxes (todas marcadas por defecto)
- [ ] Desmarcar todas y pulsar "Guardar" → toast de error "Selecciona al menos una tienda", no se guarda
- [ ] Marcar solo Amazon + ECI, guardar, recargar → la selección persiste
- [ ] Generar 6 ideas físicas → cada tarjeta muestra solo chips de Amazon/ECI (no AliExpress/Miravia)
- [ ] Generar ideas con un mix temático (gourmet + tech + algo artesanal) y revisar que **no todas las tarjetas muestran las mismas tiendas** (la IA filtra por idea)
- [ ] Marcar solo AliExpress + Miravia y generar una idea de gourmet/vino → debería aparecer el hint "Búsqueda genérica — esta idea encaja mejor en otras tiendas" (la IA habrá sugerido `amazon`/`elcorteingles`, sin solapamiento)
- [ ] Click en cada chip abre la búsqueda real de esa tienda con la query correcta
- [ ] Cambiar el tipo a "experiencia" o "tiempo-juntos" → solo aparece el botón único a Google, sin chips de tienda
- [ ] Las ideas cacheadas pre-multi-tienda (sin `suggestedStores`) deberían mostrar todas las favoritas del usuario sin hint hasta que se regeneren
