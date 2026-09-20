# Etapas de desarrollo

> **Documento histórico: el plan original, de mayo de 2026.** Se conserva por lo
> que enseña del recorrido, no como lista de tareas. Todo lo que hay aquí se
> construyó; hasta el 20-sep-2026 las casillas figuraban **todas sin marcar**, lo
> que en un repositorio público se lee como que no hay nada hecho. Se han
> convertido en viñetas para que no engañen.
>
> El producto que salió difiere del plan en cosas que conviene saber al leerlo:
>
> | El plan decía | Lo que se construyó |
> |---|---|
> | `/dashboard`, `/people/*` | `/agenda`, `/seres-queridos/*` |
> | `middleware.ts` | `src/proxy.ts` — Next 16 lo renombró, y además deniega por defecto |
> | Filtro de 30/60/90 días | Sin filtro: los próximos 4 meses, agrupados por cercanía |
> | Presupuesto en la persona | En cada fecha, para que cada ocasión tenga el suyo |
> | `src/lib/amazon.ts`, solo Amazon | `src/lib/stores.ts`, once tiendas a elegir |
> | Página `/people/[id]/edit` | Edición en la propia ficha, con autoguardado; esa ruta solo redirige |
> | Grid de 6 tarjetas | Pide nueve ideas y acepta entre seis y nueve |
> | Etapa 7: `notifyDaysBefore` en Ajustes | **No llegó**: el campo existe, pero ninguna pantalla lo expone (ver [`dudas.md`](dudas.md)) |
>
> Y cosas que no estaban en ningún plan y acabaron dentro: avisos por email con su
> cron, historial de regalos que realimenta la generación, ideas guardadas,
> borrado de cuenta en cascada, páginas legales, y el sistema de diseño
> reconciliado con el código.

## Etapa 1 — Scaffolding

Montar la base del proyecto con todas las herramientas configuradas.

- `npx create-next-app@latest pickpal --typescript --tailwind --app --src-dir`
- Instalar dependencias (ver [tech-stack.md](tech-stack.md))
- Configurar Clerk: crear app en dashboard, añadir variables de entorno
- Configurar Convex: `npx convex dev`, enlazar proyecto, añadir URL a `.env.local`
- Inicializar shadcn/ui y añadir componentes base

**Resultado:** proyecto arranca en `localhost:3000` con Clerk y Convex conectados.

---

## Etapa 2 — Autenticación

- Páginas `/sign-in` y `/sign-up` con componentes de Clerk (`<SignIn />`, `<SignUp />`)
- `middleware.ts` con `clerkMiddleware()` para proteger todas las rutas `/app/**`
- `layout.tsx` raíz con `<ClerkProvider>` y `<ConvexProvider>`
- Redireccionamiento a `/dashboard` tras login/registro

**Resultado:** el usuario puede registrarse, iniciar sesión (Google + email) y cerrar sesión.

---

## Etapa 3 — Schema y BD (Convex)

- Definir `convex/schema.ts` con tablas `people` e `importantDates`
- `convex/people.ts`: queries `getAll`, `getById` y mutations `create`, `update`, `remove`
- `convex/importantDates.ts`: queries `getByPerson` y mutations `create`, `update`, `remove`
- Query `getUpcoming` para el sistema de notificaciones

**Resultado:** BD lista con tipos TypeScript generados automáticamente por Convex.

---

## Etapa 4 — CRUD de personas

- `PersonForm.tsx` con react-hook-form + Zod (campos: nombre, relación, intereses, notas, presupuesto)
- `InterestTagInput.tsx` — input con tags para añadir/quitar intereses
- `ImportantDateForm.tsx` — añadir fechas con label personalizable
- Página `/people` — grid de PersonCards
- Página `/people/new` — formulario de creación
- Página `/people/[id]` — detalle con lista de fechas
- Página `/people/[id]/edit` — formulario de edición

**Resultado:** el usuario puede gestionar sus contactos y sus fechas importantes.

---

## Etapa 5 — Dashboard y notificaciones

- `src/lib/dates.ts` — `computeDaysUntilNextOccurrence(month, day, from)`
- Página `/dashboard` con filtro 30/60/90 días
- `UpcomingDateCard.tsx` — card con avatar, nombre, días restantes y botón "Ver regalos"
- `NotificationBell.tsx` con `useQuery(api.importantDates.getUpcoming)` — badge reactivo

**Resultado:** el usuario ve de un vistazo qué fechas se acercan y cuántos días faltan.

---

## Etapa 6 — Recomendaciones IA

- `POST /api/recommendations/route.ts` — recibe `personId` + `occasionLabel`, llama a Gemini via AI SDK con `generateObject`
- `src/lib/amazon.ts` — `generateAmazonUrl(query)`
- `GiftRecommendationCard.tsx` — título, descripción, rango de precio, categoría y botón "Buscar en Amazon"
- Página `/people/[id]/gifts` — botón "Generar ideas" + grid de 6 tarjetas

**Resultado:** la IA genera 9 ideas de regalo personalizadas con links directos a Amazon.

---

## Etapa 7 — Ajustes y polish

- Página `/settings` — configurar días de aviso (`notifyDaysBefore`), cambiar preferencias
- Estados de carga: skeletons en listas, spinner en botón "Generar ideas"
- Manejo de errores: toasts para fallos de API
- Landing page pública `/` con descripción del producto y CTA de registro
- Pruebas del flujo completo (ver sección de verificación en [ia-regalos.md](ia-regalos.md))
