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

- `validatePersonInput` — campos de `people` (nombre, intereses, marcas favoritas — máx. 10 × 40 chars —, notas, tallas, alergias, dislikes, avatar).
- `validateBudget` — `budgetMin`/`budgetMax` en `importantDates` (cap 100.000€, min ≤ max).
- `validateDateInput` — campos de `importantDates` (label, año, recurring + budget).
- `validateRecommendationIdeas` — el array `ideas` que `api.recommendations.upsert` persiste tras una llamada a Gemini. Aplica:
  - Entre 1 y 9 ideas (la generación produce 9, pero la API route descarta títulos duplicados de Gemini antes de persistir; 0 o más de 9 se rechazan).
  - Caps por idea: title ≤ 80, description ≤ 280, category ≤ 40, amazonQuery ≤ 120 chars; precios finitos en [0, 100.000€].
  - `suggestedStores` (opcional): allowlist contra `ALLOWED_STORES`, sin duplicados, máximo 4 elementos.
  - `matchedBrandStores` (opcional, resuelto vía Brandfetch): por entrada, `brand` ≤ 40 chars no vacío, `domain` validado como hostname (regex + ≤ 253 chars), `logoUrl` (opcional) por prefijo del CDN de Brandfetch. Cierra el gap de que un cliente directo inyecte un dominio/URL arbitrarios en el botón de marca. El mismo helper (`validateMatchedBrandStores`) valida el snapshot `matchedBrandStores` que persiste `api.savedIdeas.save` (vía `validateSavedIdeaInput`).

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

**Cuota de recomendaciones = reserva atómica.** `api.recommendationUsage.reserve` (mutation) incrementa el contador **antes** de llamar a Gemini y lanza `ConvexError` si está agotado; al ser una transacción Convex, dos peticiones concurrentes en el límite no pueden superar las 10/día. Si la generación falla (saturación, timeout o validación del schema de Gemini), la API route llama a `refund` para devolver la unidad: como el `return` de éxito va tras el `upsert`, llegar al `catch` garantiza que no se persistió ninguna idea, así que un fallo de formato del proveedor no cuesta una generación. `refund` recibe el `day` UTC que devolvió `reserve` para devolver la unidad al bucket correcto aunque el fallo cruce la medianoche UTC. No existe un `consume` posterior al guardado: el patrón check-luego-consume tenía una carrera de coste y un caso "ideas guardadas pero el usuario ve error".

**`reserve`/`refund` son server-only vía secreto compartido.** Modifican la cuota, así que solo deben invocarse desde la API route (`/api/recommendations`), nunca desde el navegador: sin protección, un usuario autenticado podría llamar a `api.recommendationUsage.refund` directamente y decrementar su propio contador, anulando el límite de 10/día (la protección en la que se apoya la beta). Siguen siendo mutations **públicas** porque la route las invoca con `fetchMutation`, que no alcanza funciones `internal*`; pero exigen `process.env.CONVEX_SERVER_SECRET` como argumento y lo verifican con `assertServerCaller` (fail-closed si no está configurado). El secreto debe valer lo mismo en el entorno de Convex y en el de Next (ver §8). **Patrón general:** una mutation que deba invocarse solo desde el servidor Next —no desde el navegador ni desde otra función Convex— se protege con este secreto compartido; `internalMutation` no sirve aquí porque `fetchMutation` solo alcanza el `api.*` público. `check` (query read-only de cuota restante) no necesita el secreto: leer el propio contador no es superficie de abuso.

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

**CSRF en profundidad:** además del `SameSite=Lax` de las cookies de Clerk, el proxy rechaza con `403` cualquier petición **no-GET** a `/api/*` cuya cabecera `Sec-Fetch-Site` exista y no sea `same-origin`. Los navegadores la añaden automáticamente y un sitio cruzado no puede falsificarla; las peticiones sin la cabecera (clientes antiguos) no se bloquean. Si algún día un endpoint debe aceptar POSTs cross-site legítimos (webhooks), exceptúalo explícitamente y verifica la firma del proveedor.

