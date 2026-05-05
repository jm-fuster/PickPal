# Sistema de diseño · PickPal

Documento vivo. Captura las decisiones visuales del producto y el porqué de cada una. Cuando una decisión cambie, se actualiza este archivo en el mismo commit que toca el código.

---

## Intención

PickPal es una app sobre **personas queridas y ocasiones que importan**. El registro visual es el de una libreta de papel cálido, no el de un dashboard SaaS.

- **Sí somos**: Things 3 con calor, Notion personal, papelería de calidad, una agenda de regalos hecha con mimo.
- **No somos**: Linear, Material, Stripe Dashboard, Vercel admin. Nada de gris frío ni gradientes corporativos.

La calidez es diferenciación: casi todo el SaaS B2C parece enterprise. Si el usuario se siente como abriendo una libreta de notas, ya hemos ganado.

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
- **Header del sidebar**: `PickPal` (link) a la izquierda + `SafeNotificationBell` a la derecha. `flex items-center justify-between`.
- **Pie del sidebar**: `SidebarUserInfo` — `UserButton` de Clerk + email del usuario truncado (`text-xs text-muted-foreground`).
- **Tema**: `defaultTheme="dark"` sin `enableSystem`. El toggle está en `/settings`. No hay ThemeToggle en sidebar ni en el header.
- En móvil (`< lg`): header compacto con hamburguesa (`MobileNav`) + logo a la izquierda, campana + UserButton a la derecha. La navegación se abre en un `Sheet` lateral (shadcn `sheet.tsx`) desde la izquierda. `MobileNav` es un componente cliente en `src/components/layout/MobileNav.tsx`.

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
- **Cards estáticas** (sin acción): solo `shadow-sm`, sin hover. Ejemplo: feature cards de la landing.
- **Card de urgencia** (UpcomingDateCard cuando `daysUntil <= 7`): `border-primary/60 shadow-sm bg-primary/5`. El tinte rosado del primary llama la atención sin chillar.
- **Cards generadas por IA** (GiftRecommendationCard): un `<Sparkles>` discreto en `text-primary/80 size-4` antes del título marca la procedencia. Footer separado por `border-t border-border/50` con badge de categoría + precio prominente (`text-lg font-medium`) a la izquierda y CTA a la derecha. Stagger animation `animate-in fade-in slide-in-from-bottom-2 duration-500` con `animationDelay: index * 60ms` para que aparezcan en cascada.

### Buttons

- Variantes shadcn: `default` (terracota), `outline`, `ghost`, `destructive`.
- Tamaños: `sm` para acciones secundarias inline, `default` por defecto, `lg` para CTAs principales.
- **Links que parecen botón**: usar `<Link className={buttonVariants({ ... })}>`. El componente Button de esta app **no soporta `asChild`** porque usa `@base-ui/react` en vez de Radix Slot.

### Badges

- `default` (verde): solo para acciones y CTAs. No usar en badges informativos.
- `secondary` (terracota): badges informativos de identidad/relación ("Amigo/a", "Pareja") y énfasis o urgencia (NotificationBell).
- `outline`: tags de atributos (intereses, etiquetas de fecha) y "+N más".

### Páginas — padding y layout

Padding de página responsive en todos los `<main>`: `p-4 sm:p-6 lg:p-8`. No usar `p-8` fijo.

**Dashboard** (`/dashboard`): los grupos de fechas usan `DateGroupedList`. Las cards dentro de cada grupo se disponen en grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3`.

**Detalle de persona** (`/people/[id]`): `max-w-6xl w-full`. Suficiente para no desbordar en monitores muy anchos, pero sin el desperdicio de `max-w-4xl`.

**Formularios** (`PersonForm`): `max-w-xl`. Los formularios sí tienen techo para no estirar los inputs hasta el infinito.

### Inputs / Forms

- Siempre con `border` visible. Nada de inputs invisibles a la Material.
- Label arriba (`<Label>`), input debajo, error en rojo (`text-destructive`) inmediatamente después con `text-xs`.
- Espaciado entre campos: `space-y-1.5` dentro de un grupo (label + input + error), `space-y-5` entre grupos.
- **Selects nativos** (`<select>`): usar `pl-3 pr-7` (no `px-2`). El `pr-7` da espacio suficiente entre el texto y la flecha del navegador, que de otro modo queda pegada al borde.

### Sección Eventos (detalle de persona)

La sección "Eventos" en `/people/[id]` gestiona fechas importantes de esa persona. Terminología: **evento** (no "fecha importante").

**Collapsed / expanded:**
- Por defecto solo se muestra el botón "Nuevo evento" (borde punteado, `border-dashed`).
- Al pulsarlo, el formulario se expande en la misma card sin navegación ni dialog.
- Al guardar o cancelar, el formulario vuelve a colapsar.

**Entrada de fecha — responsive:**
- **Desktop** (`md+`): tres inputs inline — `Día` (número), `Mes` (select nativo), `Año (opcional)` (número). Rápido de usar con teclado.
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

### Avatars

- Tamaño default `size-10`–`size-12` en cards, `size-20`–`size-24` en headers de detalle.
- En headers grandes, añadir `ring-1 ring-border` para definir el contorno sin que pese.
- Si no hay foto, fallback con iniciales (2 letras max, mayúsculas).
- **Avatar picker**: integrado en `PersonForm`. Usa la API de [DiceBear](https://api.dicebear.com/9.x/) con el estilo `big-ears-neutral`. Genera 12 opciones a partir del nombre de la persona como seed. "Regenerar" avanza el offset en +12. La URL seleccionada se guarda en `person.avatarUrl` (opcional). El componente vive en `src/components/people/AvatarPicker.tsx`. Validación server-side: solo se aceptan URLs que empiecen por `https://api.dicebear.com/`.

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
- `Sparkles` — acciones que invocan IA ("Ideas de regalo").
- `Pencil` — editar (botón de cabecera, navegación a página de edición).
- `PencilLine` — editar inline dentro de una lista (abre formulario en lugar, sin navegar).
- `Trash2` — eliminar (siempre con `text-destructive`).
- `X` — cerrar / quitar elemento de una lista.
- `RefreshCw` — regenerar (avatar picker).
- `Repeat2` — evento recurrente (anual).
- `CalendarX2` — evento de fecha única (no recurrente).

