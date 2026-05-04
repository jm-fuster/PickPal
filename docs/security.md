# Seguridad · Giftly

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

Los validators viven en [`convex/validators.ts`](../convex/validators.ts) y espejan los límites de [`src/lib/schemas.ts`](../src/lib/schemas.ts). Si añades un campo a una tabla:

1. Define su límite en el zod schema cliente (UX).
2. Replica el límite en `validators.ts`.
3. Llama al validator desde `create` y `update`.

Por qué importa: sin esto un usuario autenticado puede insertar `notes` de 100 MB, presupuestos negativos, o 10.000 intereses. Aparte de coste de almacenamiento, los campos de texto se concatenan al prompt de Gemini → amplifica prompt injection.

### 4. Rate limit en mutations que crean recursos

Helper genérico en [`convex/rateLimit.ts`](../convex/rateLimit.ts):

```ts
await checkAndIncrement(ctx, clerkUserId, "create_foo", 50);
```

Aplícalo a cualquier mutation que:
- Cree filas (DoS de almacenamiento).
- Llame a APIs externas de pago (cuota).
- Envíe notificaciones / emails.

Buckets actuales: `create_person` (50/día), `create_date` (100/día), `recommendationUsage` (10/día, tabla aparte por motivos históricos).

No hace falta en `update`/`remove` (no son superficie de abuso de almacenamiento).

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

**Nunca** propagar `err.message` al cliente: filtra estructura interna (Convex, Gemini, env vars) que ayuda a un atacante a mapear el sistema.

### 6. Proxy default-deny

[`src/proxy.ts`](../src/proxy.ts) protege **todo** salvo lo que esté en `isPublicRoute`. Si añades una página o endpoint:

- Si requiere sesión (caso por defecto): no toques nada, ya está protegido.
- Si debe ser público: añádelo explícitamente a `isPublicRoute`. **Justifica por qué en el commit.**

### 7. Variables de entorno

- `NEXT_PUBLIC_*` se inyecta en el bundle cliente. **Nunca** poner secrets ahí.
- Secrets server-only: `CLERK_SECRET_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `CONVEX_DEPLOYMENT`.
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

---

## Lo que NO está implementado todavía

Decisiones explícitas de "ahora no":

- **CSP estricta**: pendiente. Next.js 16 + Clerk requiere nonces para inline scripts. Hacerlo mal rompe la app silenciosamente. PR aparte cuando haya tiempo de probar en staging.
- **Rate limit por IP**: solo hay rate limit por usuario autenticado. Suficiente mientras no haya endpoints anónimos.
- **Webhooks**: no existen. Cuando se añadan (Clerk, Stripe, etc.), **siempre verificar firma con el secret del proveedor antes de procesar**.
- **Auditoría de acceso**: no se loguea quién leyó qué. Aceptable para una app personal; revisar si pasa a multi-tenant.

---

## Cuándo actualizar este documento

- Añades un nuevo patrón de seguridad (helper, validator, middleware).
- Decides explícitamente *no* implementar algo (añádelo a la sección anterior).
- Encuentras un gap durante una revisión y lo cierras: documenta el principio, no el incidente.
- Cambias los límites de validación o rate limit (los números viven aquí y en código, mantener sincronizados).
