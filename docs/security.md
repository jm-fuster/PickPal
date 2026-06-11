# Seguridad · PickPal

Documento vivo. Captura los principios y checklists que mantienen seguro el backend y las APIs. Cuando una decisión cambie o se introduzca un patrón nuevo, se actualiza este archivo en el mismo commit que toca el código.

El objetivo: que ningún usuario autenticado pueda ver datos de otros, agotar recursos, ni explotar errores informativos.

---

## Modelo de confianza

| Capa | ¿Confianza? | Implicación |
|---|---|---|
| Cliente (navegador, formularios, args en `useMutation`) | **No confiable** | Validación cliente = UX. **Nunca** es seguridad. |
| Endpoints API en `src/app/api/**` | **Frontera** | Validar token Clerk + body con zod antes de tocar nada. |
| Funciones Convex (`convex/**`) | **Frontera** | Validar identidad + ownership + tamaños en cada handler. |
| Datos en Convex / Clerk / Gemini | Confiables | Han pasado las fronteras anteriores. |

**Regla básica:** el `userId` siempre se lee de `ctx.auth.getUserIdentity()` o `auth()` de Clerk. **Nunca** se acepta como argumento del cliente.

---

## Patrones obligatorios

### 1. Toda Convex query/mutation pública empieza con `requireUser()`

```ts
import { requireUser } from "./auth";

export const algo = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);
    // resto
  },
});
```

Si una función necesita ser invocada solo internamente, márcala como `internalMutation` / `internalQuery` y no la expongas en `api.*`.

### 2. Toda operación sobre un recurso verifica ownership

Patrón actual:
- Para `people`: comparar `existing.clerkUserId === clerkUserId` tras `ctx.db.get(id)`.
- Para `importantDates` (recurso anidado): usar `assertOwnsPerson(ctx, personId, clerkUserId)`.

Si añades una tabla nueva con dueño, replica el patrón. Si no es posible identificar el dueño, **no se puede exponer la operación**.

### 3. Validar tamaños y rangos en el servidor

Los validators viven en [`convex/validators.ts`](../convex/validators.ts) y espejan los límites de [`src/lib/schemas.ts`](../src/lib/schemas.ts) y [`src/lib/gifts.ts`](../src/lib/gifts.ts). Si añades un campo a una tabla:

1. Define su límite en el zod schema cliente (UX).
2. Replica el límite en `validators.ts`.
3. Llama al validator desde `create` y `update`.

Por qué importa: sin esto un usuario autenticado puede insertar `notes` de 100 MB, presupuestos negativos, o 10.000 intereses. Aparte de coste de almacenamiento, los campos de texto se concatenan al prompt de Gemini → amplifica prompt injection.

**Validators actuales:**

- `validatePersonInput` — campos de `people` (nombre, intereses, notas, tallas, alergias, dislikes, avatar).
- `validateBudget` — `budgetMin`/`budgetMax` en `importantDates` (cap 100.000€, min ≤ max).
- `validateDateInput` — campos de `importantDates` (label, año, recurring + budget).
- `validateRecommendationIdeas` — el array `ideas` que `api.recommendations.upsert` persiste tras una llamada a Gemini. Aplica:
  - Entre 1 y 9 ideas (la generación produce 9, pero la API route descarta títulos duplicados de Gemini antes de persistir; 0 o más de 9 se rechazan).
  - Caps por idea: title ≤ 80, description ≤ 280, category ≤ 40, amazonQuery ≤ 120 chars; precios finitos en [0, 100.000€].
  - `suggestedStores` (opcional): allowlist contra `ALLOWED_STORES`, sin duplicados, máximo 4 elementos.

  Cierra el gap de que un atacante autenticado llamara directamente a `api.recommendations.upsert` saltándose la API route con un payload masivo.

**Salida de Gemini = input no confiable.** El JSON que devuelve la IA pasa por `generateObject` con un schema Zod (`giftRecommendationSchema`), pero antes de tocar la BD vuelve a validarse en `validateRecommendationIdeas`. Defensa en profundidad: el schema Zod podría aflojar sus restricciones por error, o un cliente malicioso podría llamar a `upsert` directamente con datos que nunca pasaron por Gemini.

### 4. Rate limit en mutations que crean recursos

Helper genérico en [`convex/rateLimit.ts`](../convex/rateLimit.ts):

```ts
await checkAndIncrement(ctx, clerkUserId, "create_foo", 50);
```

Aplícalo a cualquier mutation que:
- Cree filas (DoS de almacenamiento).
- Llame a APIs externas de pago (cuota).
- Envíe notificaciones / emails.

Buckets actuales: `create_person` (50/día), `create_date` (100/día), `save_idea` (50/día), `recommendationUsage` (10/día, tabla aparte por motivos históricos).