**Reglas:**
- **Botones icon-only** necesitan `aria-label` y `title`. Usar variant `ghost` y size `icon` o `icon-sm`.
- **Botones con icono + texto**: el icono va antes del texto, separado por el gap nativo del botón. No añadir `mr-2`.
- **No mezclar sets**: no usar Heroicons / Phosphor / SVG inline. Si lucide no tiene un icono concreto, abrir issue en pendientes antes de meter algo ad-hoc.
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
- Emoji decorativo (📓 ☕ ✨) **solo aquí y en cards de feature de la landing**. Nunca en navegación, headers, badges.
- Título h2 en serif (heredado del base layer), **frase con voz**, no etiqueta funcional. "Una libreta en blanco" sí; "Sin datos" no.
- Container: `rounded-2xl border-dashed`. Punteado refuerza "este sitio está esperando algo".

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

## Anti-patrones

Cosas que se han probado o considerado y NO funcionan. Si vuelven a tentar, leer aquí primero.

- **Gradients en superficies grandes**: rompen la sensación de papel del fondo crema. Los CTAs y headers son planos.
- **Emojis decorativos en navegación o botones de acción**: rompen el registro adulto. Los emojis son solo para empty states y feature cards de marketing.
- **Sombras fuertes** (`shadow-lg`+): material design vibe, choque inmediato con la calidez. Máximo `shadow-md` y solo en hover si se justifica.
- **Borde de color en cards** (ej. `border-primary` decorativo): se sentía corporativo. Mantener bordes en `border-border` o variantes con alpha.
- **`font-bold` en headings de serif sin razón**: peso 700 en Fraunces a tamaños medianos parece "newspaper" anticuado. Preferir 500–600 salvo en hero gigante.

---

## Pendientes

Lista de cosas que sé que faltan o que no han recibido pasada todavía. Se irán tachando o convirtiéndose en reglas a medida que se resuelvan.

- [x] ~~Hover de cards interactivas~~ → resuelto, ver Componentes · Cards.
- [x] ~~Iconografía~~ → resuelto: lucide-react adoptado, ver Componentes · Iconografía.
- [x] ~~Página `/people/[id]` (detalle)~~ → primera pasada de jerarquía: header limpio con back-link, acciones secundarias como icon-only, info y fechas en dos cards a dos columnas en desktop.
- [x] ~~Página `/people/[id]/gifts`~~ → resuelto: `<Sparkles>` en titulo de card, footer separado con border-t y precio prominente, stagger animation, empty state con copy "A medida para X", input de ocasión en card border-dashed.
- [ ] **Footer global**: minimal por ahora. Decidir si crece o se queda así.
- [ ] **Skeletons consistentes**: todos en `rounded-2xl` y `border-dashed`, pero verificar dimensiones uniformes.
- [ ] **Mobile < 380px**: sin probar. Hero de landing podría descuadrar.
- [x] ~~Tono de los toasts de error~~ → fallbacks genéricos actualizados: "No se pudo guardar / añadir / eliminar…" en lugar de "Error". Los mensajes del servidor se siguen mostrando cuando están disponibles.
- [ ] **Estado de loading global / transiciones de página**: actualmente cada página gestiona el suyo. ¿Vale la pena una skeleton global o no?
- [x] ~~ThemeToggle en sidebar~~ → retirado. El toggle vive solo en `/settings`. Tema fijo: `dark` por defecto.
- [x] ~~Navegación móvil~~ → hamburguesa + Sheet lateral (`MobileNav`).
- [x] ~~Grids fijos en desktop~~ → todos los grids son ahora responsive con columnas dinámicas.
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
