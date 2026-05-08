# Sistema de diseño · PickPal

Documento vivo. Captura las decisiones visuales del producto y el porqué de cada una. Cuando una decisión cambie, se actualiza este archivo en el mismo commit que toca el código.

---

## Intención

PickPal es una app sobre **personas queridas y ocasiones que importan**. El registro visual es el de una libreta de papel cálido, no el de un dashboard SaaS.

- **Sí somos**: Things 3 con calor, Notion personal, papelería de calidad, una agenda de regalos hecha con mimo.
- **No somos**: Linear, Material, Stripe Dashboard, Vercel admin. Nada de gris frío ni gradientes corporativos.

La calidez es diferenciación: casi todo el SaaS B2C parece enterprise. Si el usuario se siente como abriendo una libreta de notas, ya hemos ganado.

---

## Logo y marca

El logo-mark de PickPal son dos figuras entrelazadas que forman las letras "PP". Archivo fuente: [`public/logo-mark.svg`](../public/logo-mark.svg).

### Colores del logo

| Path | Color | Token equivalente |
|---|---|---|
| Figura izquierda (p) + cabeza izquierda | `currentColor` | hereda `--foreground` / `--sidebar-foreground` del contexto |
| Figura derecha (P) + cabeza derecha | `#F1704B` | ~`--secondary` (terracota) |

Los paths del verde oscuro usan `fill="currentColor"` en el componente React, no un color fijo. Esto permite que el logo se adapte automáticamente: sobre fondo oscuro (sidebar, dark mode) hereda el color crema del texto; sobre fondo claro hereda el marrón cálido del texto. El coral se queda fijo porque es el acento de marca.

### Componente

```tsx
import { LogoMark } from "@/components/ui/LogoMark";
<LogoMark className="size-7" />
```

Acepta `className` para controlar tamaño. Incluye `aria-hidden` — el contexto de texto adjunto ya nombra la marca.

### Dónde aparece

| Ubicación | Tamaño | Archivo |
|---|---|---|
| Sidebar desktop | `size-7` | `src/app/(app)/layout.tsx` |
| Header móvil | `size-6` | `src/app/(app)/layout.tsx` |
| Auth layout (sign-in / sign-up) | `size-7` | `src/app/(auth)/layout.tsx` |
| Landing page header | `size-7` | `src/app/page.tsx` |
| Favicon (SVG) | — | `public/logo-mark.svg` → metadata en `src/app/layout.tsx` |

### Pendiente de logo

- **Email**: los clientes de correo no soportan SVG. Necesita un PNG alojado en URL pública para poder meterlo en el header de `convex/emails.ts`. Diferido hasta tener deploy o CDN.
- **Apple Touch Icon**: `apple-icon.png` 180×180 para iOS. Añadir a `public/` y registrar en `metadata.icons.apple`.

---

## Tokens

Definidos en [`src/app/globals.css`](../src/app/globals.css). Todos los colores en `oklch` para mantener consistencia perceptual entre claro y oscuro.

### Colores · light

| Token | Valor | Por qué |
|---|---|---|
| `--background` | `oklch(0.975 0.012 80)` (~`#FBF7EE`) | Crema cálida. Evoca papel ligeramente envejecido, no blanco quirófano. |
| `--foreground` | `oklch(0.27 0.02 50)` | Marrón cálido oscuro, no negro puro. Acompaña al fondo crema sin chocar. |
| `--primary` | `oklch(0.25 0.055 148)` (~`#2D4033`) | Verde bosque. Arraigado, cálido-natural, sin ser "eco startup". |
| `--secondary` | `oklch(0.62 0.13 45)` (~`#D97757`) | Terracota. Acento cálido para badges de relación y elementos de énfasis. |
| `--muted` / `--accent` | `oklch(0.93 0.022 75)` / `oklch(0.93 0.03 78)` | Beige/ámbar sutil — fondos de hover, badges neutros. |
| `--border` | `oklch(0.88 0.025 75)` | Tostado discreto. Define sin gritar. |
| `--chart-3` | `oklch(0.77 0.12 72)` (~`#E8B059`) | Ámbar dorado — acento terciario para gráficas y datos. |

### Colores · dark

Mantenemos calidez también en oscuro. Nada de marrón griseado.

| Token | Valor | Por qué |
|---|---|---|
| `--background` | `oklch(0.18 0.012 50)` | Marrón profundo, no negro. Sigue evocando papel a baja luz. |
| `--foreground` | `oklch(0.94 0.012 80)` | Crema clara con un toque cálido. |
| `--primary` | `oklch(0.42 0.07 148)` | Verde bosque más luminoso para contrastar sobre el fondo oscuro. |
| `--secondary` | `oklch(0.70 0.12 45)` | Terracota más luminosa para badges sobre fondo oscuro. |

### Radii

`--radius` base: `0.875rem`. Escalado en `@theme inline` a sm/md/lg/xl/2xl/3xl/4xl. Curvas generosas — coherentes con el registro suave.

### Sombras

- **Default**: `shadow-sm` para cards y elementos elevados ligeros.
- **Hover de cards interactivas**: aún por consolidar (ver Pendientes).
- **No usar**: `shadow-lg`, `shadow-xl`, `shadow-2xl`. Rompen la sensación de papel y suenan a Material.

---

## Tipografía

Cargadas en [`src/app/layout.tsx`](../src/app/layout.tsx) y expuestas como variables CSS.

| Variable | Familia | Uso |
|---|---|---|
| `--font-sans` | Geist | UI, body, formularios, todo lo que no sea titular. |
| `--font-heading` | Fraunces (serif) | `h1`, `h2`, `h3` (aplicado en base layer de `globals.css`). |
| `--font-mono` | Geist Mono | Reservado para datos técnicos / código si hace falta. No usado todavía. |

### Reglas

