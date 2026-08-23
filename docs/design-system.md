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

### Figma — arquitectura de variables

El archivo [PickPal — Design System](https://www.figma.com/design/4hQt4BnsEluKsYk5qbKkCz/PickPal---Design-System) espeja este documento y `globals.css`, no al revés: **si Figma contradice el código, gana el código**. Sus 289 variables están organizadas en las cuatro capas del patrón de design tokens, y cada una aliasa a la de abajo sin saltarse eslabones.

| Capa | Nº | Colección | Ejemplos | Aliasa a |
|---|---|---|---|---|
| Primitivo | 159 | `Primitives` (133) · `Typography (primitivos)` (26) | `color/green/850`, `spacing/4`, `radius/md` | valor directo |
| Semántico | 95 | `Color` · `Medidas` | `color/bg/brand`, `color/icon/secondary`, `spacing/stack/lg` | primitivo |
| Marca | 5 | `Color` | `color/brand/primary`, `color/brand/logo` | primitivo |
| Componente | 30 | `Color` · `Medidas` | `size/switch/thumb-default`, `color/switch/thumb-bg`, `size/checkbox` | **semántico**, nunca primitivo |

**Los primitivos tienen scope vacío y están ocultos al publicar** (`hiddenFromPublishing`): no aparecen en ningún picker ni viajan a los archivos que consumen la librería, para que nadie aplique `spacing/4` donde toca `spacing/container/padding`. Única excepción, las 26 de `Typography`, que siguen scopeadas y publicadas porque todavía no hay text styles por encima — sin ellas los pickers de tamaño de fuente e interlineado quedarían vacíos y empujarían a valores crudos. Crear los text styles es el prerrequisito para cerrarlas.

**Los primitivos viven en su propia colección, `Primitives`, con un solo modo.** Los 75 (35 de color y 40 numéricos) son *mode-invariant* —el mismo valor en claro y en oscuro— porque el cambio de modo ocurre en la capa semántica, igual que en `globals.css`. Tener un único modo lo hace explícito y evita el espejismo de dos columnas idénticas.

**Lo que sigue agrupado por tipo de dato es todo lo que está por encima del primitivo**: `Color` (45) y `Medidas` (85) contienen semántico, marca y componente mezclados. Separar esas dos capas en `Semantic` y `Component` **no se ha hecho y no compensa**: Figma no permite mover una variable de colección, así que hay que recrearla y repuntar cada referencia, y ahí es donde están los bindings caros —solo `radius/interactive` tiene 620 y `radius/pill` 424, y en total hay más de 4.000 fuera de instancias. Sacar los primitivos, en cambio, costó **32 bindings de nodo** (los swatches de `Foundations - Color`; los 40 numéricos tenían 0) y **117 referencias de alias**. Regla general para este archivo: antes de dar por caro un movimiento de colección, **contar los bindings de las variables implicadas**, no del archivo entero.

`Typography (primitivos)` se queda fuera de `Primitives` por la misma razón por la que conserva scope y publicación: sus 26 variables tienen **1.036 bindings de nodo** y no hay capa semántica ni text styles por encima que los absorba. El nombre de la colección lleva la palabra «primitivos» justamente para que la excepción se lea sin abrir la documentación.

**La capa de marca es el único punto de contacto con la paleta de identidad.** Cambiar el verde o la terracota son 4 ediciones en `color/brand/*`; ningún semántico ni ningún nodo referencia `green/*` o `terracotta/*` directamente, salvo los swatches de documentación.

#### Rampas de color: escala 50–950 (23-ago-2026)

Las 8 familias de color de `Primitives` (`cream`, `neutral`, `green`, `terracotta`, `umber`, `red`, `amber`, `bronze`) siguen ahora la escala estándar de 11 pasos — `50·100·200·300·400·500·600·700·800·900·950` —, dentro del límite de 12 tonos por rampa. Antes, cada familia cubría solo el tramo que algún componente había necesitado (`terracotta` tenía 2 pasos, `bronze` 1); ahora las 8 cubren el rango completo de claro a oscuro, generando los pasos que no existían.

**Cómo se generó lo que faltaba.** Cada hex real se convirtió a OKLCH (conversión exacta sRGB↔OKLab de Björn Ottosson, no una aproximación). Para cada familia, los pasos ya existentes se mantuvieron como anclas; donde no había ningún dato por debajo del paso más claro conocido, se añadió un ancla sintética en el paso 50 (`L≈0.985`, croma ≈10 % del pico de esa familia) para que la rampa tuviera un punto de partida razonable. Sobre esas anclas se ajustó un **spline cúbico monótono (Fritsch-Carlson)** —L y C por separado, H constante por familia— y se evaluó en los 11 pasos objetivo. Monótono es la palabra clave: a diferencia de una interpolación ingenua, no puede generar oscilaciones ni un paso más claro que su vecino más oscuro.

**Ningún valor referenciado cambió.** Los pasos que ya caían en la escala nueva (por ejemplo `cream/500`, `neutral/900`) se dejaron con su hex exacto — cero deriva. Los que no encajaban en la escala (`cream/550·650·750·850`, `neutral/650·750·850`) se consolidaron en el paso canónico más próximo, con una deriva de pocas unidades de RGB, imperceptible; las variables sobrantes se borraron tras repuntar sus alias. Verificado con captura antes/después de la sección `Vista en contexto` y de los 26 swatches semánticos: 0 cambios visibles, 0 alias roto, 0 binding huérfano.

**Dos casos donde consolidar habría sido un error, no solo un desvío cosmético**: `color/brand/primary` usaba `green/850` en Light y `green/750` en Dark — dos verdes *deliberadamente distintos* para el mismo rol según el tema. Consolidar ambos al mismo paso los habría igualado. En vez de eso, `green/750` se convirtió literalmente en el nuevo `green/700` (mismo hex, nuevo nombre) y `green/850` se dejó como un **12.º paso propio** de esa familia — la única que supera los 11 estándar, justificado porque aquí sí hace falta y 12 sigue sin pasarse del límite. Mismo problema con `color/chart/5` (`neutral/650` Light / `neutral/700` Dark): en vez de fusionar 650 en 700, se mapeó al nuevo `neutral/600` generado, manteniendo Light y Dark distintos. **Regla al consolidar un paso no estándar: comprobar primero si su mismo token usa OTRO paso no estándar en el modo contrario — si sí, no fusionar, darle un paso propio.**

**`amber` rediseñada a mano (23-ago-2026).** `amber/900` (tono apagado) y `amber/950` (dorado vivo, sin tocar ninguno de los dos — siguen siendo los mismos hex que usan `color/chart/4` y `color/chart/3`) son dos acentos de carácter distinto, no dos pasos de una misma rampa: casi la misma claridad (`L≈0.78` los dos) pero el croma se duplica de uno a otro. Un spline monótono sobre solo esas dos anclas no puede meter saturación a mitad de camino sin dejar de ser monótono, así que el primer intento (spline) daba una rampa plana del 50 al 800 que solo "aparecía" dorada en el último tramo.

Los 9 pasos intermedios (`50`–`800`) se sustituyeron por valores elegidos a mano en OKLCH, con un pico de croma deliberado en `400`–`600` (`C≈0.12–0.135`, a la altura del pico real de `950`) que decae suavemente hacia el tono apagado de `900`. El resultado: una progresión crema → dorado vivo → ámbar apagado, coherente en todo el rango, en vez de la meseta gris-beige anterior. No es una fórmula reutilizable para otras rampas de 2 anclas —es una decisión de diseño hecha a mano para esta familia en concreto—, así que si aparece el mismo problema en otra rampa (`umber` sigue con el spline mecánico y una progresión discreta pero sin este defecto tan marcado), evaluar caso por caso antes de repetir el patrón.

#### Dónde Figma tiene más estructura que el código

Las familias `spacing/stack/*`, `spacing/inline/*`, `spacing/inset/*` y `size/interactive-*` (28 variables), más los primitivos `spacing/60` y `spacing/120` (240 y 480 px, existen solo para que el ancho del sidebar y el de la columna de eventos tengan a qué aliasar), **no existen en `globals.css`**: en el código esos valores son clases utilitarias (`gap-2`, `p-4`), no custom properties. Viven solo en Figma para que la cadena de alias llegue completa hasta el componente. Lo que implica en la práctica:

- Nacen **sin `codeSyntax`**, así que Dev Mode muestra el valor crudo (`12px`) en vez de un `var()` que no compilaría.
- **No añadirlas a `globals.css`** para "cuadrar" los dos lados: ningún componente las consumiría.
- Al implementar desde Figma, traducir a la utilidad de Tailwind equivalente, no a una variable CSS.

Los `codeSyntax` que **sí** apuntan a código real son los 28 semánticos de color (`--primary`, `--muted-foreground`, `--sidebar*`…) y los 7 radios (`--radius-sm` … `--radius-4xl`). Ahí Figma y código están 1:1, y conviene no romperlo.

#### Cómo se nombran las variables

El primer segmento del nombre dice **qué propiedad controla** el token, y no se omite nunca. En concreto `spacing/*` es separación (padding, gap) y `size/*` es dimensión (ancho, alto). Al crear una variable numérica, mirar su scope: `GAP` → `spacing/`, `WIDTH_HEIGHT` → `size/`. Había 16 que mentían (los seis del switch, los seis del avatar, los tres iconos de control y el mínimo del textarea, todas `spacing/*` con scope `WIDTH_HEIGHT`) y se renombraron a `size/*` el 23-ago-2026. La familia `layout/*`, que no tenía segmento de tipo, desapareció en el mismo pase: `size/sidebar/width`, `size/event-column/width`, `spacing/panel/gap` y `spacing/page/padding-lg`.

El `role` sigue el mismo criterio: nombrar por el uso documentado en la tabla 2.7 del patrón canónico, no por el componente donde se usó primero. `radius/control` → `radius/interactive` y `radius/card` → `radius/surface` (23-ago-2026, renombrados puros, `codeSyntax` y los 620 + 138 bindings intactos). `size/icon-display` → `size/icon/xl`, porque el documento nombra los tamaños de icono por escala (`sm`/`md`/`lg`/`xl`), no por uso.

Los 29 semánticos de color siguen la fórmula `type-element-role-emphasis-state`, con los segmentos `emphasis` y `state` omitidos cuando valen *default*. El `element` es `bg`, `text` o `border`; **el nombre de la variable en Figma ya no coincide con el de la variable CSS**, y el puente entre los dos es el `codeSyntax`, que sigue apuntando a la custom property real. Dev Mode muestra `var(--primary)` aunque el token se llame `color/bg/brand`.

| Figma | CSS | Qué es |
|---|---|---|
| `color/bg` | `--background` | Canvas de página |
| `color/bg/surface` · `color/bg/surface-raised` | `--card` · `--popover` | Card · popover y dropdown |
| `color/bg/sunken` | `--input` | Track del Switch apagado. **No es «el fondo del input»**: el campo de `Input` va `bg-transparent` y solo tiene borde. Nace sin `codeSyntax` porque `bg-input` se usa en un único sitio |
| `color/bg/component` | `--muted` | **Superficie interactiva neutra**: hover de Button outline y ghost, hover de Badge, link del sidebar, footer de Card, track del Slider |
| `color/bg/component-focus` | `--accent` | **Solo el item de menú resaltado**: `focus:bg-accent` en `SelectItem` y la opción activa del combobox de intereses |
| `color/bg/brand` · `color/bg/brand-secondary` | `--primary` · `--secondary` | Verde de CTA · terracota |
| `color/bg/danger-solid` | `--destructive` | Rojo sólido |
| `color/text` · `color/text/secondary` | `--foreground` · `--muted-foreground` | Texto principal · de apoyo |
| `color/text/brand` | — | Links y texto de marca (aliasa a marca solo en Light) |
| `color/text/on-*` | `--*-foreground` | El prefijo `on-` significa siempre «encima de esta superficie» |
| `color/border` · `color/border/component` | `--border` · `--input` | Borde estándar · borde de `Input` y `Textarea` |
| `color/icon` · `/secondary` · `/danger` · `/brand` · `/on-brand` · `/on-brand-secondary` | — | Fill y stroke de icono. Nacieron el 23-ago-2026 copiando el mismo primitivo que su equivalente de `color/text/*` — no un alias al semántico de texto — porque los iconos ya llevaban 369 bindings a esos tokens y **`color/text/*` solo tiene scope `TEXT_FILL`**, invisible en el picker de Fill de un vector. Son los 6 roles que el uso real demostró necesarios, no los 7 que sugiere el documento (no hay uso de `success` en iconos propios) |

**Dos palabras que hay que vigilar al cruzar de un lado al otro:**

- **`accent`.** El patrón canónico llama `accent` al color secundario de identidad; shadcn llama `--accent` al beige del item de menú enfocado. Son cosas opuestas, así que la palabra **no se usa como rol en Figma**: la terracota es `brand-secondary` y el beige es `component-focus`.
- **`secondary`.** En la familia de texto, `color/text/secondary` es el texto de apoyo (el sentido del patrón canónico), mientras `color/text/on-brand-secondary` es el texto que va encima de la terracota. El prefijo `on-` es lo que los distingue.

Al mapear un token de color nuevo, **decidir el rol por cómo lo usa el código, no por cómo se llama la variable CSS**: `--muted` parece "zona secundaria" por el nombre y resultó ser la superficie interactiva de medio sistema, y `--accent` parece un color de identidad y resultó ser un solo estado de foco.

Las desviaciones deliberadas están todas en la página **`Foundations - Excepciones`** del archivo: 10 entradas, cada una con su motivo y su "no hacer". Si algo en Figma parece un error, mirar ahí antes de tocarlo.

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

- Fondo: `bg-background text-foreground border-r border-border`. **Es un panel claro, no el verde oscuro**: comparte fondo con el contenido y se separa solo por el borde derecho.
- Links activos: `bg-muted text-foreground font-medium` (en `SidebarLink`).
- Links inactivos: `text-muted-foreground hover:bg-muted hover:text-foreground`.
- **Las 13 variables `--sidebar-*` de `globals.css` no se usan en ninguna parte de la app.** Son el set que arrastra shadcn y quedaron huérfanas al pasar el sidebar a panel claro. Verificado el 23-ago-2026 sobre `layout.tsx` y `SidebarLink.tsx`; este documento describía hasta entonces el sidebar verde que ya no existe. Los 7 tokens equivalentes en Figma (`color/bg/sidebar*`, `color/text/on-sidebar*`, `color/border/*-sidebar`) siguen ahí porque espejan `globals.css`, pero tienen 2–4 bindings cada uno y todos son swatches de documentación. Antes de darles uso, decidir si el sidebar oscuro vuelve o si toca borrar la familia de los dos lados.
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
- **Filtro de relación en `/seres-queridos`**: encima del grid, fila con `<Label>` eyebrow ("Filtrar") + `<Select>` shadcn. Opciones: "Todas las relaciones" (valor sentinel `"all"`) + las de `RELATIONSHIPS`. El `Select` controlado normaliza `null → "all"` en `onValueChange`. Filtrado client-side en memoria (lista pequeña, no merece pasar por Convex). Cuando el filtro vacía la lista, mostrar empty state propio con el mismo estilo dashed que el original (no reutilizar el de "una libreta en blanco" — distinto motivo).
- **Hover · cards con acción interna** (la card no es link, pero contiene botón): `transition-shadow hover:shadow-md`. Sin translate ni cambio de fondo. Ejemplo: `GiftRecommendationCard`.
- **Cards estáticas** (sin acción): solo `shadow-sm`, sin hover. Ejemplo: step cards de la landing.
- **Card de urgencia** (UpcomingDateCard cuando `daysUntil <= 7`): `border-primary/60 shadow-sm bg-primary/5`. El tinte rosado del primary llama la atención sin chillar.
- **UpcomingDateCard — layout responsive**: avatar `size-12` envuelto en `<Link>` a la ficha del ser querido (`hover:opacity-80` + focus-ring) — entrada redundante con el nombre, pero los usuarios pulsan la foto por instinto. El bloque central apila tres líneas (nombre `font-medium truncate`, etiqueta·relación `text-xs muted truncate`, presupuesto `text-xs muted truncate` si existe) — apilar en lugar de poner nombre y meta en la misma baseline evita que el nombre se trunque a nada cuando el botón come ancho. El botón "Ideas de regalo" muestra solo "Regalar" en mobile (`<span className="sm:hidden">`) y el texto completo a partir de `sm`; siempre lleva `aria-label="Ideas de regalo"`. En desktop con `xl:` aparece la variante `<button>` con `onClick` (panel embebido).
- **Presupuesto en agenda**: `budgetLabel()` en `UpcomingDateCard` divide los valores entre 100 antes de mostrarlos — los presupuestos se almacenan en céntimos en Convex (1000 = 10 €). Cualquier otro componente que muestre presupuestos debe hacer lo mismo.
- **Cards generadas por IA** (GiftRecommendationCard): layout fijo desde arriba para que **el precio quede a la misma altura en todas las cards de la fila** — cabecera visual (ver punto siguiente), título (`text-base font-medium line-clamp-2 min-h-[2.75rem]`, reserva 2 líneas), fila de badges con **altura fija de 2 filas** (`min-h-[2.75rem] content-start`; badge `h-5` × 2 + gap) y **tope total de 3 chips** (marca(s) favorita(s) + categorías; `visibleCategoryTags = categoryTags.slice(0, 3 - matchedBrands.length)`) para que nunca pasen de 2 filas y no desplacen el precio, descripción con altura fija (`min-h-[4.5rem] line-clamp-3`, 3 líneas — la IA escribe 1 frase breve ≤ ~140 car., ver `docs/ia-regalos.md`), separador `border-t border-border/50`, precio prominente (`text-lg font-medium`) y debajo los botones de tienda.
- **Cabecera visual de las cards de ideas**: banda `h-24 rounded-xl` con dos variantes que comparten altura (las filas mixtas quedan alineadas):
  - **Foto de stock (Pexels)** si la generación encontró una: un `<div relative h-24 w-full overflow-hidden rounded-xl bg-muted/40>` que envuelve un `<img w-full h-full object-cover>` (`alt="" aria-hidden` — ilustrativa, el título ya nombra el regalo; `loading="lazy"`). Si la carga falla (`onError`), la card cae en caliente a la variante de icono.
  - **Sin atribución visible al autor**: las fotos de Pexels se muestran sin el overlay de crédito autor/Pexels (decisión de producto: el overlay ensuciaba la cabecera visual). Se sigue guardando `photographer`/`photographerUrl` en el dato por si en el futuro se quiere reintroducir el crédito en otro lugar (p. ej. un pie discreto fuera de la card). El flujo de datos hacia Pexels sigue disclosado en `docs/privacy.md` · 4.2.
  - **Icono por categoría (fallback)**: **tinte plano + icono lucide grande** (`size-9`, `strokeWidth={1.5}` — el stroke 2 default pesa demasiado a ese tamaño, `aria-hidden`). La IA elige una clave de un catálogo cerrado de 30 (`GIFT_IMAGE_KEYS` en `src/lib/gifts.ts`); el mapeo clave → icono + tinte vive en `src/lib/giftImages.ts`. Tres familias de tinte, todas planas (sin gradients): verde `bg-primary/10 text-primary` (naturaleza, deporte, experiencias activas), terracota `bg-secondary/15 text-secondary` (hogar, comida, afecto), ámbar `bg-chart-3/15 text-amber-700 dark:text-amber-500` (creativo, ocio, tech — el glifo usa amber-700 por la misma regla de contraste que el contador de la campana). Ideas antiguas sin `imageKey` caen al icono del tipo de regalo.
  - **Badge de marca favorita**: si la idea menciona una marca favorita de la persona (detectado por `matchFavoriteBrands` en `src/lib/brands.ts` sobre título + `amazonQuery`), antes de los badges de categoría se muestra un `Badge variant="outline"` con icono `Tags` (`size-3`) y el nombre de la marca, tintado en `text-secondary border-secondary/40` para distinguirlo de las categorías (`secondary` filled) sin salir de la paleta. Lleva un `<span className="sr-only">Marca favorita: </span>` para que el lector anuncie el porqué. Cierra el círculo del campo "marcas favoritas" (ver `docs/ia-regalos.md`).
  - **Decisión**: la foto ilustra la **categoría**, no el producto exacto (el matching de un buscador de stock no se verifica). Se descartaron la generación de imágenes con IA (coste + latencia) y las ilustraciones externas tipo unDraw (estética SaaS corporativa, fuera del registro de libreta cálida y del set único lucide). Flujo completo en `docs/ia-regalos.md` · "Cabecera visual por idea". Las cards de una fila mantienen **la misma altura** (`Card h-full` + grid estirado por defecto) y el precio queda **a la misma altura** gracias a las alturas fijas de título, fila de badges (2 filas reservadas) y descripción. Sin la altura fija de los badges, una card con 3 chips (2 filas) bajaba el precio respecto a las de 1 fila. Clave: **ningún bloque usa `flex-grow`** (la descripción NO lleva `flex-1`), así el contenido se apila desde arriba y, cuando una card tiene menos botones, el espacio sobrante queda **debajo de los botones**, nunca encima del precio. Sin icono `Sparkles` (se eliminó — el contexto de la página ya comunica que son sugerencias IA). Stagger animation `animate-in fade-in slide-in-from-bottom-2 duration-500` con `animationDelay: index * 60ms` para que aparezcan en cascada. Los 9 skeletons de carga usan `h-80 rounded-2xl border-dashed bg-muted/40 animate-pulse` (altura acorde a la card con cabecera visual) y siguen la misma rejilla que las cards reales (`sm:grid-cols-2 lg:grid-cols-3` standalone, `grid-cols-1` embebido) para previsualizar el layout.

#### Barra de progreso de generación (`GenerationProgress`)

`src/components/gifts/GenerationProgress.tsx`. Aparece **encima** de los skeletons mientras `loading` es true. Tranquiliza al usuario durante la espera (la generación tarda ~10-20 s y antes "no parecía que estuviera cargando").

- **No hay progreso real que leer**: la POST a `/api/recommendations` es una sola llamada bloqueante (Gemini + Pexels + Brandfetch en serie, sin streaming). El avance es **simulado con easing asintótico** hacia un tope del 93 %: `p + (93 - p) * 0.055` cada 240 ms — corre al principio y se frena cerca del final, así nunca afirma "100 %, terminado" antes de tiempo. La señal real de completado es la aparición de las cards, que desmontan el componente.
- **Mensajes de paso rotatorios**: 5 frases que avanzan cada 3,2 s ("Repasando sus intereses…", "Pensando ideas…", "Ajustando al presupuesto…", "Buscando fotos y tiendas…", "Dando los últimos retoques…"). Son narración, no fases reales del servidor. Se quedan en la última, no hacen loop.
- **Estilo**: card `rounded-2xl border-border/70 bg-card/40 p-6` (mismo registro que los empty states). Icono `Sparkles size-5 text-primary animate-pulse` + título (`Generando 9 ideas…` / `Regenerando ideas…` según `regenerate`) + porcentaje `tabular-nums` a la derecha. Barra: track `h-2 rounded-full bg-primary/15`, relleno `bg-primary` con `transition-[width] duration-300 ease-out`. Pie `text-xs text-muted-foreground` con expectativa de tiempo.
- **A11y**: `aria-hidden` en todo el bloque — el estado de carga ya se anuncia en el `aria-live="polite"` del panel padre. Un `role="progressbar"` con valor simulado induciría a error al lector.

### Buttons

- Variantes shadcn: `default` (verde, `bg-primary`), `secondary` (terracota, `bg-secondary`), `outline`, `ghost`, `destructive` (tintado, `bg-destructive/10`), `link`. Corregido: esta línea decía antes "default (terracota)", que era del `secondary`, no del `default` — confirmado contra `src/components/ui/button.tsx`.
- Tamaños: `sm` para acciones secundarias inline, `default` por defecto, `lg` para CTAs principales.
- **Links que parecen botón**: usar `<Link className={cn(buttonVariants({ ... }))}>`. El componente Button de esta app **no soporta `asChild`** porque usa `@base-ui/react` en vez de Radix Slot. Dos gotchas al usar `buttonVariants` directamente en un `<a>`/`<Link>` (no en el componente `Button`):
  - **Envuélvelo en `cn(...)`**: `buttonVariants` es `cva` puro y **no aplica tailwind-merge**; sin `cn`, las clases en conflicto coexisten — p. ej. `border-transparent` (base) y `border-border` (variant `outline`) — y el borde puede renderizarse **invisible**. El componente `Button` ya hace el `cn` por dentro; los `<a>` no.
  - **El hover del variant `default` está bajo el selector `[a]:hover`**, así que un `<a>` lo recibe pero un `<button>`/`<Button>` filled queda estático. Para hover en un `<Button>` default, añade `hover:bg-primary/80` explícito en `className`.

### Badges

- `default` (verde): solo para acciones y CTAs. No usar en badges informativos.
- `secondary` (terracota): badges informativos de identidad/relación ("Amigo/a", "Pareja") y énfasis o urgencia (NotificationBell).
- `outline`: tags de atributos (intereses, etiquetas de fecha) y "+N más".

### Chips de tienda (multi-tienda en `GiftRecommendationCard`)

Las tarjetas de regalo físico muestran 1–N chips, uno por tienda relevante. La lista actual de tiendas soportadas (`STORE_IDS` en `src/lib/stores.ts`) son 11: Amazon, El Corte Inglés, AliExpress, Temu, Miravia, Decathlon, IKEA, PcComponentes, MediaMarkt, Zalando, Druni. En la práctica la IA filtra a 1–3 chips por idea según `suggestedStores`, así que el grupo pocas veces es masivo. Reglas:

- **Estilo**: `<a className={cn(buttonVariants({ size: "default", variant: "outline" }), "min-w-0", isLastOdd && "col-span-2")}>` — **outline**: los enlaces de tienda abren una pestaña externa (el icono `ExternalLink` lo refuerza), y el filled verde se reserva para acciones principales internas ("Lo regalé", Regenerar). Tamaño `default` para que sea cómodo de pulsar. Logo de tienda (`<img src={STORE_ICONS[store]} className="size-4 shrink-0 rounded-sm object-contain bg-white p-px">`) antes del texto, nombre en `<span className="truncate">` (se recorta con ellipsis si no cabe en cards estrechas), e icono `ExternalLink` (`size-3.5 shrink-0`) detrás. Siempre `target="_blank"` + `rel="noopener noreferrer"` (evita reverse tabnabbing).
- **Iconos por tienda**: logos oficiales en PNG o SVG almacenados en `public/stores/{storeId}.{ext}`. `STORE_ICONS` en `src/lib/stores.ts` mapea cada `StoreId` a su path público. Todos se renderizan con `bg-white p-px rounded-sm` para garantizar visibilidad en modo oscuro (muchos logos son monócromos o tienen fondo transparente). Las tiendas de `/settings` usan el mismo `STORE_ICONS` con `size-4`.
- **Layout**: rejilla `grid grid-cols-2 gap-2` — dos botones por fila. Cuando el número de tiendas es impar, el último ocupa el ancho completo (`col-span-2`). Botones más grandes y a alturas predecibles (1–2 filas para 1–4 tiendas), en lugar del `flex flex-wrap` anterior que los dejaba pequeños y de altura variable (lo que además desalineaba el precio entre cards).
- **Orden**: canónico de `ALL_STORES` siempre, no el orden en que el usuario los marcó. Predecibilidad > preferencia.
- **Etiqueta**: nombre legible de la tienda (`STORE_LABELS[store]`), no el ID. "El Corte Inglés", no "elcorteingles".
- **Hint de fallback**: cuando la IA sugiere tiendas que no coinciden con las favoritas del usuario, debajo de la fila de chips aparece `<p className="text-[11px] text-muted-foreground">Búsqueda genérica — esta idea encaja mejor en otras tiendas.</p>`.
- **Eyebrows de origen (solo cuando hay botón de marca)**: si la idea matchea una marca favorita, los botones de compra se separan en **dos grupos rotulados** con eyebrow `STORE_SECTION_LABEL_CLASS` (`font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground`): "Tienda de marca" sobre el/los `BrandStoreLink` y "Buscar en tiendas" sobre la rejilla de marketplaces. El porqué: las marcas se añaden en la **ficha de la persona** (`people.favoriteBrands`) y los marketplaces en **Ajustes > Tiendas** (`userSettings.favoriteStores`) — dos entradas distintas que producen botones de aspecto similar, y sin rótulo el usuario no entiende por qué aparece la tienda de una marca que no marcó en Ajustes. **Cuando NO hay marca matcheada no se rotula nada** (caso mayoritario): la rejilla de marketplaces se muestra sola, sin eyebrow, como antes. El eyebrow del marketplace dice "Buscar en tiendas" (neutro, no "tus tiendas") para no contradecir el hint de fallback cuando las tiendas mostradas no son las favoritas del usuario.
- **No mezclar con icon-only buttons**: si en algún momento se quiere reducir el espacio (más de 4 tiendas, móvil pequeño), usar un overflow menu en vez de quitar las labels — los logos de tienda sin texto son fáciles de confundir.
- **Botón de marca favorita** (`BrandStoreLink`, componente compartido en [`src/components/gifts/BrandStoreLink.tsx`](../src/components/gifts/BrandStoreLink.tsx)): cuando la idea matchea una marca favorita (`matchFavoriteBrands`), antes de la rejilla de tiendas se renderiza un botón por marca a **ancho completo** (`col-span-2`), `buttonVariants({ size: "default", variant: "outline" })` tintado en `border-secondary/40 text-secondary hover:text-secondary` (mismo registro que el badge de marca), con nombre de la marca (`<span className="truncate">`) + `ExternalLink` (`size-3.5`). Va **primero, a ancho completo y bajo el eyebrow "Tienda de marca"** (ver punto anterior) porque es la vía que de verdad funciona: muchas marcas favoritas son DTC (Brandy Melville y similares) que no se venden en los marketplaces. El componente recibe los campos sueltos (`brand`, `query`, `title`, `matchedBrandStores`) y un `size` (`default` en la card de generación, `sm` en la lista de guardadas) para servir a ambos contextos. Dos variantes según si la tienda oficial se resolvió (campo `matchedBrandStores` de la idea, vía Brandfetch):
  - **Resuelta**: muestra el **logo de la marca** (`<img>` con `rounded-sm object-contain bg-white p-px` — mismo tratamiento que los logos de tienda para que se vea en modo oscuro; `onError` cae al icono `Tags`) y enlaza **a la web de la marca**: a la búsqueda del producto dentro de la tienda (`generateBrandProductSearchUrl`) si la idea trae `supportsSearch`, o a su home (`generateBrandStoreUrl`) si no. El `aria-label` es "Ir a la tienda de {marca}" cuando va a la home; "Buscar {idea} en {marca}" cuando va a la búsqueda interna.
  - **Sin resolver** (sin `BRANDFETCH_CLIENT_ID`, sin match en Brandfetch, o ideas viejas): icono `Tags` y enlace a `generateBrandSearchUrl` (búsqueda Google acotada a la marca, Capa 0).
  Los chips de tienda se mantienen debajo — algunas marcas (Nike, LEGO) sí están en Amazon. Mismo botón en la card de generación y en la lista de "Ideas guardadas" (ver variante en lista). Lógica en [`src/lib/brands.ts`](../src/lib/brands.ts), flujo completo en [`docs/ia-regalos.md`](ia-regalos.md).
- **Variante en lista (Ideas guardadas)**: la sección "Ideas guardadas" de la ficha de persona muestra las ideas en una **rejilla de mini-cards** (`grid sm:grid-cols-2 xl:grid-cols-3`), todas de igual altura (`h-full` en la card + `mt-auto` en la fila de chips). Cada mini-card lleva título (`line-clamp-2`), ocasión·precio, `description` (`line-clamp-2`), badges de **marca favorita** (`outline` tintado en secondary, igual que la card de generación) + categoría, y los enlaces de compra como chips pequeños **outline** (`buttonVariants({ size: "sm", variant: "outline" })`, no la rejilla grande de las cards de sugerencias — la lista es compacta). El botón **"Lo regalé"** (acción principal interna que abre el diálogo de historial) va en filled (`default`, sin flecha) para destacar sobre los enlaces de tienda. Los enlaces **replican lo que mostró la card al generar**: solo las físicas (e ideas viejas sin `giftType`) muestran chips de tienda; experiencias, planes y sorpréndeme → un chip "Buscar" a Google. Para que coincidan exactamente, al guardar una idea física se persiste el **snapshot de las tiendas efectivas** que se vieron (resultado de `pickEffectiveStores`, no las crudas de la IA) y en la lista se muestran tal cual. Igual que la card de generación, las físicas con marca matcheada muestran el **`BrandStoreLink`** (tamaño `sm`) encima de los chips de marketplace: al guardar también se congela `matchedBrandStores`, así que el botón lleva a la tienda oficial con su logo; las ideas guardadas antes de este cambio (sin ese snapshot) conservan el badge y caen al botón de búsqueda de marca (Capa 0). `giftType` y `matchedBrandStores` son campos opcionales en la tabla `savedIdeas`; las ideas guardadas antes de `giftType` se tratan como físicas y caen al fallback de favoritas.

Ver lógica completa en [`docs/ia-regalos.md`](ia-regalos.md#multi-tienda) y la implementación en [`src/components/gifts/GiftRecommendationCard.tsx`](../src/components/gifts/GiftRecommendationCard.tsx).

### Landing page (`src/app/page.tsx`)

Página de marketing, server component. Estructura:

- **Header**: logo + "PickPal" a la izquierda, `UserButton` de Clerk a la derecha (solo si autenticado).
- **Hero**: H1 serif escalado (`text-4xl → lg:text-7xl`) + subtítulo + CTAs. Sin eyebrow — se eliminó "Para las personas que te importan".
  - Autenticado: un botón "Ir a la agenda" → `/agenda`.
  - No autenticado: "Empezar gratis" (primary) + "Iniciar sesión" (outline).
- **Steps**: grid `grid-cols-1 sm:grid-cols-3`, tres `Card` estáticas (sin hover). Cada card tiene:
  - **Pictograma de marca** arriba: componente SVG de [`src/components/landing/StepIllustrations.tsx`](../src/components/landing/StepIllustrations.tsx), centrado en un contenedor `flex h-24 items-center justify-center`, tamaño `h-20 w-auto`. Flotan directamente sobre la card, sin banda de tinte detrás — los círculos crema del propio pictograma hacen de fondo.
  - Badge de número: `size-6 rounded-full bg-secondary text-secondary-foreground text-[11px] font-semibold`.
  - Título `text-xl font-medium` (serif heredado), en fila con el badge (flex row, `gap-3`).
  - Cuerpo `text-sm leading-relaxed text-muted-foreground`.
- **Footer**: una línea centrada `text-xs text-muted-foreground`.

**Pictogramas de marca (`StepIllustrations.tsx`):**

Ilustraciones planas en el mismo lenguaje que el logo-mark: figuras geométricas rellenas (sin stroke), círculos crema de fondo y el dúo verde bosque + terracota. Reglas:

- **Colores solo por token**: `fill-accent` (círculos crema de fondo), `fill-primary` (forma principal), `fill-secondary` (acento terracota), `fill-chart-3` (destello ámbar puntual). Nunca hex fijos — así se adaptan a claro/oscuro solos.
- **Entrada animada**: el contenedor del pictograma lleva `animate-in fade-in zoom-in-95 duration-500 fill-mode-both` con `animationDelay: index * 120ms` — las tres viñetas "aparecen" en cascada al cargar la landing. Zoom sutil (no slide) porque son objetos que *se posan*, no filas de lista. CSS puro (`tw-animate-css`), la página sigue siendo server component y `prefers-reduced-motion` se respeta por defecto.
- **Formas**: círculos, rects redondeados y paths simples. Las figuras humanas son cabeza (círculo) + hombros (rect con `rx` = mitad del ancho), recortadas al círculo de fondo con `clipPath` — mismo esquema que las dos figuras del logo.
- Siempre `aria-hidden` (decorativas). `viewBox="0 0 140 72"` compartido.

| # | Pictograma | Título |
|---|---|---|
| 1 | Trío de figuras — la central terracota, delante y más grande; las laterales verdes | Añade a tus seres queridos |
| 2 | Campana verde sobre círculo crema + badge terracota de aviso | Dile cuándo avisarte |
| 3 | Caja de regalo verde con lazo terracota + destellos ámbar/terracota | Genera ideas perfectas |

**Decisiones:**
- Las step cards no tienen hover — son informativas, no interactivas.
- **Pictogramas propios, no iconos lucide ni sets externos**: se probó una composición de iconos lucide con tintes planos (commit `d7eae86`) y se sustituyó — los iconos de stroke leen como UI, no como ilustración. Los pictogramas rellenos en la paleta de marca extienden el lenguaje del logo (figuras planas verde+terracota) y mantienen el registro de papelería cálida. unDraw y similares siguen descartados (estética SaaS genérica). Esta es la **excepción deliberada a la regla "no SVG inline"** de Iconografía: aplica solo a ilustración de marca (landing, futuros empty states de marketing), nunca a iconos funcionales de la app, que siguen siendo lucide.
- El mapeo semántico de colores se mantiene: terracota = personas/afecto, verde = producto/acción, ámbar = destello puntual.
- Sin emojis en las cards: número + pictograma comunican el paso y mantienen el registro adulto.
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
- **Cada sección va en su propia `Card`** (`border-border/60 shadow-sm`, con `CardContent p-5` y eyebrow `<h2>` `font-sans` + icono lucide `size-3.5`) — mismo registro de cards que la ficha de persona (`/seres-queridos/[id]`), para que crear y editar se vean como la misma libreta.
  - **Columna izquierda — card "Quién es"** (icono `UserRound`): avatar, nombre, relación, intereses, marcas favoritas, notas. `CardContent` con `space-y-5` (campos altos: avatar con botones, textareas).
  - **Columna derecha — card "Datos prácticos"** (icono `Ruler`: talla zapato, talla ropa, alergias, no le gusta) + card "Eventos" (`EventsSection`, icono `CalendarDays`, solo si `includeDates`). Las dos cards se apilan con `space-y-6` (mismo gap que el grid). `CardContent` con `space-y-4`.
- Dentro de cada card, los grupos usan `space-y-1.5` label–input–error.
- **Por qué cards, y por qué la identidad también lleva título** (revierte la decisión previa de "sin contenedores"): la sección de identidad (foto, nombre, gustos…) no tenía título; ahora es una card con eyebrow representativo, "Quién es" (cubre identidad + gustos). Envolver **todas** las secciones en cards iguala el formulario de creación con la ficha de persona —donde cada sección ya vivía en una `Card` con eyebrow `<h2>`— y resuelve la antigua objeción de "rompe la simetría": ya no hay una columna con caja y otra sin ella, ambas son cards.
- **Marcas favoritas vive con Intereses** (card "Quién es"), no en "Datos prácticos": es un *gusto* (preferencia positiva que alimenta la IA), no un hecho/restricción como las tallas o las alergias. "Datos prácticos" se reserva para tallas y límites.

**PersonForm — qué es obligatorio:**
- **Solo `name` es obligatorio**; todo lo demás es opcional. No se etiquetan secciones sueltas como "(opcional)" — marcar unas sí y otras no daba a entender que intereses/marcas/notas eran obligatorios. Los headers de sección van limpios ("Datos prácticos", "Eventos").
- La obligatoriedad se comunica **una sola vez**, con un subtítulo `text-sm text-muted-foreground` bajo el `h1` de la página de alta (`/seres-queridos/new`): "Solo el nombre es obligatorio. Lo demás puedes rellenarlo ahora o cuando quieras." Sin asteriscos de "campo requerido" — chocan con el registro de libreta cálida.

**PersonForm — sección Eventos (al crear):**
- `EventsSection` lista los eventos añadidos en memoria (antes de guardar la persona) y ofrece un botón dashed "Añadir evento".
- Al pulsar, aparece `AddEventForm` inline (misma sección, sin dialog ni navegación).
- `AddEventForm` usa `<div>`, NO `<form>` — evita anidamiento de `<form>` HTML prohibido. El botón "Añadir evento" es `type="button"` con `onClick={handleSubmit(onAdd)}`.
- **Enter dentro de `AddEventForm`**: como es un `<div>` dentro del `<form>` de `PersonForm`, pulsar Enter en un input dispararía el submit implícito del form exterior (crearía la persona con la fecha a medias y solo dejaría añadir una fecha al crear). El root del `<div>` lleva un `onKeyDown` que, si `e.key === "Enter"` y el target es un `INPUT`, hace `preventDefault()` y llama a `handleSubmit(onAdd)()` — Enter confirma el evento, igual que en un `<form>` real (`ImportantDateForm`). El guard por `INPUT` deja intactos los Select y el botón del date picker.
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

**Modo standalone**: usado por `/seres-queridos/[id]/gifts/page.tsx`, que es un thin wrapper. La ruta acepta `?occasion=...` para preseleccionar el evento. El back link usa `router.back()` y muestra "Volver" — siempre vuelve al paso anterior real del historial, sin importar desde dónde se llegó.

**Selección de ocasión y botón Generar (sin botón "mudo"):** al entrar desde la ficha (`?from=person`, sin `?occasion`) no hay evento preseleccionado. Dos reglas evitan el botón deshabilitado sin explicación (anti-patrón):
- **Auto-selección con un único evento**: si la persona tiene exactamente un evento, se preselecciona solo (caso más común). Con varios eventos NO se elige por el usuario (presupuestos distintos) — se deja que escoja.
- **Botón activo + validación guiada**: el botón "Generar" se deshabilita solo por `loading` o por **no haber ningún evento** (`!hasEvents`), no por falta de ocasión seleccionada. Si se pulsa con eventos disponibles pero sin ocasión elegida, en vez de generar a ciegas se guía al usuario: `toast.error("Elige primero una ocasión")` + el `SelectTrigger` se marca `aria-invalid` (ring `destructive` que ya trae el componente) y recibe foco + `scrollIntoView`. El estado inválido se limpia al elegir una ocasión. El `SelectTrigger` lleva `id="gift-occasion-trigger"` para el foco. Cuando la persona no tiene eventos, el botón sí queda deshabilitado y el empty state ("Sin eventos todavía") guía a crear uno.

**Header fijo en móvil (standalone)**: cuando el panel de controles sale de la pantalla al hacer scroll, aparece un header `fixed top-0` con fade + slide que muestra el avatar, el nombre de la persona (link a su ficha) y el botón "Regenerar" (solo si ya hay ideas). Solo visible en móvil (`lg:hidden`) — en desktop los controles siempre son visibles. La detección usa un listener `scroll` sobre `window` que comprueba `controlsRef.current.getBoundingClientRect().bottom < 0`. El fondo lleva `bg-background/90 backdrop-blur-sm` para que el contenido detrás quede desenfocado. `aria-hidden` cuando está oculto. El `controlsRef` apunta al mismo div de controles que usa el modo embebido.

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

### Aviso de datos hacia la IA (`AiNotesNotice`)

[`src/components/people/AiNotesNotice.tsx`](../src/components/people/AiNotesNotice.tsx). Va **bajo el campo de notas**, en los dos sitios donde se editan: alta (`PersonForm`, card "Quién es") y ficha (`/seres-queridos/[personId]`). Un `<p className="text-xs text-muted-foreground">` con enlace subrayado a `/privacidad` — el mismo registro que el resto de hints de formulario, sin caja de alerta ni icono de warning.

**Por qué sin `Alert` ni tinte destructivo**: no es un error ni un peligro inminente, es transparencia. Un banner ámbar junto a un campo opcional rompería el registro de libreta cálida y enseñaría al usuario a ignorarlo. El texto informa y sigue.

**No es decoración, es un requisito legal** (RGPD art. 13: la información va donde se recogen los datos). Las notas se envían a Gemini en la capa gratuita, donde Google puede entrenar con ellas. Si se rediseña el formulario, el componente tiene que seguir montado en **ambas** pantallas — el texto vive en un componente compartido justamente para que no divergan. Contexto en [`docs/privacy.md`](privacy.md) §4.1.

### Intereses — autocompletado y sugerencias (`InterestTagInput`)

`src/components/people/InterestTagInput.tsx`. Se usa en `PersonForm` (creación) y en la ficha de persona (autosave). Dos capas de ayuda sobre el input libre de tags:

- **Desplegable al escribir**: filtra un catálogo local de intereses (`src/lib/interests.ts`, ~150 items en categorías) ignorando mayúsculas y acentos, priorizando prefijo > inicio de palabra > subcadena. Máximo 7 opciones. **Deliberadamente local, sin IA**: las opciones deben aparecer en cada pulsación — una llamada al LLM por keystroke sería lenta, gastaría la cuota diaria (10/día) y enviaría datos fuera sin necesidad.
- **Chips de sugerencia**: bajo el input, hasta 6 chips con intereses relacionados con los ya añadidos (items de las mismas categorías del catálogo, round-robin entre categorías para variedad; con la ficha vacía, un set de arranque diverso). **Sin etiqueta "Sugerencias:"** — el contexto (chips de interés con icono `Plus` justo bajo el input) ya comunica qué son; el rótulo era ruido. Botón **"Otras"** (`RefreshCw` + texto, `Button variant="outline" size="xs"` con `rounded-full`) rota la ventana sobre el pool completo. Lleva **borde + etiqueta**, no un icono `ghost` suelto: el icono sin borde no se leía como pulsable. Va **al principio de la fila (posición fija), NO al final de los chips**: con `flex-wrap`, los chips cambian de ancho y número en cada refresco, así que un botón al final saltaba de sitio y era incómodo de pulsar de seguido. Anclado al principio (ancho constante), no se mueve. Los chips son `Badge variant="outline"` con icono `Plus` y `render={<button type="button">}` + `aria-label="Añadir X"` (mismo patrón a11y que los chips de eliminar). Hover explícito `hover:bg-muted transition-colors` (regla de chips clicables).
- **Desplegable — estilo y a11y**: panel `absolute` bajo el input (`rounded-lg bg-popover shadow-md ring-1 ring-foreground/10 p-1`, mismo registro que `SelectContent`), entrada `animate-in fade-in-0 slide-in-from-top-2 duration-100`. Patrón ARIA combobox completo: input con `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` y `aria-activedescendant`; lista `role="listbox"` con `role="option"` + `aria-selected`. Teclado: ↑/↓ navegan, Enter añade la opción resaltada (o el texto libre si no hay ninguna resaltada — Enter conserva su comportamiento de siempre), Escape cierra. Las opciones usan `onMouseDown={e => e.preventDefault()}` para que el blur del input no cierre la lista antes de que llegue el click.
- **Dedupe sin acentos**: añadir "futbol" cuando ya existe "Fútbol" no crea duplicado (comparación normalizada).
- **Tope de 20**: al llegar a `MAX_INTERESTS` (espejo del validador del servidor) desaparecen desplegable y sugerencias.

### Marcas favoritas (`BrandTagInput`)

`src/components/people/BrandTagInput.tsx`. Mismo patrón de chips que `InterestTagInput` (Badge `secondary` con `X`, input + botón `Plus`, dedupe normalizado sin acentos, Enter/coma añade, Backspace con input vacío quita la última) pero **sin desplegable ni sugerencias**: las marcas son un vocabulario abierto (LEGO, Nike, Lush…) que no tiene sentido autocompletar con un catálogo local. Tope de 10 (`MAX_BRANDS`, espejo del validador del servidor); al alcanzarlo el input se deshabilita con placeholder "Máximo alcanzado". Se usa en `PersonForm` (creación, bajo Intereses, sin hint) y en la ficha de persona (autosave en cada cambio, eyebrow `Tags`). El campo alimenta el prompt de la IA — ver `docs/ia-regalos.md` · "Marcas favoritas".

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

**Fila de evento — modo vista (jerarquía):** la fila usa `flex items-start justify-between` con tres líneas apiladas en el bloque izquierdo:
1. Título `font-medium` + badge de recurrencia (Anual/Única).
2. Fecha (`text-xs text-muted-foreground`) — `15 mayo 1990`.
3. Presupuesto (`text-xs text-muted-foreground`, solo si está definido) — `Presupuesto: 10€ – 50€`.

Las acciones (`PencilLine`, `X`) van pegadas al borde derecho con `shrink-0`. **No** colapsar las tres piezas en una sola línea con `·` — el nombre del evento y la fecha son información de niveles distintos, separarlos en líneas distintas es lo que evita el "todo apelmazado". Mismo patrón en la fila de eventos del `PersonForm` (modo creación), reutilizando los mismos badges.

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

Patrón para "volver a la sección anterior", visible en la parte superior de páginas de detalle o subpáginas. Componente compartido: `src/components/layout/BackLink.tsx`.

```tsx
<BackLink />
```

```tsx
// Implementación interna (variante con icono, por defecto)
<button
  onClick={() => router.back()}
  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
>
  <ArrowLeft className="size-3.5" aria-hidden />
  Volver
</button>
```

**Props:**
- `fallbackHref?: string` — si se indica y no hay historial dentro de la app (`window.history.length <= 1`, p. ej. URL abierta directamente o desde un enlace externo), navega ahí en vez de `router.back()`. Sin esta prop, siempre `router.back()`. Usado en los pies de página públicos (`/terminos`, `/privacidad`) con `fallbackHref="/"`.
- `icon?: boolean` (default `true`) — variante con `ArrowLeft` + layout en fila (páginas de detalle) o variante de texto plano sin icono (pies de página, donde el contenedor ya centra y da color). `/terminos` y `/privacidad` usan `icon={false}`.
- `label?: string` (default `"Volver"`).
- `className?: string`.

**Reglas:**
- `router.back()` siempre por defecto — navega al paso anterior real del historial del navegador, sin importar desde dónde se llegó a la página. **Nunca hardcodear un `href` fijo** (p. ej. `<Link href="/seres-queridos">`): eso rompe el patrón para cualquier caso en que se llegó a la página desde otro sitio.
- `<button>` con `onClick`, no `<Link>` — `router.back()` no tiene URL.
- Icono `ArrowLeft` de lucide-react, `size-3.5`. `aria-hidden` — el texto del botón ya es descriptivo.
- Color `text-muted-foreground` en reposo, `hover:text-foreground`. No usar `text-primary`.
- `w-fit` para que el área de hover no se extienda a todo el ancho (variante con icono).
- Texto: "Volver" siempre — con navegación dinámica no se sabe el destino en tiempo de render.

### Avatars

- Tamaño default `size-10`–`size-12` en cards, `size-20`–`size-24` en headers de detalle.
- En headers grandes, añadir `ring-1 ring-border` para definir el contorno sin que pese.
- Si no hay foto, fallback con iniciales (2 letras max, mayúsculas).
- **Avatar picker** (personalizador por rasgos): el usuario **construye** el avatar eligiendo cada rasgo con vista previa en vivo, usando la API de [DiceBear](https://api.dicebear.com/9.x/) con el estilo `dylan`. No hay botón "Regenerar". Rasgos: tono de piel (8 tonos, rampa clara→oscura), peinado (**los 12 del schema — es el catálogo completo de dylan, no hay más sin cambiar de estilo**), color de pelo (10), expresión, barba (on/off) y fondo (12 colores vivos y saturados —los pasteles apenas se apreciaban—, sin opción "transparente"; libres, cualquier hex). Botón **«Aleatorio»** (icono `Shuffle`) combina todos los rasgos al azar para quien no quiera decidir; además hay un «Aleatorio» **directo en `PersonForm`** (fuera del diálogo) que usa el helper exportado `randomAvatarUrl()` para generar y aplicar sin abrir el personalizador. Cada rasgo se "pinea" a un único valor de su array (`skinColor[]`, `hair[]`, `hairColor[]`, `mood[]`, `backgroundColor[]`, `facialHairProbability`), de modo que el resultado es determinista y la semilla (`"pickpal"`, fija) no influye en lo que se ve. dylan solo trae 2 tonos de piel de fábrica → ampliamos la paleta para representación; `mood` excluye `angry` y `sad` por no encajar con el retrato de un ser querido. La URL construida (~185 chars) se guarda en `person.avatarUrl` (opcional) y pasa la validación server-side (prefijo `https://api.dicebear.com/`, < 512 chars). Las opciones llevan `aria-pressed` y cada grupo de rasgo es un `role="group"` con `aria-labelledby`. **`AvatarPicker` es controlado** (props `build` / `onBuildChange`): el estado del avatar vive en el padre (`AvatarPickerDialog`), no en el picker; así el preview puede pintarse en la cabecera fija del diálogo mientras los selectores scrollean. Componente: `src/components/people/AvatarPicker.tsx`.
- **Avatar en diálogo (crear y editar)**: tanto en `PersonForm` (alta) como en el encabezado de perfil, el `AvatarPicker` va dentro de un **diálogo** (`AvatarPickerDialog`, compartido) para que la personalización no ocupe espacio por delante de los datos importantes. La superficie en el formulario/encabezado es solo un `Avatar` (preview con fallback de iniciales) + un disparador: botón «Elegir/Cambiar avatar» en `PersonForm`, overlay de cámara (`Camera`, visible en hover) en el perfil. **Layout del diálogo**: cabecera con un **preview pequeño fijo (`size-14`) a la izquierda**, y a su derecha el título «Personalizar avatar» con el botón **«Aleatorio» justo debajo** (sin texto de descripción). Preview y Aleatorio quedan fuera del área scrolleable, de modo que el avatar y el azar nunca se pierden de vista al bajar por los selectores (`max-h-[55vh] overflow-y-auto`, no en el div redondeado del diálogo). El diálogo edita un **borrador**: `build` se siembra al abrir desde la URL guardada (`parseAvatarUrl`; las URLs antiguas con semilla + arrays múltiples caen a los valores por defecto) y solo se persiste al pulsar «Usar este avatar» **si `touched`** (el usuario tocó algún rasgo o «Aleatorio») — sin ese flag, confirmar sin tocar guardaría el avatar por defecto y se perdería el fallback de iniciales. En el perfil eso dispara el autosave; en alta queda en el formulario hasta el submit; «Cancelar» descarta. Componente: `src/components/people/AvatarPickerDialog.tsx`.

### Edición inline (perfil de persona)

`/people/[id]` no tiene página de edición separada. `/people/[id]/edit` redirige a `/people/[id]`. Toda la edición ocurre inline en el perfil, dividida en tres secciones independientes:

| Sección | Campos | Cuándo guarda |
|---|---|---|
| Header — nombre | name | `onBlur` del input (o Enter) |
| Header — relación | relationship | `onValueChange` del Select (inmediato) |
| Header — avatar | avatarUrl | Al confirmar en el Dialog («Usar este avatar») |
| Intereses | interests | `onChange` del tag input (cada add/remove) |
| Marcas favoritas | favoriteBrands | `onChange` del tag input (cada add/remove) |
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
- **Formularios inline expand/collapse**: cuando un formulario aparece in situ tras pulsar un botón "Añadir/Editar X" (`ImportantDateForm`, `EditImportantDateInline`, `GiftHistoryForm`, `EditGiftHistoryInline`, `AddEventForm` de `PersonForm`), añadir `animate-in fade-in slide-in-from-top-1 duration-200` al elemento raíz del formulario. Es excepción legítima a la regla "no animar elementos individuales" porque hay continuidad espacial (el contenedor expande, no aparece de la nada). 200ms corto para no demorar la interacción.
  - **Riesgo:** la animación se replay si el componente se desmonta/remonta. Verificar que ningún ancestro tiene un `key` que cambie con datos de Convex. El toggle interno (`useState` de `showForm`) mantiene el elemento montado mientras esté abierto; sin riesgo en los formularios actuales.
- **Selección de cards con cambio visual** (UpcomingDateCard cuando `isSelected`): `transition-[border-color,box-shadow] duration-150` para que el ring/border aparezca con fade en lugar de saltar. No usar `transition-all` con `hover:-translate-y` en cards con acción interna (regla 164).
- **Hovers en chips/badges clicables** (un `Badge` que no sea `<a>` — p. ej. los tags de interés, que son `<Badge render={<button>}>`; ver Accesibilidad): añadir explícitamente `hover:bg-secondary/80 transition-colors` (o equivalente). Las variantes shadcn de Badge tienen el hover bajo selector `[a]:hover:...`, que solo aplica a `<a>` — un `<span>`/`<button>` con cursor-pointer no recibe hover por defecto.
- **No animar**: aparición de un único elemento espontáneo (es ruido), elementos que reaparecen tras refresh, headers, navegación, transiciones de página. **Excepción**: los pictogramas de la landing animan su entrada en cada carga — es una página de marketing donde la primera impresión es el objetivo, no una herramienta de uso repetido. No extender esto a páginas de la app.
- **`fill-mode-both`** es importante en stagger: sin él, las cards parpadean al inicio porque la animación no tiene estado inicial.
- **`prefers-reduced-motion`**: Tailwind y `tw-animate-css` lo respetan por defecto. No añadir overrides manuales.

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
- `RefreshCw` — regenerar / refrescar (regenerar ideas de regalo en `GiftsPanel`, refrescar sugerencias de intereses en `InterestTagInput`). El avatar picker ya no lo usa (se construye por rasgos, sin "Regenerar").
- `Repeat2` — evento recurrente (anual).
- `CalendarX2` — evento de fecha única (no recurrente).
- `Check` — indicador de guardado exitoso (pill fijo en perfil de persona).
- `ArrowLeft` — enlace de retroceso ("← Seres queridos", "← [nombre]"). Siempre `size-3.5`.
- `Star` — eyebrow de sección "Intereses" (ficha y formulario).
- `Tags` — eyebrow de sección "Marcas favoritas" (ficha).
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
- **Catálogo visual de ideas** — la cabecera de `GiftRecommendationCard` usa 30 iconos lucide adicionales (Smartphone, Headphones, ChefHat, Wine, Plane, Drama, etc.) mapeados en `src/lib/giftImages.ts`. Es el único sitio donde se usan iconos `size-9` con `strokeWidth={1.5}`; ver Componentes · Cards · Cabecera visual.
- **Nota tiendas**: los chips de tienda ya NO usan iconos Lucide. Usan logos PNG/SVG oficiales en `public/stores/`. Ver sección Chips de tienda.

**Reglas:**
- **Botones icon-only** necesitan `aria-label` y `title`. Usar variant `ghost` y size `icon` o `icon-sm`.
- **Botones con icono + texto**: el icono va antes del texto, separado por el gap nativo del botón. No añadir `mr-2`.
- **No mezclar sets**: no usar Heroicons / Phosphor / SVG inline como icono funcional. Si lucide no tiene un icono concreto, abrir issue en pendientes antes de meter algo ad-hoc. **Excepción**: las ilustraciones de marca (logo-mark, pictogramas de la landing en `src/components/landing/StepIllustrations.tsx`) sí son SVG propio — son ilustración, no iconografía. Ver Componentes · Landing page.
- **NADA de emojis en ningún sitio de la UI** (botones, chips, tarjetas, headers, navegación y también empty states). Siempre el icono de lucide más cercano. Equivalencias usadas en empty states: libreta → `Notebook`, café/calma → `Coffee`, ideas/destellos → `Sparkles`.
- **Iconos decorativos**: `aria-hidden`. Solo los que aportan información llevan label.

---

## Empty states

Componente compartido: `src/components/layout/EmptyState.tsx`. Usado en [`src/app/(app)/seres-queridos/page.tsx`](../src/app/(app)/seres-queridos/page.tsx), [`src/app/(app)/agenda/page.tsx`](../src/app/(app)/agenda/page.tsx) y [`src/components/gifts/GiftsPanel.tsx`](../src/components/gifts/GiftsPanel.tsx).

```tsx
<EmptyState
  icon={Notebook}
  title="Una libreta en blanco"
  description="Texto invitador, 1-2 frases, voz humana, sugiere acción concreta."
  cta={
    <Link href="/..." className={buttonVariants({ size: "lg" })}>
      Verbo concreto + objeto
    </Link>
  }
/>
```

**Props:**
- `icon?: LucideIcon` — opcional; sin icono para variantes reducidas de "sin resultados" (ver `seres-queridos` más abajo).
- `title?: string` — opcional por la misma razón.
- `description?: ReactNode`.
- `descriptionClassName?: string` — para casos que necesitan un ancho distinto (p. ej. `max-w-md` en vez del `max-w-sm` por defecto).
- `cta?: ReactNode` — se pasa el `Link`/`Button` ya construido, no una API propia, porque los CTAs varían entre navegación (`Link`) y acción (`Button onClick`).
- `compact?: boolean` (default `false`) — `p-10` en vez de `p-14`, para variantes secundarias con menos contenido.

**Reglas:**
- Icono decorativo lucide (`Notebook`, `Coffee`, `Sparkles`) con `size-9 text-muted-foreground`, centrado con `flex justify-center` y `aria-hidden`. **NADA de emojis** (ni aquí ni en navegación, headers, badges o step cards).
- Título h2 en serif (heredado del base layer), **frase con voz**, no etiqueta funcional. "Una libreta en blanco" sí; "Sin datos" no.
- Container: `rounded-2xl border-dashed`. Punteado refuerza "este sitio está esperando algo".
- **El CTA debe ir al destino más directo**: el empty state de la agenda sin personas lleva a `/seres-queridos/new` ("Añadir ser querido"), no a `/seres-queridos`. El usuario ya sabe que necesita crear una persona — no hay que darle un paso intermedio.
- **Empty states contextuales**: cuando hay más de una razón posible para que algo esté vacío, distinguir cuál aplica y adaptar mensaje + CTA. No mostrar siempre el mismo empty state genérico.

**Seres queridos — dos variantes** (`src/app/(app)/seres-queridos/page.tsx`):

| Situación | Icono | Título | CTA |
|---|---|---|---|
| Sin personas (`people.length === 0`) | `Notebook` | "Una libreta en blanco" | "Añadir la primera persona" → `/seres-queridos/new` |
| Hay personas pero el filtro de relación no devuelve ninguna | — | — (solo `description`, `compact`) | Sin CTA — "Nadie en esta categoría todavía." |

**Agenda — dos empty states** (`src/app/(app)/agenda/page.tsx`):

| Situación | Icono | Título | CTA |
|---|---|---|---|
| Sin personas (`people.length === 0`) | `Coffee` | "Empieza aquí" | "Añadir ser querido" → `/seres-queridos/new` |
| Hay personas pero sin eventos próximos | `Coffee` | "Todo tranquilo" | "Ver seres queridos" → `/seres-queridos` |

La página hace dos queries en paralelo: `api.importantDates.getUpcoming` y `api.people.getAll`. Si `filtered.length === 0`, se comprueba `people.length` para decidir qué empty state mostrar. Si `people` todavía carga, se muestra el skeleton (no el empty state) para evitar un flash.

**GiftsPanel sin eventos** (`src/components/gifts/GiftsPanel.tsx`):

Cuando `events.length === 0` (la persona existe pero no tiene ningún evento guardado), el placeholder central muestra:
- Título: "Sin eventos todavía"
- Mensaje: "Para generar ideas necesitas al menos un evento."
- CTA botón `outline`: "Añadir evento a [nombre]" → `/seres-queridos/[personId]`

Cuando hay eventos pero no se ha generado aún, muestra el placeholder informativo habitual ("A medida para [nombre]") sin CTA (usa `descriptionClassName="max-w-md"`, más ancho que el resto de empty states porque el texto explicativo es más largo).

Cuando el usuario **descarta todas las ideas** de una tanda, se muestra otro empty state contextual ("Has descartado todas las ideas") con CTA filled "Generar de nuevo" (`Button` default + `hover:bg-primary/80` explícito, icono `RefreshCw`) — nunca un grid en blanco.

**Cuota visible**: tras cada generación, bajo los controles aparece `Te quedan N generaciones hoy` (`text-xs text-muted-foreground`), con el `remaining` que devuelve la API de recomendaciones.

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

## Accesibilidad

Convenciones obligatorias. Las primitivas de `components/ui` (base-ui) ya traen roles y `focus-visible`; estas reglas cubren cómo usarlas y los patrones propios.

- **Skip link**: el shell autenticado (`src/app/(app)/layout.tsx`) abre con un `<a href="#contenido">Saltar al contenido</a>` oculto (`sr-only focus:not-sr-only`). El contenedor del contenido lleva `id="contenido" tabIndex={-1}`. Si se añade otro shell con navegación previa al contenido, replicar el patrón.
- **Navegación activa**: el enlace activo lleva `aria-current="page"` además del estilo (sidebar y `MobileNav`). El color/peso por sí solo no comunica el estado a un lector. Cada `<nav>` lleva `aria-label` ("Principal").
- **Selects sin `<Label htmlFor>`**: cuando el `<Label>` no está asociado al control (selects custom, o triggers con `<span>` manual), el `SelectTrigger` **debe** llevar `aria-label`. Si se puede asociar, mejor el patrón `htmlFor`+`id` (ejemplo: filtro de relación en `seres-queridos/page.tsx`).
- **Errores de formulario**: el input con error lleva `aria-invalid` y `aria-describedby="<campo>-error"`, y el `<p>` del mensaje lleva ese mismo `id`. Sin esto el lector no anuncia el error al enfocar el campo. Patrón aplicado en `PersonForm`, `ImportantDateForm` y `GiftHistoryForm` — incluidos los `SelectTrigger` (mes, reacción) y los inputs de `BudgetRangeSlider` (que usa `useId()` porque se monta varias veces en la misma página). **Todo campo validado debe renderizar su mensaje de error** — un submit que falla sin feedback visible es un bug (pasó con reacción/año en el historial de regalos).
- **Chips/tags clicables**: si un chip ejecuta una acción (p. ej. eliminar un interés), debe ser un `<button>` real, no un `<span onClick>`. Usar `<Badge render={<button type="button" .../>} aria-label="Eliminar …">`. Los `<span onClick>` no son enfocables ni operables por teclado.
- **Toggles**: botones que actúan como interruptor o selección única llevan `aria-pressed` (tipo de regalo en `GiftsPanel`, guardar idea en `GiftRecommendationCard`, opciones del `AvatarPicker`). Un grupo de selección única se envuelve en `role="group"` con `aria-labelledby`.
- **Enlaces externos** (`target="_blank"`): `aria-label` descriptivo que incluya "(abre en una pestaña nueva)" — los chips de tienda solo "se llaman" como el nombre de la tienda y se repiten entre cards.
- **Resultados asíncronos**: anunciar con una región `aria-live="polite"` (`role="status"`). La generación de ideas anuncia "Generando…" / "N ideas generadas". **El contenido debe insertarse/quitarse del DOM dentro de la región**: un cambio solo de opacidad no se anuncia. El pill "Guardado" de autosave (ficha de persona y `/settings`) renderiza su texto condicionalmente dentro del `div` `aria-live` por este motivo.
- **Iconos decorativos** `aria-hidden`; **botones icon-only** con `aria-label` único y descriptivo (no repetir el mismo label N veces).
- **Skeletons de carga**: el contenedor lleva `role="status"` + un `<span className="sr-only">Cargando…</span>`; los bloques `animate-pulse` van `aria-hidden`. `LoadingFallback` ya sigue este patrón.
- **`DatePickerDialog` (rueda móvil)**: cada columna (`ScrollColumn`) es un `role="spinbutton"` enfocable (`tabIndex={0}`) con `aria-label` (Día/Mes/Año), `aria-valuemin/max/now` y `aria-valuetext` (mes en texto completo). Teclado: ↑/→ incrementa, ↓/← decrementa, Re/Av Pág ±5, Inicio/Fin a los extremos; el ítem central se resalta (`font-medium text-foreground`). Las tres columnas van en un `role="group" aria-label="Fecha"`. Mantiene el arrastre con puntero para móvil.

### Contraste (WCAG AA)

Medido con conversión OKLCH→sRGB (objetivo 4.5:1 texto normal, 3:1 texto grande/UI):

- **`text-muted-foreground`** sobre `background`/`card`: ~5.6–7.0:1 en claro y oscuro → **pasa**. No oscurecer el token (la sensación de medido a ojo engaña: la `L` de OKLCH no es la luminancia relativa de sRGB).
- **`text-amber-500`** sobre superficies claras: ~2.0:1 → **fallaba** (era el contador "≤7 días" de la campana). Corregido a **`text-amber-700 dark:text-amber-500`** (claro 4.91:1, oscuro 8.1:1). Para texto de aviso ámbar sobre fondo claro, usar `amber-700` (no `amber-500/600`).
- **`text-destructive`** ("Hoy") sobre `card` claro: ~5.2:1 → pasa.
- **`--secondary-foreground` sobre `--secondary`** (botones/badges `secondary`, terracota): en claro el texto era casi blanco (`oklch(0.985 0.005 80)`) sobre terracota → **3.66:1**, no pasaba AA de texto normal (4.5:1), solo el umbral de texto grande/UI (3:1). **Corregido**: `--secondary-foreground` en claro pasa a texto oscuro `oklch(0.18 0.012 50)` → **4.92:1** (pasa AA). Se conserva el terracota de marca (`--secondary` sin tocar) y queda coherente con dark, que ya usaba texto oscuro sobre terracota (6.78:1). Nota WCAG: `font-medium` (500) no cuenta como "bold", así que estos botones no se acogen al umbral de texto grande (3:1); por eso hay que cumplir los 4.5:1. Detectado auditando las variables de Figma (ver "Tokens · Figma — arquitectura de variables").
- **Verde de marca sin variante clara para texto sobre fondo oscuro**: `--primary` en dark (`#315837`) sobre `--background` dark da **2.32:1** — no pasa ni el umbral de texto grande. El verde de marca solo está pensado como *fondo* de botón/badge (con `--primary-foreground` encima), nunca como color de texto sobre la página; no crear un token de "texto de marca/acción" verde para dark mode sin antes añadir un primitivo más claro.

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