**Cuota de recomendaciones = reserva atómica.** `api.recommendationUsage.reserve` (mutation) incrementa el contador **antes** de llamar a Gemini y lanza `ConvexError` si está agotado; al ser una transacción Convex, dos peticiones concurrentes en el límite no pueden superar las 10/día. Si el proveedor falla de forma retriable (503/timeout), la API route llama a `refund` para devolver la unidad. No existe un `consume` posterior al guardado: el patrón check-luego-consume tenía una carrera de coste y un caso "ideas guardadas pero el usuario ve error".

No hace falta en `update`/`remove` (no son superficie de abuso de almacenamiento).

**Notificaciones por correo**: el cron `internal.emails.runDailyEmailNotifications` corre 1 vez/día y la dedup por `(importantDateId, occurrenceYear)` impide repetir envíos para una misma ocurrencia, así que no necesita rate limit. Si más adelante se añade un endpoint manual tipo "enviar email de prueba", aplicar `checkAndIncrement` con bucket `email_test` (p.ej. 5/día). El email destino se lee de `ctx.auth.getUserIdentity().email` (claim del JWT de Clerk) — **nunca** se acepta como argumento del cliente. Las funciones de envío (`internal.emails.*`, `internal.notifications.*`) son `internal*` y no se exponen en `api.*`.

### 5. Endpoints API: validar token, validar body, sanitizar errores

Plantilla mental para `src/app/api/**/route.ts`:

```ts
const { getToken } = await auth();
const token = await getToken({ template: "convex" });
if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

const parsed = requestSchema.safeParse(await req.json());
if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

try {
  // trabajo
} catch (err) {
  console.error("[ruta]", err);
  return NextResponse.json({ error: "Error genérico." }, { status: 500 });
}
```

**Nunca** propagar `err.message` al cliente: filtra estructura interna (Convex, Gemini, env vars) que ayuda a un atacante a mapear el sistema. Tampoco se devuelven los `issues` de zod en los 400 (exponen la forma interna del schema): basta `{ error: "Parámetros inválidos" }`. Los IDs malformados o de otro usuario devuelven el mismo `404` que los inexistentes — el cliente no puede distinguir "no existe" de "no es tuyo".

**Errores en `convex/**` → `ConvexError` + `userErrorMessage`.** Todo error pensado para que lo lea el usuario (validación, rate limit, ownership) se lanza como `throw new ConvexError("<mensaje en español>")` (import de `convex/values`). Motivo: en prod Convex redacta los `Error` planos a `[CONVEX M(modulo:funcion)] Server Error` — el mensaje nunca llega y el toast filtra identificadores internos. Solo los `ConvexError` conservan su `data` en el cliente. Los errores puramente internos (p. ej. `convex/emails.ts`) siguen siendo `Error`.

En el cliente, los catch con toast usan el helper [`src/lib/errors.ts`](../src/lib/errors.ts):

```ts
import { userErrorMessage } from "@/lib/errors";
toast.error(userErrorMessage(err, "No se pudo guardar"));
```

Nunca se renderiza `err.message` crudo en la UI.

### 6. Proxy default-deny

[`src/proxy.ts`](../src/proxy.ts) protege **todo** salvo lo que esté en `isPublicRoute`. Si añades una página o endpoint:

- Si requiere sesión (caso por defecto): no toques nada, ya está protegido.
- Si debe ser público: añádelo explícitamente a `isPublicRoute`. **Justifica por qué en el commit.**

Rutas públicas actuales:
- `/` — landing.
- `/sign-in(.*)`, `/sign-up(.*)` — flujo Clerk.
- `/privacidad` — aviso de privacidad. Debe ser legible antes de crear cuenta y por terceros que aparezcan como "ser querido" en la cuenta de un usuario.

### 7. Borrado de cuenta (autoservicio)

Toda cuenta de PickPal se puede borrar desde [`/settings`](../src/app/(app)/settings/page.tsx) con un diálogo de confirmación ("escribe ELIMINAR").

Flujo:
1. UI llama `POST /api/account/delete` ([`src/app/api/account/delete/route.ts`](../src/app/api/account/delete/route.ts)).
2. La ruta valida el token Clerk y llama a `api.account.deleteMyAccount` ([`convex/account.ts`](../convex/account.ts)), que con `requireUser(ctx)` purga en cascada todo lo del usuario en Convex: `people` (con sus `importantDates`, `giftHistory`, `recommendations`, `savedIdeas`), `userSettings`, `emailNotifications`, `recommendationUsage`, `rateLimitBuckets`. Además barre `savedIdeas` huérfanas vía el índice `by_user` (filas cuya persona ya no existe).
3. Solo si el purge en Convex sale bien, se llama `clerkClient().users.deleteUser(userId)`.
4. UI hace `signOut` y redirige a `/`.