- **Pesos válidos en Fraunces**: 400, 500, 600, 700. Para titulares de página preferir `font-medium` (500) o `font-semibold` (600). `font-bold` (700) solo en hero de la landing.
- **Letter spacing en headings**: `-0.015em` aplicado en base layer. No añadir `tracking-tight` adicional encima.
- **Body**: tamaños `text-sm` o `text-base`, `leading-relaxed` cuando hay párrafo de varias líneas.
- **Eyebrows / labels**: sans, `text-xs uppercase tracking-[0.2em] text-muted-foreground`. Ejemplo en el hero de la landing.
- **Eyebrows dentro de `<h2>`**: añadir `font-sans` explícito (`className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"`). Sin él, el base layer aplica Fraunces serif a todo `h2` y los headers de sección quedan en serif, visualmente distintos a los mismos labels en `<p>` dentro de formularios.

### Cuándo NO usar serif

- Botones, badges, inputs, navegación: siempre sans.
- Texto largo (>2 líneas seguidas): siempre sans. Fraunces es para impacto, no para legibilidad de párrafo.

---

## Componentes

### Sidebar

Visible a partir de `lg` (1024px). Implementado en `src/app/(app)/layout.tsx`.

- Fondo: `bg-sidebar` (`oklch(0.22 0.04 148)` — verde oscuro, no negro).
- Links activos: `bg-sidebar-accent text-sidebar-accent-foreground font-medium`.
- Links inactivos: `text-sidebar-foreground/70 hover:bg-sidebar-accent`.
- El componente `SidebarLink` usa `usePathname()` y compara con `startsWith` para resaltar rutas anidadas.
- El `<aside>` usa `h-screen sticky top-0` para que el pie quede siempre visible sin que el contenido principal lo desplace.
- **Header del sidebar**: `<LogoMark size-7>` + texto "PickPal" (link) a la izquierda + `SafeNotificationBell` a la derecha. `flex items-center justify-between`.
- **Pie del sidebar**: `SidebarUserInfo` — `UserButton` de Clerk + email del usuario truncado (`text-xs text-muted-foreground`).
- **Tema**: `defaultTheme="light"` sin `enableSystem`. El toggle está en `/settings`. No hay ThemeToggle en sidebar ni en el header. Los usuarios existentes conservan su preferencia guardada en `localStorage`.
- En móvil (`< lg`): header compacto con hamburguesa (`MobileNav`) + logo a la izquierda, campana + UserButton a la derecha. La navegación se abre en un `Sheet` lateral (shadcn `sheet.tsx`) desde la izquierda. `MobileNav` es un componente cliente en `src/components/layout/MobileNav.tsx`.

**Campana de notificaciones (`NotificationBell` / `SafeNotificationBell`):**

- Botón con icono `Bell`. Muestra un badge numérico con las fechas próximas dentro de la ventana `notifyDaysBefore` (de `userSettings`).
- Al pulsar abre un **popover** (base-ui) con la lista de fechas próximas, ordenadas por días restantes (ascendente).
- Cada fila muestra: nombre de la persona, etiqueta del evento, y un contador coloreado — rojo si es hoy, ámbar si queda ≤ 7 días, gris el resto. Muestra "Hoy" / "Mañana" en vez de "0d" / "1d".
- Cada fila enlaza a `/people/[id]/gifts` (generación de ideas) para pasar a la acción directamente.
- Estado vacío con icono `Gift` cuando no hay nada en la ventana.
- `SafeNotificationBell` envuelve el componente en un `ErrorBoundary` para que un fallo no rompa el layout.

**Secciones de la navegación:**

| Etiqueta | Ruta | Icono |
|---|---|---|
| Agenda | `/dashboard` | `CalendarDays` |
| Seres queridos | `/people` | `Users` |
| Ajustes | `/settings` | `Settings` |

- "Agenda" en vez de "Inicio" porque la sección muestra fechas próximas, no un dashboard genérico.
- "Seres queridos" en vez de "Personas" — voz más cálida y coherente con el registro del producto.
- `CalendarDays` en vez de `Home` — el icono de casita no comunicaba nada sobre fechas.

### Cards (shadcn `Card`)

