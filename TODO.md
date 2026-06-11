# TODO — Auditoría de seguridad y QA (2026-06-11)

> **Para el agente ejecutor:** este documento es autocontenido; no necesitas la conversación
> que lo originó. Ejecuta las tareas **en orden de fase** (F0 → F4). Cada tarea indica
> ficheros, cambio exacto y criterios de aceptación. Marca cada checkbox al completar.

## Reglas del proyecto (obligatorias)

1. **Antes de tocar código Convex**, lee `convex/_generated/ai/guidelines.md`.
2. **Antes de cualquier cambio en `convex/schema.ts`**, ejecuta `npx convex dev --once` para validar. Nunca elimines campos que aún tengan documentos en prod.
3. **Antes de tocar APIs/mutations/env vars**, lee `docs/security.md`. Si introduces un patrón de seguridad nuevo, actualiza ese doc **en el mismo commit**.
4. **Antes de tocar UI**, consulta `docs/design-system.md`; si cambias algo visual, actualízalo en el mismo commit.
5. Trabaja **directamente en `main`** (no worktrees, no ramas). Si el harness crea un worktree: commit + ff-merge + push antes de terminar.
6. **Mensajes de commit en inglés**, estilo conventional commits (el repo usa `feat(scope):`, `fix(scope):`).
7. Toda `useQuery` autenticada debe gatearse con `isLoaded && isSignedIn ? args : "skip"`.
8. Verificación mínima por fase: `npx vitest run` + `npx next build` (o `npm run build`) sin errores. Para cambios Convex: `npx convex dev --once`.

---

## F0 — Vulnerabilidad confirmada (prioridad máxima)

### - [x] T1. Cascade de `savedIdeas` al borrar persona + purga de huérfanos al borrar cuenta

**Hallazgo (MEDIO, confirmado 9/10):** `people.remove` ([convex/people.ts](convex/people.ts) ~línea 100) cascada `importantDates`, `giftHistory` y `recommendations` pero **no `savedIdeas`**. `account.deleteMyAccount` ([convex/account.ts](convex/account.ts) ~línea 47) purga `savedIdeas` solo iterando las `people` vivas, y `savedIdeas` solo tiene índice `by_person`. Las ideas guardadas de una persona borrada quedan huérfanas para siempre, incluso tras borrar la cuenta — contradice `docs/security.md` §7 y la promesa de `src/app/privacidad/page.tsx` ("borra de forma permanente todos tus datos").

**Cambios:**

1. `convex/schema.ts` — añadir índice (no rompe nada; valida con `npx convex dev --once`):
   ```ts
   savedIdeas: defineTable({ /* campos actuales sin tocar */ })
     .index("by_person", ["personId"])
     .index("by_user", ["clerkUserId"]),
   ```
2. Extraer un helper `deletePersonCascade(ctx, personId)` (p. ej. en `convex/people.ts` o un módulo compartido interno) que borre: `importantDates`, `giftHistory`, `recommendations` **y `savedIdeas`** (vía índice `by_person`). Usarlo desde `people.remove` **y** desde `account.deleteMyAccount`.
3. En `account.deleteMyAccount`, tras el bucle de people, añadir barrido de huérfanos ya existentes:
   ```ts
   const orphanSaved = await ctx.db
     .query("savedIdeas")
     .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
     .collect();
   for (const s of orphanSaved) await ctx.db.delete(s._id);
   ```
4. Actualizar `docs/security.md` §7 si describe el detalle de la cascada.

**Aceptación:** borrar una persona elimina sus `savedIdeas`; `deleteMyAccount` no deja ninguna fila con el `clerkUserId` del usuario en ninguna tabla; ambos caminos comparten el helper.

**Commit sugerido:** `fix(privacy): cascade savedIdeas on person delete and purge orphans on account deletion`

---

## F1 — Seguridad-UX y errores (alto valor, bajo riesgo)

### - [x] T2. `ConvexError` para todos los errores de cara a usuario + toasts saneados

**Problema:** los guardarraíles de `convex/**` lanzan `Error` plano. En prod Convex lo redacta a `[CONVEX M(people:create)] [Request ID: …] Server Error`, así que (a) los toasts filtran identificadores internos `módulo:función` y (b) los mensajes en español nunca llegan al usuario. El único flujo correcto hoy es `convex/recommendationUsage.ts` (ya usa `ConvexError`).

**Cambios:**