- Si requiere sesión (caso por defecto): no toques nada, ya está protegido.
- Si debe ser público: añádelo explícitamente a `isPublicRoute`. **Justifica por qué en el commit.**

Rutas públicas actuales:
- `/` — landing.
- `/sign-in(.*)`, `/sign-up(.*)` — flujo Clerk.
- `/privacidad` — aviso de privacidad. Debe ser legible antes de crear cuenta y por terceros que aparezcan como "ser querido" en la cuenta de un usuario.
- `/terminos` — términos y condiciones. Mismo motivo: la página dice "al registrarte aceptas estos términos", así que tienen que poder leerse antes de registrarse. Estuvo protegida por omisión (el default-deny la capturó) y los enlaces del footer y del sign-up llevaban a sign-in — **al añadir una página legal nueva, acordarse de esta lista**.

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
- Secrets server-only: `CLERK_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `PEXELS_API_KEY`, `CONVEX_DEPLOYMENT`, `RESEND_API_KEY`, `CONVEX_SERVER_SECRET`. `RESEND_API_KEY` y `EMAIL_FROM` viven en el entorno de **Convex** (`npx convex env set ...`), no en Next.js, porque solo los consume el cron del backend.
- `CONVEX_SERVER_SECRET` autoriza las mutations de cuota (`reserve`/`refund`, ver §4) como llamadas server-side. Es el **único** secret que debe existir en **ambos** entornos con el **mismo valor**: en Next (lo pasa la API route) y en Convex (`npx convex env set CONVEX_SERVER_SECRET ...`, lo verifica la mutation). Genera el valor con `openssl rand -hex 32`. Sin él configurado, `/api/recommendations` devuelve 503 (fail-closed) — es un requisito de despliegue, no opcional.
- `PEXELS_API_KEY` (fotos de stock en `/api/recommendations`) es **opcional**: sin ella la feature degrada a la cabecera de icono. Las URLs de imagen que devuelve Pexels se validan por prefijo (`https://images.pexels.com/`) en `convex/validators.ts` antes de persistir — mismo patrón de allowlist que el avatar de DiceBear. El volumen de llamadas a Pexels queda acotado por la cuota existente de generaciones (10/usuario/día × 9 fotos por tirada).
- `BRANDFETCH_CLIENT_ID` (tienda oficial de marca en `/api/recommendations`) es **opcional**, mismo modelo que Pexels: sin él la card cae al botón de búsqueda de marca en Google. Server-only, en el entorno de **Next** (lo consume la API route, no Convex). La respuesta de Brandfetch es input no confiable: el `domain` se valida como hostname y el `logoUrl` por prefijo del CDN (`https://cdn.brandfetch.io/`) en `convex/validators.ts` antes de persistir — mismo patrón de allowlist que Pexels/DiceBear. `cdn.brandfetch.io` está en el `img-src` de la CSP: los logos se cargan por hotlink desde el navegador, así que sin esa entrada se romperían al pasar la CSP a enforcing (faltaba, corregido). **Sin caché propia**: la resolución se hace en la tanda de generación y el volumen queda acotado por la cuota de 10 generaciones/día × las pocas marcas que matchea una tanda (muy por debajo del free tier de Brandfetch). Si el volumen creciera, una tabla de caché global —metadato público de marca, no dato de usuario; por eso no entraría en `deleteMyAccount`— sería el siguiente paso.
- **Sonda de tienda (Shopify)**: tras resolver el dominio, la route hace un `GET https://{dominio}/products.json` (best-effort, timeout 2.5s, `redirect: "manual"`) para decidir si enlazar a la búsqueda interna `/search?q=` o a la home. Es una petición saliente a un dominio derivado de datos externos (SSRF-adjacent), pero de bajo riesgo: el dominio procede de la base de marcas de Brandfetch (no de input libre del usuario, que solo escribe el *nombre*), está validado como hostname público (la regex de `normalizeBrandDomain` rechaza IPs y `localhost`), solo se hace `GET` a esa ruta fija, y la respuesta no se refleja al cliente — solo decide un booleano. Si en el futuro el dominio pudiera venir de input libre, revisar (allowlist de TLDs / bloqueo de rangos privados).
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