- Default: `rounded` heredado del token, `border border-border/60` para que la línea sea sutil, `shadow-sm`.
- Padding: `p-4` en cards densas (PersonCard), `p-5`–`p-6` en cards informativas (UpcomingDateCard, GiftRecommendationCard, feature cards).
- **Hover · cards completamente clicables** (toda la card es Link): `transition-all hover:bg-muted/40 hover:shadow-md hover:-translate-y-0.5`. Sutilmente "el papel se levanta". Ejemplo: `PersonCard`.
- **PersonCard**: layout vertical. Avatar `size-16` centrado arriba, nombre centrado, badge de relación (`variant="secondary"`) posicionado `absolute top-3 right-3`, sección de intereses con eyebrow label, y CTA "Ver perfil" (`buttonVariants outline sm w-full`) en el pie. Grid responsive: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5`.
- **Hover · cards con acción interna** (la card no es link, pero contiene botón): `transition-shadow hover:shadow-md`. Sin translate ni cambio de fondo. Ejemplo: `GiftRecommendationCard`.
- **Cards estáticas** (sin acción): solo `shadow-sm`, sin hover. Ejemplo: step cards de la landing.
- **Card de urgencia** (UpcomingDateCard cuando `daysUntil <= 7`): `border-primary/60 shadow-sm bg-primary/5`. El tinte rosado del primary llama la atención sin chillar.
- **Presupuesto en agenda**: `budgetLabel()` en `UpcomingDateCard` divide los valores entre 100 antes de mostrarlos — los presupuestos se almacenan en céntimos en Convex (1000 = 10 €). Cualquier otro componente que muestre presupuestos debe hacer lo mismo.
- **Cards generadas por IA** (GiftRecommendationCard): layout fijo desde arriba — título (`font-medium`), badges de intereses (`variant="secondary"`, 1–3 según lo que devuelva la IA), descripción con altura mínima fija (`min-h-[5rem] line-clamp-4`) para que las cards del grid queden alineadas, separador `border-t border-border/50`, precio prominente (`text-lg font-medium`) + chips de tienda. Sin icono `Sparkles` (se eliminó — el contexto de la página ya comunica que son sugerencias IA). Stagger animation `animate-in fade-in slide-in-from-bottom-2 duration-500` con `animationDelay: index * 60ms` para que aparezcan en cascada. Los 9 skeletons de carga usan `h-52 rounded-2xl border-dashed bg-muted/40 animate-pulse`.

### Buttons

- Variantes shadcn: `default` (terracota), `outline`, `ghost`, `destructive`.
- Tamaños: `sm` para acciones secundarias inline, `default` por defecto, `lg` para CTAs principales.
- **Links que parecen botón**: usar `<Link className={buttonVariants({ ... })}>`. El componente Button de esta app **no soporta `asChild`** porque usa `@base-ui/react` en vez de Radix Slot.

### Badges

- `default` (verde): solo para acciones y CTAs. No usar en badges informativos.
- `secondary` (terracota): badges informativos de identidad/relación ("Amigo/a", "Pareja") y énfasis o urgencia (NotificationBell).
- `outline`: tags de atributos (intereses, etiquetas de fecha) y "+N más".

### Chips de tienda (multi-tienda en `GiftRecommendationCard`)

Las tarjetas de regalo físico muestran 1–N chips, uno por tienda relevante. La lista actual de tiendas soportadas (`STORE_IDS` en `src/lib/stores.ts`) son 7: Amazon, El Corte Inglés, AliExpress, Miravia, Decathlon, IKEA, PcComponentes. En la práctica la IA filtra a 1–3 chips por idea según `suggestedStores`, así que el grupo pocas veces es masivo. Reglas:

- **Estilo**: `<a className={buttonVariants({ size: "sm", variant: "outline" })}>` con logo de tienda (`<img src={STORE_ICONS[store]} className="size-3.5 rounded-sm object-contain bg-white p-px">`) antes del texto, e icono `ExternalLink` (size-3) detrás. Siempre `target="_blank"` + `rel="noopener noreferrer"` (evita reverse tabnabbing).
- **Iconos por tienda**: logos oficiales en PNG o SVG almacenados en `public/stores/{storeId}.{ext}`. `STORE_ICONS` en `src/lib/stores.ts` mapea cada `StoreId` a su path público. Todos se renderizan con `bg-white p-px rounded-sm` para garantizar visibilidad en modo oscuro (muchos logos son monócromos o tienen fondo transparente). Las tiendas de `/settings` usan el mismo `STORE_ICONS` con `size-4`.
- **Layout**: `flex flex-wrap gap-1.5` — los chips hacen wrap a 2 líneas en móvil cuando los 4 no caben.
- **Orden**: canónico de `ALL_STORES` siempre, no el orden en que el usuario los marcó. Predecibilidad > preferencia.
- **Etiqueta**: nombre legible de la tienda (`STORE_LABELS[store]`), no el ID. "El Corte Inglés", no "elcorteingles".
- **Hint de fallback**: cuando la IA sugiere tiendas que no coinciden con las favoritas del usuario, debajo de la fila de chips aparece `<p className="text-[11px] text-muted-foreground">Búsqueda genérica — esta idea encaja mejor en otras tiendas.</p>`. Es el único caso en el que un texto explica el comportamiento del card.
- **No mezclar con icon-only buttons**: si en algún momento se quiere reducir el espacio (más de 4 tiendas, móvil pequeño), usar un overflow menu en vez de quitar las labels — los logos de tienda sin texto son fáciles de confundir.

Ver lógica completa en [`docs/ia-regalos.md`](ia-regalos.md#multi-tienda) y la implementación en [`src/components/gifts/GiftRecommendationCard.tsx`](../src/components/gifts/GiftRecommendationCard.tsx).

### Landing page (`src/app/page.tsx`)

Página de marketing, server component. Estructura:

- **Header**: logo + "PickPal" a la izquierda, `UserButton` de Clerk a la derecha (solo si autenticado).
- **Hero**: eyebrow (`font-sans text-xs uppercase tracking-[0.2em]`) + H1 serif escalado (`text-4xl → lg:text-7xl`) + subtítulo + CTAs.
  - Autenticado: un botón "Ir a la agenda" → `/agenda`.
  - No autenticado: "Empezar gratis" (primary) + "Iniciar sesión" (outline).
- **Steps**: grid `grid-cols-1 sm:grid-cols-3`, tres `Card` estáticas (sin hover). Cada card tiene:
  - Badge de número: `size-6 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold`.
  - Icono lucide `size-5 text-muted-foreground` junto al badge (flex row, `gap-3`).
  - Título `text-xl font-medium` (serif heredado).
  - Cuerpo `text-sm leading-relaxed text-muted-foreground`.
- **Footer**: una línea centrada `text-xs text-muted-foreground`.

**Pasos actuales:**

| # | Icono | Título | Cuerpo |
|---|---|---|---|
| 1 | `Users` | Añade a tus seres queridos | Sus gustos, notas, tallas y sus eventos — cada ocasión con su presupuesto. |
| 2 | `Bell` | Dile cuándo avisarte | Elige con cuántos días de antelación quieres saber que se acerca una fecha. Sin sorpresas. |
| 3 | `Gift` | Genera ideas perfectas | Un botón. Nueve sugerencias adaptadas a esa persona, a la ocasión y a tu presupuesto. |

**Decisiones:**
- Las step cards no tienen hover — son informativas, no interactivas.
- Sin emojis en las cards: el número + icono lucide comunica el paso mejor y mantiene el registro adulto.
- El H1 apunta al pain principal ("regalo perfecto"), no al recordatorio de fechas, que es lo que ya hace el calendario del teléfono.

### Páginas — padding y layout

Padding de página responsive en todos los `<main>`: `p-4 sm:p-6 lg:p-8`. No usar `p-8` fijo.

**Dashboard** (`/dashboard`): layout master-detail diferente según dispositivo.

- **Móvil (< lg)**: columna única. El botón "Ideas de regalo" de cada `UpcomingDateCard` es un `<Link>` que navega a `/seres-queridos/[id]/gifts?occasion=...`.
- **Desktop (≥ lg)**: CSS Grid de dos columnas fijas: `lg:grid-cols-[480px_1fr]`. La columna izquierda (480 px) lista los eventos; la derecha (flexible) muestra el `GiftsPanel` embebido al pulsar "Ideas de regalo". El botón "Ideas de regalo" en desktop es un `<button>` con `onClick` que actualiza el estado local `selected`; el `<Link>` tiene clase `lg:hidden` para que solo sea visible en móvil. El `<button>` nativo necesita `hover:bg-primary/80` explícito porque `buttonVariants` default usa el selector `[a]:hover` que solo aplica a `<a>`.
- **Por qué grid fijo (no flex)**: con `flex-1` en la columna de eventos, su ancho cambia al aparecer el panel, deformando las cards. Con `grid-cols-[480px_1fr]` la columna izquierda siempre mide exactamente 480 px, independientemente de si el panel está abierto o no. El padding `lg:px-1 lg:pb-1` del contenedor de la lista también se aplica siempre (no condicionalmente) para que el ancho disponible de las cards no varíe nunca.
- **Botón dual en `UpcomingDateCard`**: siempre usar `cn(buttonVariants({ size: "sm" }), "lg:hidden")` — nunca pasar clases de display dentro del `className` de `buttonVariants`. `buttonVariants` incluye `inline-flex` en su base; si se pasa `hidden` dentro del objeto `className`, `tailwind-merge` no lo procesa y `inline-flex` prevalece, mostrando ambos botones a la vez en móvil.
- **Scroll de eventos vs. panel fijo**: la lista de eventos fluye con el scroll general de la página (sin scroll propio). La card de regalos usa `position: fixed` con coordenadas exactas derivadas del layout: `top-8 bottom-8 right-8 left-[48.5rem]`. El `left` se calcula como sidebar (`w-60` = 15rem) + padding izquierdo del main (`p-8` = 2rem) + columna de eventos (480px = 30rem) + gap (`gap-6` = 1.5rem) = 48.5rem. Si cambia el ancho del sidebar o el padding del main, hay que actualizar este valor. El panel está fuera del flujo del documento (`fixed`), por lo que la lista de eventos no necesita un placeholder en el grid — se usa `lg:max-w-[480px]` directamente. El panel y la lista de eventos son dos elementos hermanos dentro de un Fragment (`<>`).

**Detalle de persona** (`/people/[id]`): `max-w-6xl w-full`. Suficiente para no desbordar en monitores muy anchos, pero sin el desperdicio de `max-w-4xl`.

**Formularios** (`PersonForm`): sin `max-w` propio — se adapta al contenedor padre. En la página de creación (`/people/new`) el contenedor ya tiene `max-w-4xl`.

**PersonForm — layout dos columnas en desktop:**
- A partir de `lg`: `grid grid-cols-2 items-start gap-6`.
- Columna izquierda: avatar, nombre, relación, intereses, notas.
- Columna derecha: card "Datos prácticos" (talla zapato, talla ropa, alergias, no le gusta) + `EventsSection` (si `includeDates` es `true`).
- Cada bloque semántico usa `space-y-5` entre grupos y `space-y-1.5` label–input–error.

**PersonForm — sección Eventos (al crear):**
- `EventsSection` lista los eventos añadidos en memoria (antes de guardar la persona) y ofrece un botón dashed "Añadir evento".
- Al pulsar, aparece `AddEventForm` inline (misma card, sin dialog ni navegación).
- `AddEventForm` usa `<div>`, NO `<form>` — evita anidamiento de `<form>` HTML prohibido. El botón "Añadir evento" es `type="button"` con `onClick={handleSubmit(onAdd)}`.
- Al confirmar, el evento se añade al array local con `useFieldArray.append` y el subformulario desaparece. El usuario puede añadir varios antes de guardar la persona.
- `BudgetRangeSlider` es un componente compartido (`src/components/people/BudgetRangeSlider.tsx`) usado en `AddEventForm`, `ImportantDateForm` y `EditImportantDateInline`.

### GiftsPanel (generación de regalos)

`src/components/gifts/GiftsPanel.tsx`. Componente único con dos modos:

| Prop | Modo standalone | Modo embebido |
|---|---|---|
| `embedded` | `false` (default) | `true` |
| Wrapper | `<main className="flex flex-1 flex-col gap-8 p-8 max-w-6xl">` | `rounded-2xl` card con scroll interno |
| Cabecera | Título `h1` + back link `← [nombre]` | Avatar + nombre + botón `✕` |
| Grid de ideas | `sm:grid-cols-2 lg:grid-cols-3` | `grid-cols-1` |
| Scroll | Scroll general de página | Scroll interno acotado |

**Modo standalone**: usado por `/seres-queridos/[id]/gifts/page.tsx`, que es un thin wrapper. La ruta acepta `?occasion=...` para preseleccionar el evento y `?from=person` para indicar el origen. El back link es contextual:
- Sin `from` (entrada desde agenda): "← Agenda", vuelve a `/agenda`.
- Con `?from=person` (entrada desde la ficha): "← [nombre de la persona]", vuelve a `/seres-queridos/[id]`.

El `backHref` lo calcula la página y lo pasa como prop a `GiftsPanel`. El label lo resuelve el panel: si `backHref === "/agenda"` muestra "Agenda", si no muestra `person?.name ?? "Volver"`.

**Modo embebido**: usado por el dashboard. La card exterior tiene `overflow-hidden rounded-2xl` — esto recorta el scrollbar nativo a las esquinas redondeadas. La card interior tiene `overflow-y-auto max-h-[calc(100vh-11rem)]` con el scroll real. **Nunca poner `overflow-y-auto` y `rounded-2xl` en el mismo div**: el scrollbar se renderiza fuera de las esquinas redondeadas en Chrome/Windows.

La altura del panel viene determinada por el contenedor `fixed` del dashboard (`top-8 bottom-8`), así que el wrapper embebido usa `h-full` — no hardcodea ningún `calc(100vh-...)`. Si el panel se reutiliza fuera del dashboard (donde no haya un contenedor fixed de altura conocida), habrá que añadir una `max-h` explícita.

**Scrollbar styling** (embebido):
```tsx
[&::-webkit-scrollbar]:w-1.5
[&::-webkit-scrollbar-track]:bg-transparent
[&::-webkit-scrollbar-thumb]:rounded-full
[&::-webkit-scrollbar-thumb]:bg-border/60
[scrollbar-width:thin]
[scrollbar-color:hsl(var(--border)/0.6)_transparent]
```
Las dos últimas clases son para Firefox. El `overflow-hidden` del div exterior hace que el thumb quede recortado a las esquinas redondeadas de la card.

**Cabecera fija en modo embebido**: el panel tiene dos zonas independientes:
- **Header** (`shrink-0`, fuera del scroll): avatar + nombre + botón Regenerar + botón ✕. Siempre visible sin importar cuánto se haga scroll.
- **Cuerpo** (`flex-1 overflow-y-auto`, ref `scrollContainerRef`): controles de ocasión + tipo + grid de ideas. Scroll interno con scrollbar estilizado.

**Botón Regenerar en la cabecera**: siempre está en el DOM (para que la transición CSS funcione), pero con `opacity-0 pointer-events-none` cuando no debe verse. Cuando el usuario hace scroll y el panel de controles sale del área visible, pasa a `opacity-100` con `transition-opacity duration-200`. Al subir, desaparece con el mismo fade. Usa el botón `default` (verde) porque es una acción principal. **No usar `variant="outline"`** — el Regenerar de la cabecera es acción, no secundaria.

La visibilidad se detecta con un listener de `scroll` en `scrollContainerRef` que compara `controlsRef.current.getBoundingClientRect().bottom` con `scrollContainerRef.current.getBoundingClientRect().top`. Cuando el bottom del panel de controles queda por encima del top del contenedor scroll, el panel ha salido de vista. **No usar `IntersectionObserver` sin `root`**: observa respecto al viewport, no al scroll container interno, y no detecta correctamente el scroll.

**Remount limpio al cambiar de evento**: el dashboard pasa `key={personId + "-" + occasion}` al `GiftsPanel`. Esto fuerza un remount completo cuando cambia el evento seleccionado, reseteando todo el estado interno (ideas, loading, tipo de regalo). Sin el `key`, al cambiar de evento el panel reutiliza el estado del anterior.

### Inputs / Forms

- Siempre con `border` visible. Nada de inputs invisibles a la Material.
- Label arriba (`<Label>`), input debajo, error en rojo (`text-destructive`) inmediatamente después con `text-xs`.
- Espaciado entre campos: `space-y-1.5` dentro de un grupo (label + input + error), `space-y-5` entre grupos.
- **Selects**: usar siempre el componente shadcn `Select` (`SelectTrigger` + `SelectContent` + `SelectItem`). **Nunca `<select>` nativo** — el aspecto del navegador rompe la consistencia visual con el resto de la UI. En selects controlados con valor inicial, renderizar el label manualmente dentro del `SelectTrigger` con `<span>` (ver patrón en "Select con valor inicial controlado").

### Sección Eventos (detalle de persona)

La sección "Eventos" en `/people/[id]` gestiona fechas importantes de esa persona. Terminología: **evento** (no "fecha importante").

**Collapsed / expanded:**
- Por defecto solo se muestra el botón "Nuevo evento" (borde punteado, `border-dashed`).
- Al pulsarlo, el formulario se expande en la misma card sin navegación ni dialog.
- Al guardar o cancelar, el formulario vuelve a colapsar.

**Entrada de fecha — responsive:**
- **Desktop** (`md+`): tres inputs inline — `Día` (número), `Mes` (shadcn `Select`), `Año (opcional)` (número). Rápido de usar con teclado.
- **Móvil** (`< md`): un botón que abre el `DatePickerDialog` — tres columnas de scroll-snap (día | mes | año opcional) con drag en iOS/Android y mouse drag en Chrome móvil. Overlay de líneas horizontales marca el ítem activo. Implementado en `ImportantDateForm.tsx` como componente local `ScrollColumn` + `DatePickerDialog`.

**Presupuesto:**
- `BudgetRangeSlider`: slider dual de `@base-ui/react/slider` (0–500 €, paso 5) + dos inputs numéricos directos para valores exactos o >500.
- Los thumbs del slider usan `bg-primary` (no `bg-background`) para ser visibles en ambos modos.
- Los `<SliderThumb>` deben ser **hijos de `SliderControl`** (hermanos del `SliderTrack`), no anidados dentro del track. Si están dentro del track, `overflow-hidden` los recorta y no son clicables.

**Edición inline:**
- Cada evento tiene un botón `PencilLine` que expande `EditImportantDateInline` in situ (no dialog).
- El formulario de edición reutiliza `BudgetRangeSlider` y el mismo patrón de 3 columnas de fecha.
- Al guardar o cancelar, la fila vuelve al modo vista.

**Badges de recurrencia:**
- `Repeat2` + "Anual" — evento recurrente cada año.
- `CalendarX2` + "Única" — evento de una sola vez.
- Ambos con `variant="outline"` y `text-muted-foreground`. El verde primary está reservado para acciones.

### Sección Historial de regalos (detalle de persona)

La sección "Historial de regalos" en `/people/[id]` registra regalos pasados para que la IA pueda aprender qué funciona con esa persona.

**Añadir regalo:**
- Por defecto se muestra el botón "Añadir regalo" (borde punteado, `border-dashed`), igual que "Añadir evento".
- Al pulsarlo, el formulario se expande en la misma card sin dialog ni navegación.
- Al guardar o cancelar, el formulario vuelve a colapsar y los campos se resetean.

**Edición inline:**
- Cada entrada tiene un botón `PencilLine` (editar) + `X` (eliminar), igual que los eventos.
- Al pulsar `PencilLine`, la fila se reemplaza por `EditGiftHistoryInline` in situ.
- Al guardar o cancelar, la fila vuelve al modo vista.
- Implementado en `src/components/people/GiftHistoryForm.tsx` (`GiftHistoryForm` + `EditGiftHistoryInline`).
- Mutación Convex: `api.giftHistory.update` (valida ownership, longitudes y año).

**Campo Reacción — `REACTIONS`:**
- Definido en `src/lib/schemas.ts`. Tres valores: `loved / ok / bad`.
- Labels en español sin emojis: `Le encantó / Le dio igual / No gustó`.
- Sin valor por defecto en ninguna de las dos formas — el usuario debe elegir explícitamente.
- En la lista del historial, la reacción se muestra como texto inline: `Auriculares · Cumpleaños 2024 · Le encantó`.

**Select con valor inicial controlado — fix Radix portal:**
- El `SelectValue` de Radix UI no puede mostrar el label del item seleccionado hasta que `SelectContent` se ha abierto al menos una vez (los items viven en un portal que no se renderiza en cerrado).
- En formularios de edición (valor pre-rellenado), esto provoca que el trigger muestre el `value` raw ("loved") en vez del label.
- Solución: renderizar el label manualmente en el trigger usando `REACTIONS.find(r => r.value === field.value)?.label ?? "Reacción…"` dentro de un `<span>`, sin `SelectValue`. Los items siguen dentro de `SelectContent` para el dropdown.
- Aplicar este patrón en cualquier Select controlado con valor inicial en un formulario de edición.

### Enlace de retroceso (back link)

Patrón para "volver a la sección anterior", visible en la parte superior de páginas de detalle o subpáginas.

```tsx
<Link
  href="/people"
  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