**Cascada de borrado de persona:** el helper `deletePersonCascade(ctx, personId)` ([`convex/people.ts`](../convex/people.ts)) borra `importantDates`, `giftHistory`, `recommendations` y `savedIdeas` de una persona y después la persona. Es el **único** camino válido para borrar una persona: lo usan `people.remove` y `account.deleteMyAccount`. Si añades una tabla anidada bajo `people`, añádela al helper (no a los call sites).

**Reglas al añadir tablas nuevas:** si guardas datos vinculados a un usuario, añade su limpieza a `deleteMyAccount`. La regla aplica también si la tabla no tiene un campo `clerkUserId` directo: el borrado debe alcanzarla por relación (ej. `importantDates` se borra siguiendo `people` → `by_person`). Si una tabla nueva no se puede asociar a un usuario, no se puede exponer.

El `clerkUserId` siempre se lee de la sesión vía `requireUser` — la mutation no acepta argumentos. No existe forma de que un usuario borre los datos de otro.

### 8. Variables de entorno

- `NEXT_PUBLIC_*` se inyecta en el bundle cliente. **Nunca** poner secrets ahí.
- Secrets server-only: `CLERK_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `CONVEX_DEPLOYMENT`, `RESEND_API_KEY`. `RESEND_API_KEY` y `EMAIL_FROM` viven en el entorno de **Convex** (`npx convex env set ...`), no en Next.js, porque solo los consume el cron del backend.
- Nuevo secret → añádelo a `.env.example` como placeholder vacío y documenta dónde se obtiene.

---

## Checklist de PR

Antes de mergear, verifica que el cambio no rompe ninguno de estos:

### Si tocas `convex/**`:
- [ ] Cada query/mutation expuesta llama a `requireUser()`.
- [ ] Cada operación sobre un recurso del usuario verifica ownership.
- [ ] Args nuevos están validados (tamaño, rango, allowlist).
- [ ] Si la mutation crea filas o llama a APIs externas, tiene rate limit.
- [ ] Si la mutation accede a datos cruzados (entre usuarios), está justificado y auditado.

### Si tocas `src/app/api/**`:
- [ ] Token Clerk validado al inicio.
- [ ] Body parseado con zod.
- [ ] Errores genéricos al cliente; detalles a `console.error`.
- [ ] Sin nombres de env vars en mensajes de error visibles al cliente.

### Si tocas `src/proxy.ts`:
- [ ] Si añades a `isPublicRoute`, el commit explica por qué la ruta es legítimamente pública.

### Si tocas `next.config.ts`:
- [ ] No relajas headers existentes sin alternativa equivalente.

### Si tocas `.env*` o `process.env.*`:
- [ ] Nuevos secrets no llevan prefijo `NEXT_PUBLIC_`.
- [ ] `.env.example` actualizado con placeholder.

### Si tocas el schema de Convex:
- [ ] Índices nuevos no exponen datos cruzados (ej. un índice solo por `personId` sin `clerkUserId` en la query).
- [ ] Campos sensibles nuevos están listados aquí.
- [ ] Si el campo viene del cliente o de Gemini y es de tamaño/contenido variable, hay un validator en `convex/validators.ts` que se llama desde la mutation que escribe.

---

## Lo que NO está implementado todavía

Decisiones explícitas de "ahora no":

- **CSP enforcing**: la CSP vive en `Content-Security-Policy-Report-Only` ([`next.config.ts`](../next.config.ts)): registra violaciones en la consola del navegador sin bloquear nada. Motivo: Next.js 16 + Clerk requiere `'unsafe-inline'` en scripts (o nonces), y una CSP enforcing mal ajustada rompe la app silenciosamente. Antes de pasar a enforcing: ajustar el host de Clerk (`*.clerk.accounts.dev`) al dominio de producción y revisar los reports en staging. También se envía `Cross-Origin-Opener-Policy: same-origin-allow-popups` (aísla la ventana sin romper los popups OAuth de Clerk) y `poweredByHeader: false` (no anunciar Next.js).
- **Rate limit por IP**: solo hay rate limit por usuario autenticado. Suficiente mientras no haya endpoints anónimos.
- **Webhooks**: no existen. Cuando se añadan (Clerk, Stripe, etc.), **siempre verificar firma con el secret del proveedor antes de procesar**.
- **Auditoría de acceso**: no se loguea quién leyó qué. Aceptable para una app personal; revisar si pasa a multi-tenant.

---

## Cuándo actualizar este documento

- Añades un nuevo patrón de seguridad (helper, validator, middleware).
- Decides explícitamente *no* implementar algo (añádelo a la sección anterior).
- Encuentras un gap durante una revisión y lo cierras: documenta el principio, no el incidente.
- Cambias los límites de validación o rate limit (los números viven aquí y en código, mantener sincronizados).