1. En `convex/**` (al menos: `rateLimit.ts`, `validators.ts`, `auth.ts`, `people.ts`, `importantDates.ts`, `giftHistory.ts`, `savedIdeas.ts`, `settings.ts`, `recommendations.ts`): sustituir cada `throw new Error("<mensaje en español para el usuario>")` por `throw new ConvexError("<mismo mensaje>")` (import de `convex/values`). Los errores puramente internos pueden seguir siendo `Error`.
2. Crear helper en `src/lib/` (p. ej. `errors.ts`):
   ```ts
   import { ConvexError } from "convex/values";
   export function userErrorMessage(err: unknown, fallback = "No se pudo guardar. Inténtalo de nuevo.") {
     return err instanceof ConvexError && typeof err.data === "string" ? err.data : fallback;
   }
   ```
3. Usarlo en todos los catch con toast: `src/app/(app)/settings/page.tsx` (~109), `src/components/gifts/GiftsPanel.tsx` (~228), `src/components/people/PersonForm.tsx` (~394), `src/components/people/ImportantDateForm.tsx` (~73 y ~345), `src/components/people/GiftHistoryForm.tsx` (~55 y ~216). Nunca renderizar `err.message` crudo.
4. Actualizar `docs/security.md` §5 documentando el patrón `ConvexError` + `userErrorMessage`.

**Aceptación:** grep de `err.message` en `src/` no devuelve usos en toasts; los límites (50 personas/día, etc.) muestran su mensaje en español.

**Commit:** `fix(errors): use ConvexError for user-facing errors and sanitize toast messages`

### - [x] T3. Endpoint de recomendaciones: 400/404 correctos y orden upsert/consume

**Fichero:** `src/app/api/recommendations/route.ts`

1. Las cuatro `fetchQuery` paralelas (~línea 201) van sin try/catch: un `personId` malformado o ajeno revienta `Promise.all` → 500 genérico y el branch 404 (~208) es inalcanzable. Envolver en try/catch y devolver `404 { error: "Persona no encontrada." }` cuando Convex lance por ownership/ID inválido.
2. Convertir el par `check`/`consume` en **reserva atómica**: nueva mutation `reserve` en `convex/recommendationUsage.ts` que incrementa el contador ANTES de llamar a Gemini (lanza `ConvexError` si `count >= 10`), y mutation `refund` llamada solo en el catch para fallos retriables del proveedor (503/timeout). Eliminar la llamada a `consume` posterior al `upsert`. Esto cierra: la carrera de coste con peticiones concurrentes y el caso "ideas guardadas pero el usuario ve error".
3. Eliminar el eco de internals de Zod (~línea 193): sustituir `{ error: ..., issues: parsed.error.issues }` por `{ error: "Parámetros inválidos" }` con status 400.
4. Actualizar `docs/security.md` (§4 cuota y §5 errores) en el mismo commit.

**Aceptación:** POST con personId ajeno → 404; con body inválido → 400 sin `issues`; dos POST concurrentes en el límite no producen más de 10 generaciones/día ni un falso error tras éxito.

**Commit:** `fix(api): atomic quota reserve, correct 4xx responses, stop echoing zod issues`

### - [x] T4. Sesión expirada: redirect en vez de skeletons infinitos

**Problema:** con `isLoaded && !isSignedIn` (sesión revocada en otra pestaña) todas las queries quedan en `"skip"` y cada página muestra skeleton para siempre.

**Cambio:** en `src/app/(app)/layout.tsx`, cuando `isLoaded && !isSignedIn`, invocar `useClerk().redirectToSignIn()` (o renderizar un estado "Tu sesión ha caducado" con botón a sign-in). Respetar el patrón de gating existente.

**Aceptación:** simular signed-out (devtools → borrar cookie de sesión) en una página interna redirige a sign-in en vez de skeleton permanente.

**Commit:** `fix(auth): redirect to sign-in when session expires instead of infinite skeletons`

---

## F2 — Bugs lógicos con riesgo de datos

### - [x] T5. `key={person._id}` en la ficha de persona (riesgo de escribir datos de A en B)

**Fichero:** `src/app/(app)/seres-queridos/[personId]/page.tsx` (~línea 718). `PersonDetailContent` siembra estado local desde props una vez y el App Router no remonta al cambiar solo `params` (back/forward entre fichas): la ficha B puede mostrar datos de A y un blur de autosave los escribiría en B. **Fix:** añadir `key={person._id}` al render de `PersonDetailContent`.

**Commit:** `fix(people): remount person detail on navigation to prevent stale-state writes`

### - [x] T6. El alta de persona pierde los "Datos prácticos"

**Fichero:** `src/app/(app)/seres-queridos/new/page.tsx` (~línea 16). `PersonForm` recoge `shoeSize`, `clothingSize`, `allergies`, `dislikes` y `convex/people.ts` `create` los acepta, pero la página no los pasa a la mutación. **Fix:** incluirlos en la llamada a `create`.