>
  <ArrowLeft className="size-3.5" aria-hidden />
  Seres queridos
</Link>
```

**Reglas:**
- Icono `ArrowLeft` de lucide-react, `size-3.5`. Sin texto alternativo propio (`aria-hidden`) — el texto del link ya es descriptivo.
- Color `text-muted-foreground` en reposo, `hover:text-foreground`. No usar `text-primary`.
- `w-fit` para que el área de hover no se extienda a todo el ancho.
- El texto es el nombre de la sección destino, no "Volver" — aporta contexto de a dónde se va.

### Avatars

- Tamaño default `size-10`–`size-12` en cards, `size-20`–`size-24` en headers de detalle.
- En headers grandes, añadir `ring-1 ring-border` para definir el contorno sin que pese.
- Si no hay foto, fallback con iniciales (2 letras max, mayúsculas).
- **Avatar picker**: integrado en `PersonForm` y en el encabezado de perfil. Usa la API de [DiceBear](https://api.dicebear.com/9.x/) con el estilo `dylan`. Genera 12 opciones con seed fijo `"avatar"` (NO el nombre de la persona — si se usara el nombre, las opciones regenerarían en cada keystroke al escribir el nombre). "Regenerar" avanza el offset en +12. La URL seleccionada se guarda en `person.avatarUrl` (opcional). El componente vive en `src/components/people/AvatarPicker.tsx`. Validación server-side: solo se aceptan URLs que empiecen por `https://api.dicebear.com/`. Parámetros aplicados: `hairColor[]` restringido a negro, rojo/coral, rubio dorado (`e8c170`), castaño (`8b4513`), chocolate (`d2691e`), blanco y transparente (calvo); `mood[]` excluye `sad` (se usan `happy`, `angry`, `hopeful`, `confused`, `superHappy`, `neutral`). El grid del picker usa `justify-items-center` para que las celdas no estiren los botones horizontalmente (sin eso el anillo de selección queda ovalado).
- **Avatar en perfil**: el avatar del encabezado tiene un overlay de cámara (`Camera` icon) visible en hover. Al pulsarlo se abre un `Dialog` con `AvatarPicker`. Al seleccionar un avatar el dialog se cierra y el cambio se guarda automáticamente (autosave inmediato al elegir).