### Si tocas `package.json` o el lockfile:
- [ ] Ningún aviso nuevo sin resolver ni justificar (`npm audit`); si se acepta uno, va a la tabla de avisos aceptados.
- [ ] No se ha ejecutado `npm audit fix --force`.
- [ ] `npm run lint`, `tsc` y `npm run build` pasan (los majors de tooling rompen el build sin que el CI lo note — el CI solo corre vitest).

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

## Avisos de dependencias (Dependabot / `npm audit`)

Dependabot abre PRs para las dependencias **directas** ([`.github/dependabot.yml`](../.github/dependabot.yml)). Las vulnerabilidades **transitivas** no las puede PR-ear: esas se cierran subiendo la versión dentro del rango semver existente o, si no cabe, con `overrides` en `package.json`.

**Nunca ejecutar `npm audit fix --force`.** Instala majors fuera de rango: hoy metería `eslint@10`, que rompe `eslint-config-next` (y por tanto `next build` y `npm run lint`). El coste supera siempre al de un aviso *dev-only*.

Antes de declarar un aviso "no arreglable", dos comprobaciones:
1. **Verificar el código instalado, no los metadatos.** Un backport de mantenimiento puede contener el fix sin que GitHub acote el rango del aviso. Buscar el guard que describe el CVE en `node_modules/<pkg>/`.
2. **`npm update` puede mentir por caché de metadatos** — dice "up to date" habiendo versiones nuevas. Forzar re-resolución con `--prefer-online`.

### Avisos aceptados

| Aviso | Paquete | Por qué se acepta | Cuándo revisar |
|---|---|---|---|
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) / CVE-2026-14257 (high, DoS por expansión sin límite) | `brace-expansion` | **Ya parcheado; el aviso es inexacto.** El árbol tiene `1.1.17` (backport v1, contiene el guard `EXPANSION_MAX_LENGTH` — verificado en el código instalado) y `5.0.8` (versión oficialmente parcheada). GitHub declara el rango como `<= 5.0.7`, que en semver también encaja con `1.1.17`, así que la instancia v1 no dejará de encajar nunca. Forzar `overrides` a `5.0.8` **rompe el lint**: la v5 cambió el export CJS a `exports.expand` y `minimatch@3` hace `require(...)` y lo llama como función → `TypeError`. Exposición real nula: scope `development`, cadena `eslint → minimatch → brace-expansion`, y lo que se expande son los globs de nuestra propia config de ESLint. | Descartado en Dependabot como *inaccurate* el 30-07-2026. Desaparece solo cuando GitHub acote el rango, o cuando Next soporte ESLint 10 y la cadena entera salte a `brace-expansion@5.x` (ver el `ignore` de `typescript` en [`dependabot.yml`](../.github/dependabot.yml)). |

Descartar un aviso en Dependabot requiere motivo; usar el que sea **cierto** (`inaccurate` cuando el rango del aviso está mal, `not_used` cuando el código no se ejecuta, `tolerable_risk` cuando se asume el riesgo) y añadirlo a esta tabla en el mismo commit.

---

## Cuándo actualizar este documento

- Añades un nuevo patrón de seguridad (helper, validator, middleware).
- Decides explícitamente *no* implementar algo (añádelo a "Lo que NO está implementado todavía").
- Encuentras un gap durante una revisión y lo cierras: documenta el principio, no el incidente.
- Cambias los límites de validación o rate limit (los números viven aquí y en código, mantener sincronizados).
- Descartas o aceptas un aviso de Dependabot (añádelo a la tabla de avisos aceptados con el motivo y la condición de revisión).