**Aceptación:** crear persona rellenando datos prácticos y verificar que aparecen en su ficha.

**Commit:** `fix(people): persist practical data fields when creating a person`

### - [x] T7. Doble-submit al borrar cuenta deja sesión colgante

**Ficheros:** `src/app/api/account/delete/route.ts` (~17-39), `src/app/(app)/settings/page.tsx` (~148).

1. En la ruta: si Clerk `users.deleteUser` devuelve 404 (usuario ya borrado en un intento anterior), tratarlo como éxito (idempotencia) en vez de 500.
2. En el cliente: asegurar que tras respuesta OK siempre se llega a `signOut`.

**Aceptación:** dos clics rápidos en eliminar cuenta acaban en signOut limpio, sin toast de error falso.

**Commit:** `fix(account): make account deletion idempotent and always sign out on success`

### - [x] T8. Duplicados en ideas guardadas y títulos repetidos del LLM

1. **Guardado doble:** `src/components/gifts/GiftRecommendationCard.tsx` (~78): deshabilitar el pulgar arriba cuando `saved`; en `src/components/gifts/GiftsPanel.tsx` `handleSave` (~203) añadir guarda; en `convex/savedIdeas.ts` `save` (~21) deduplicar server-side (mismo `personId` + `title` + `occasionLabel` → no insertar segunda fila).
2. **Títulos duplicados de Gemini:** en `src/app/api/recommendations/route.ts`, tras validar la respuesta, deduplicar ideas por `title` (conservar la primera) antes del `upsert`, ya que la UI y `removeIdea` usan el título como clave.

**Commit:** `fix(gifts): prevent duplicate saved ideas and dedupe LLM ideas by title`

---

## F3 — Hardening

### - [ ] T9. Cabeceras: CSP Report-Only + COOP + `poweredByHeader: false`

**Fichero:** `next.config.ts` (las cabeceras actuales viven en ~líneas 3-15: HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy).

```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // ...resto igual
};
// añadir a securityHeaders:
{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }, // valor seguro para OAuth de Clerk
{
  key: "Content-Security-Policy-Report-Only",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://va.vercel-scripts.com",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.convex.cloud wss://*.convex.cloud",
    "img-src 'self' data: https://api.dicebear.com https://img.clerk.com",
    "style-src 'self' 'unsafe-inline'",
    "frame-src https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
  ].join("; "),
},
```
Ajustar el host de Clerk al dominio de producción antes de pasar de Report-Only a enforcing (eso es una tarea futura, NO en este TODO). Documentar en `docs/security.md` que la CSP está en report-only y por qué.

**Commit:** `feat(security): add CSP report-only, COOP header, drop x-powered-by`

### - [ ] T10. Defensa CSRF en profundidad vía `Sec-Fetch-Site`

**Fichero:** `src/proxy.ts` (hoy la única barrera CSRF es `SameSite=Lax` de Clerk):
```ts
export default clerkMiddleware(async (auth, req) => {
  if (req.method !== "GET" && req.nextUrl.pathname.startsWith("/api")) {
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") return new Response("Forbidden", { status: 403 });
  }
  if (!isPublicRoute(req)) await auth.protect();
});
```
Adaptar al shape real del middleware existente (no sobrescribir la lógica actual de rutas públicas). Documentar en `docs/security.md`.

**Commit:** `feat(security): reject cross-site mutating API requests via sec-fetch-site`

### - [ ] T11. Cerrar gaps de validación en la frontera Convex

1. `convex/recommendations.ts` `upsert` (~80): validar `occasionLabel` (trim no vacío, ≤ 40 chars) y `giftType` contra la allowlist `["fisica", "experiencia", "tiempo-juntos", "sorprendeme"]` (verificar los valores reales en el código antes de copiar).
2. `convex/recommendations.ts` `removeIdea` (~41): caps `ideaTitle ≤ 80`, `occasionLabel ≤ 40`, `giftType ≤ 20`; y acotar el array: `discardedTitles: [...(existing.discardedTitles ?? []), ideaTitle].slice(-200)`.
3. `convex/settings.ts` `setMine` (~105): mover `requireUser(ctx)` a la **primera línea** del handler, antes de cualquier validación de argumentos. Aplicar el mismo invariante en cualquier otro handler donde no sea lo primero.

**Commit:** `fix(convex): mirror validation caps at the Convex boundary and auth-first handlers`

### - [ ] T12. Minimización de PII hacia Gemini