### Edición inline (perfil de persona)

`/people/[id]` no tiene página de edición separada. `/people/[id]/edit` redirige a `/people/[id]`. Toda la edición ocurre inline en el perfil, dividida en tres secciones independientes:

| Sección | Campos | Cuándo guarda |
|---|---|---|
| Header — nombre | name | `onBlur` del input (o Enter) |
| Header — relación | relationship | `onValueChange` del Select (inmediato) |
| Header — avatar | avatarUrl | Al elegir en el Dialog (inmediato) |
| Intereses | interests | `onChange` del tag input (cada add/remove) |
| Notas | notes | `onBlur` del textarea |
| Datos prácticos | shoeSize, clothingSize, allergies, dislikes | `onBlur` de cada campo |

**Autosave — principios:**
- No hay botones "Guardar" ni dirty flags. El usuario edita y el cambio se persiste en cuanto sale del campo.
- La función `save(fields)` llama a `api.people.update({ id, ...fields })` — como la mutación acepta campos opcionales y hace merge en servidor, cada campo puede guardarse de forma independiente sin sobrescribir los demás.
- Errores: solo se muestra toast de error (`toast.error`). No hay toast de éxito para no generar ruido en cada blur.

**Indicador visual "✓ Guardado":**
- Un pill fijo (`position: fixed; bottom: 1.5rem; right: 1.5rem`) con fondo `bg-primary` y `text-primary-foreground` aparece tras cada guardado exitoso.
- Desaparece automáticamente a los 2 segundos con fade + slide (`transition-all duration-300`).
- Si el usuario edita varios campos rápido, el timer se reinicia para que el pill no parpadee.
- `aria-live="polite"` para lectores de pantalla.
- Implementado con `useState(false)` + `setTimeout` + `clearTimeout` — sin librería externa.

**Guardar parcial:** `api.people.update` acepta todos los campos como opcionales y hace merge en el servidor. Cada `save(fields)` solo pasa los campos de su sección.

**Sin guard de navegación:** al ser autosave no hay "cambios sin guardar" — se puede navegar libremente. No usar `beforeunload` ni `pendingNav` en pantallas con autosave.

**Mismo patrón en `/settings`:** la página de Ajustes usa exactamente el mismo helper local `save(patch, revert)` con pill flotante "Guardado", `toast.error` solo en fallo, sin botón "Guardar" ni dirty flags. Switches y checkboxes guardan al `onChange`; el campo numérico de días guarda al `onBlur`. Diferencia respecto a la ficha de persona: las mutations Convex de Ajustes (`api.settings.setMine`) reciben patches por campo igual que `api.people.update`, así que el patrón se traslada 1:1.

**Tipografía en secciones inline:**
- Los labels de sección (eyebrows) usan `<p>` o `<h2>` según el contexto — en ambos casos añadir `font-sans` explícito para anular el base layer serif. Ver regla en Tipografía.

### Animaciones

`tw-animate-css` ya está disponible (instalado por shadcn). Reglas:

- **Aparición de listas grandes** (>3 elementos generados): stagger fade-in usando `animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both` + `style={{ animationDelay: '${i * 60}ms' }}`. 60ms entre cards, no más, para no demorar la lectura. Ejemplo: cards de `/people/[id]/gifts`.
- **Hover sobre cards**: ya cubierto en sus reglas. `transition-all` o `transition-shadow` solo, duración por defecto (~150ms).
- **No animar**: aparición de un único elemento (es ruido), elementos que reaparecen tras refresh, headers, navegación.
- **`fill-mode-both`** es importante en stagger: sin él, las cards parpadean al inicio porque la animación no tiene estado inicial.