**Fichero:** `src/app/api/recommendations/route.ts`, `buildPrompt` (~121-130). El prompt envía nombre completo + alergias a Google. Enviar solo el nombre de pila:
```ts
- Nombre: ${person.name.split(/\s+/)[0]}
```
Mantener `allergies` (funcionalmente necesario). Revisar `src/app/privacidad/page.tsx`: si no menciona que los datos del perfil se envían a un proveedor de IA para generar ideas, añadirlo.

**Commit:** `feat(privacy): minimize PII sent to the LLM provider`

---

## F4 — QA: bugs menores y a11y

### - [ ] T13. A11y de formularios y estados (gaps concretos, no auditoría genérica)

1. `src/components/people/GiftHistoryForm.tsx`: renderizar `errors.reaction` y `errors.year` (hoy el submit falla en silencio total); añadir `aria-invalid` al `SelectTrigger` de reacción (~138). Aplicar lo mismo en `EditGiftHistoryInline`.
2. `src/components/people/BudgetRangeSlider.tsx` (~64-98): ligar el `<p>` de error a los inputs min/max con `aria-describedby` + `aria-invalid`.
3. Selects de mes en `PersonForm.tsx` (~139) e `ImportantDateForm.tsx` (~167): `aria-invalid`/`aria-describedby` en el trigger cuando hay error.
4. Pill "Guardado" del autosave: en `src/app/(app)/seres-queridos/[personId]/page.tsx` (~441) y `src/app/(app)/settings/page.tsx` (~379), renderizar el texto condicionalmente dentro de la región `aria-live` (hoy solo cambia opacidad y nunca se anuncia).
5. Botón papelera en `[personId]/page.tsx` (~228): `aria-label={"Eliminar a " + person.name}`.

Consultar `docs/design-system.md` antes y actualizarlo si procede.

**Commit:** `fix(a11y): announce form errors and autosave state, label delete controls`

### - [ ] T14. Bugs de calendario

1. `convex/importantDates.ts` `assertValidDate` (~10): hacerla consciente del mes — `const daysInMonth = new Date(year ?? 2024, month, 0).getDate(); if (day > daysInMonth) throw new ConvexError("Día inválido para ese mes.");` (2024 bisiesto permite 29-feb en fechas recurrentes sin año).
2. `src/components/dashboard/DateGroupedList.tsx` (~10): la cabecera para 29-feb en año no bisiesto muestra "1 de marzo" mientras la cuenta atrás apunta a 28-feb. Reutilizar la lógica de fallback de `src/lib/dates.ts` (`computeDaysUntilNextOccurrence`) para derivar la fecha de la etiqueta en vez de `new Date(year, 1, 29)` naive.
3. `src/lib/dates.ts` `computeDaysUntil` (~62): añadir fallback 29-feb→28-feb también para fechas únicas (no recurrentes).
4. Añadir/ajustar tests en `src/lib/dates.test.ts` cubriendo los tres casos.

**Commit:** `fix(dates): month-aware validation and leap-day handling in labels and countdowns`

### - [ ] T15. Pulido restante

1. `src/app/(app)/seres-queridos/[personId]/page.tsx` (~94): `savedTimerRef` es un objeto literal recreado en cada render → usar `useRef` como hace `settings/page.tsx` (~61).
2. `src/components/gifts/GiftsPanel.tsx` (~413): si el usuario descarta las 9 ideas, mostrar estado vacío con CTA "Generar de nuevo" en vez de grid en blanco.
3. SUX-4: mostrar cuota restante proactivamente — el endpoint ya devuelve `remaining` desde `recommendationUsage`; pintarlo junto al botón de generar ("Te quedan N hoy").
4. Borrar `src/lib/mock-data.ts` (no se importa en ningún sitio; contiene además un enum inválido `"coworker"`). Verificar con grep antes de borrar.

**Commit:** `fix(ui): autosave timer ref, empty discard state, quota hint, drop dead mock data`

---

## Verificación final (tras completar todas las fases)

- [ ] `npx vitest run` en verde.
- [ ] `npx convex dev --once` sin errores de schema.
- [ ] `npm run build` (Next) sin errores ni warnings nuevos.
- [ ] Smoke manual: crear persona con datos prácticos → generar ideas → guardar/descartar → borrar persona → borrar cuenta. Verificar en el dashboard de Convex que no quedan filas del usuario.
- [ ] `docs/security.md` refleja: patrón ConvexError, reserva atómica de cuota, Sec-Fetch-Site, CSP report-only.
- [ ] Push a `main` (https://github.com/JMFusterr/PickPal.git).