### Iconografía

Set único: [`lucide-react`](https://lucide.dev). Stroke 2 (default), tamaño `size-4` (16px) en botones y nav, `size-3.5` en botones `icon-sm`, `size-5` para iconos decorativos en headers.

Iconos en uso:
- `CalendarDays` — sección Agenda (nav).
- `Bell` — campanita de notificaciones.
- `Menu` — hamburguesa, abre el `Sheet` de navegación en móvil.
- `Plus` — crear nueva entidad.
- `Sparkles` — reservado; el botón "Ideas de regalo" usa `Gift` (ver regla más abajo).
- `Pencil` — editar (botón de cabecera, navegación a página de edición).
- `PencilLine` — editar inline dentro de una lista (abre formulario en lugar, sin navegar).
- `Trash2` — eliminar (siempre con `text-destructive`).
- `X` — cerrar / quitar elemento de una lista.
- `RefreshCw` — regenerar (avatar picker).
- `Repeat2` — evento recurrente (anual).
- `CalendarX2` — evento de fecha única (no recurrente).
- `Check` — indicador de guardado exitoso (pill fijo en perfil de persona).
- `ArrowLeft` — enlace de retroceso ("← Seres queridos", "← [nombre]"). Siempre `size-3.5`.
- `Star` — eyebrow de sección "Intereses" (ficha y formulario).
- `NotebookPen` — eyebrow de sección "Notas" (ficha).
- `CalendarDays` — eyebrow de sección "Eventos" (ficha y formulario) y nav "Agenda".
- `Ruler` — eyebrow de sección "Datos prácticos" (ficha y formulario).
- `Gift` — eyebrow de sección "Historial de regalos" (ficha), botón "Ideas de regalo" y empty state de la campana.
- `ShoppingBag` — tipo de regalo "Producto físico".
- `Ticket` — tipo de regalo "Experiencia".
- `Heart` — tipo de regalo "Tiempo juntos".
- `Shuffle` — tipo de regalo "Sorpréndeme".
- `ExternalLink` — chips de tienda en `GiftRecommendationCard` (size-3, detrás del texto).
- `Gift` — icono del botón "Ideas de regalo" (agenda y ficha de persona) y empty state de la campana de notificaciones.
- **Nota tiendas**: los chips de tienda ya NO usan iconos Lucide. Usan logos PNG/SVG oficiales en `public/stores/`. Ver sección Chips de tienda.

**Reglas:**
- **Botones icon-only** necesitan `aria-label` y `title`. Usar variant `ghost` y size `icon` o `icon-sm`.
- **Botones con icono + texto**: el icono va antes del texto, separado por el gap nativo del botón. No añadir `mr-2`.
- **No mezclar sets**: no usar Heroicons / Phosphor / SVG inline. Si lucide no tiene un icono concreto, abrir issue en pendientes antes de meter algo ad-hoc.
- **No usar emojis en botones, chips ni tarjetas de acción**: los emojis son solo para empty states. En su lugar usar el icono de lucide más cercano.
- **Iconos decorativos**: `aria-hidden`. Solo los que aportan información llevan label.

---

## Empty states

Patrón consolidado. Vivo en [`src/app/(app)/people/page.tsx`](../src/app/(app)/people/page.tsx) y [`src/app/(app)/dashboard/page.tsx`](../src/app/(app)/dashboard/page.tsx).

```tsx
<div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-14 text-center">
  <div className="text-4xl mb-3" aria-hidden>📓</div>
  <h2 className="text-2xl font-medium mb-2">Una libreta en blanco</h2>
  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
    Texto invitador, 1-2 frases, voz humana, sugiere acción concreta.
  </p>
  <Link href="/..." className={buttonVariants({ size: "lg" })}>
    Verbo concreto + objeto
  </Link>
</div>
```

**Reglas:**
- Emoji decorativo (📓 ☕ ✨) **solo aquí**. Nunca en navegación, headers, badges ni step cards.
- Título h2 en serif (heredado del base layer), **frase con voz**, no etiqueta funcional. "Una libreta en blanco" sí; "Sin datos" no.
- Container: `rounded-2xl border-dashed`. Punteado refuerza "este sitio está esperando algo".
- **El CTA debe ir al destino más directo**: el empty state del dashboard lleva a `/people/new` ("Añadir ser querido"), no a `/people`. El usuario ya sabe que necesita crear una persona — no hay que darle un paso intermedio.
- **Empty states contextuales**: cuando hay más de una razón posible para que algo esté vacío, distinguir cuál aplica y adaptar mensaje + CTA. No mostrar siempre el mismo empty state genérico.

**Agenda — dos empty states** (`src/app/(app)/agenda/page.tsx`):

| Situación | Emoji | Título | CTA |
|---|---|---|---|
| Sin personas (`people.length === 0`) | ☕ | "Empieza aquí" | "Añadir ser querido" → `/seres-queridos/new` |
| Hay personas pero sin eventos próximos | ☕ | "Todo tranquilo" | "Ver seres queridos" → `/seres-queridos` |

La página hace dos queries en paralelo: `api.importantDates.getUpcoming` y `api.people.getAll`. Si `filtered.length === 0`, se comprueba `people.length` para decidir qué empty state mostrar. Si `people` todavía carga, se muestra el skeleton (no el empty state) para evitar un flash.

**GiftsPanel sin eventos** (`src/components/gifts/GiftsPanel.tsx`):

Cuando `events.length === 0` (la persona existe pero no tiene ningún evento guardado), el placeholder central muestra:
- Título: "Sin eventos todavía"
- Mensaje: "Para generar ideas necesitas al menos un evento."
- CTA botón `outline`: "Añadir evento a [nombre]" → `/seres-queridos/[personId]`

Cuando hay eventos pero no se ha generado aún, muestra el placeholder informativo habitual ("A medida para [nombre]") sin CTA.

---

## Voz y copy

El producto va de relaciones, no de productividad. El copy debería sonar como una persona que te conoce, no como un onboarding de growth hacking.

**Sí**:
- "Las personas que te importan"
- "Los tuyos"
- "Tener un detalle con alguien"
- "No olvides el cumpleaños de…"
- "Calma por delante"
- "Ideas hechas a medida"

**No**:
- "¡Vamos a empezar! 🎉"
- "Boost your gift game"
- "Tu lista de contactos" (frío, suena a CRM)
- "Notificaciones inteligentes con IA" (jerga)
- Exclamaciones gratuitas, emojis 🚀 ⚡, mayúsculas para enfatizar.

Persona gramatical: **tú** (singular, cercano). Nunca "nosotros" corporativo.

---

## Email transaccional

El email de recordatorio de eventos traduce los tokens del design system a hex para compatibilidad con clientes de correo. La paleta, la estructura y las reglas del botón CTA están documentadas en [`docs/email-notifications.md`](email-notifications.md#plantilla-de-email). Si los tokens de color cambian, actualizar también las constantes hex de `convex/emails.ts`.

---

## Anti-patrones

Cosas que se han probado o considerado y NO funcionan. Si vuelven a tentar, leer aquí primero.

- **Gradients en superficies grandes**: rompen la sensación de papel del fondo crema. Los CTAs y headers son planos.
- **Emojis en navegación, botones o tarjetas**: rompen el registro adulto. Los emojis son solo para empty states. Sustituir siempre por el icono de lucide más cercano.
- **Sombras fuertes** (`shadow-lg`+): material design vibe, choque inmediato con la calidez. Máximo `shadow-md` y solo en hover si se justifica.
- **Borde de color en cards** (ej. `border-primary` decorativo): se sentía corporativo. Mantener bordes en `border-border` o variantes con alpha.
- **`font-bold` en headings de serif sin razón**: peso 700 en Fraunces a tamaños medianos parece "newspaper" anticuado. Preferir 500–600 salvo en hero gigante.
- **Dirty tracking + botón "Guardar" en edición inline de perfil**: introduce fricción innecesaria (el usuario tiene que recordar guardar) y complejidad de estado (dirty flags, beforeunload, nav guard). Si la mutation es barata y los campos no son críticos, usar autosave en blur/change. El "✓ Guardado" fijo da el feedback suficiente.
- **`<select>` nativo en formularios**: aspecto inconsistente entre navegadores, no respeta los tokens de color/radio del sistema de diseño. Siempre usar el componente shadcn `Select`.

---

## Pendientes

Lista de cosas que sé que faltan o que no han recibido pasada todavía. Se irán tachando o convirtiéndose en reglas a medida que se resuelvan.

- [x] ~~Hover de cards interactivas~~ → resuelto, ver Componentes · Cards.
- [x] ~~Iconografía~~ → resuelto: lucide-react adoptado, ver Componentes · Iconografía.
- [x] ~~Página `/people/[id]` (detalle)~~ → edición inline por secciones (header / intereses+notas / datos prácticos). Sin página `/people/[id]/edit` (redirige al perfil). Guard de cambios sin guardar con `beforeunload` + dialog. Ver "Edición inline (perfil de persona)".
- [x] ~~Página `/people/[id]/gifts`~~ → resuelto: panel de configuración con Select de evento (solo eventos del perfil, presupuesto automático), tarjetas de tipo con iconos lucide y descripción, botón "Generar" top-right del panel, skeletons visibles (`bg-muted/40 animate-pulse`), tarjetas con stagger animation, botón X con toast permanente + deshacer, back link con `ArrowLeft`.
- [ ] **Footer global**: minimal por ahora. Decidir si crece o se queda así.
- [ ] **Skeletons consistentes**: todos en `rounded-2xl` y `border-dashed`, pero verificar dimensiones uniformes.
- [ ] **Mobile < 380px**: sin probar. Hero de landing podría descuadrar.
- [x] ~~Tono de los toasts de error~~ → fallbacks genéricos actualizados: "No se pudo guardar / añadir / eliminar…" en lugar de "Error". Los mensajes del servidor se siguen mostrando cuando están disponibles.
- [ ] **Estado de loading global / transiciones de página**: actualmente cada página gestiona el suyo. ¿Vale la pena una skeleton global o no?
- [x] ~~ThemeToggle en sidebar~~ → retirado. El toggle vive solo en `/settings`. Tema fijo: `dark` por defecto.
- [x] ~~Navegación móvil~~ → hamburguesa + Sheet lateral (`MobileNav`).
- [x] ~~Grids fijos en desktop~~ → todos los grids son ahora responsive con columnas dinámicas.
- [x] ~~Panel lateral de regalos en Agenda~~ → layout master-detail en desktop con CSS Grid `[480px_1fr]`. Ver "Dashboard" y "GiftsPanel".
- [x] ~~Footer global~~ → decisión tomada: la landing tiene un footer mínimo de una línea. Las páginas de la app (autenticadas) no tienen footer — no es un sitio web, es una herramienta.
- [x] ~~Estado de loading global~~ → decisión tomada: cada página gestiona su propio estado. Las páginas de lista usan skeletons inline con `animate-pulse rounded-2xl border-dashed`. Las páginas de detalle/edición usan `LoadingFallback` (tres puntos con stagger de 150ms). No se introduce un skeleton global porque no hay estructura de página compartida que lo justifique.
- [x] ~~Mobile < 380px (landing)~~ → h1 reducido a `text-4xl` base con escalado `sm:text-5xl md:text-6xl lg:text-7xl`. Feature cards con `grid-cols-1` base. `ThemeToggle` eliminado de la landing (tema dark fijo).
- [x] ~~MobileNav sin user info~~ → `SidebarUserInfo` añadido al pie del Sheet (mismo patrón que sidebar desktop).

---

## Cómo mantener este documento

- Cualquier cambio visual no obvio se anota aquí en el commit donde se introduce.
- Cuando un "Pendiente" se resuelve: pasa a Componentes / Tokens / etc. con su regla, o desaparece si fue descartado.
- Cuando un anti-pattern se descubre: se añade con una frase del por qué, no como dogma.
- Si el documento crece más allá de 250 líneas: hay que partirlo o podar — está rotando.
