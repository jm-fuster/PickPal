# Sistema de diseño · Giftly

Documento vivo. Captura las decisiones visuales del producto y el porqué de cada una. Cuando una decisión cambie, se actualiza este archivo en el mismo commit que toca el código.

---

## Intención

Giftly es una app sobre **personas queridas y ocasiones que importan**. El registro visual es el de una libreta de papel cálido, no el de un dashboard SaaS.

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
| `--primary` | `oklch(0.62 0.13 45)` (~`#C9784E`) | Terracota. Atardecer, papel envuelto, no "primary corporativo". |
| `--secondary` / `--muted` / `--accent` | `oklch(0.93 0.022 75)` | Beige cálido — para fondos sutiles, badges neutros, hover. |
| `--border` | `oklch(0.88 0.025 75)` | Tostado discreto. Define sin gritar. |

### Colores · dark

Mantenemos calidez también en oscuro. Nada de marrón griseado.

| Token | Valor | Por qué |
|---|---|---|
| `--background` | `oklch(0.18 0.012 50)` | Marrón profundo, no negro. Sigue evocando papel a baja luz. |
| `--foreground` | `oklch(0.94 0.012 80)` | Crema clara con un toque cálido. |
| `--primary` | `oklch(0.7 0.12 45)` | Terracota más luminosa para no hundirse contra el marrón. |

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

### Cards (shadcn `Card`)

- Default: `rounded` heredado del token, `border border-border/60` para que la línea sea sutil, `shadow-sm`.
- Padding: `p-4` en cards densas (PersonCard), `p-5`–`p-6` en cards informativas (UpcomingDateCard, GiftRecommendationCard, feature cards).
- **Hover · cards completamente clicables** (toda la card es Link): `transition-all hover:bg-muted/40 hover:shadow-md hover:-translate-y-0.5`. Sutilmente "el papel se levanta". Ejemplo: `PersonCard`.
- **Hover · cards con acción interna** (la card no es link, pero contiene botón): `transition-shadow hover:shadow-md`. Sin translate ni cambio de fondo. Ejemplo: `GiftRecommendationCard`.
- **Cards estáticas** (sin acción): solo `shadow-sm`, sin hover. Ejemplo: feature cards de la landing.
- **Card de urgencia** (UpcomingDateCard cuando `daysUntil <= 7`): `border-primary/60 shadow-sm bg-primary/5`. El tinte rosado del primary llama la atención sin chillar.

### Buttons

- Variantes shadcn: `default` (terracota), `outline`, `ghost`, `destructive`.
- Tamaños: `sm` para acciones secundarias inline, `default` por defecto, `lg` para CTAs principales.
- **Links que parecen botón**: usar `<Link className={buttonVariants({ ... })}>`. El componente Button de esta app **no soporta `asChild`** porque usa `@base-ui/react` en vez de Radix Slot.

### Badges

- `secondary`: para tags neutros (intereses, etiquetas de fecha).
- `default` (terracota): solo para énfasis o urgencia. Ejemplo: badge del NotificationBell con el contador.
- `outline`: para "+N más" tipo "+3 intereses adicionales".

### Inputs / Forms

- Siempre con `border` visible. Nada de inputs invisibles a la Material.
- Label arriba (`<Label>`), input debajo, error en rojo (`text-destructive`) inmediatamente después con `text-xs`.
- Espaciado entre campos: `space-y-1.5` dentro de un grupo (label + input + error), `space-y-5` entre grupos.

### Avatars

- Tamaño default `size-10`–`size-12` en cards, `size-20`–`size-24` en headers de detalle.
- En headers grandes, añadir `ring-1 ring-border` para definir el contorno sin que pese.
- Si no hay foto, fallback con iniciales (2 letras max, mayúsculas).

### Iconografía

Set único: [`lucide-react`](https://lucide.dev). Stroke 2 (default), tamaño `size-4` (16px) en botones y nav, `size-3.5` en botones `icon-sm`, `size-5` para iconos decorativos en headers.

Iconos en uso:
- `Bell` — campanita de notificaciones.
- `Sun` / `Moon` — toggle de tema.
- `Plus` — crear nueva entidad.
- `Sparkles` — acciones que invocan IA ("Ideas de regalo").
- `Pencil` — editar.
- `Trash2` — eliminar (siempre con `text-destructive`).
- `X` — cerrar / quitar elemento de una lista.

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
- [ ] **Página `/people/[id]/gifts`**: las cards de regalo IA son funcionales pero podrían tener identidad propia (etiqueta "IA", animación al aparecer).
- [ ] **Footer global**: minimal por ahora. Decidir si crece o se queda así.
- [ ] **Skeletons consistentes**: todos en `rounded-2xl` y `border-dashed`, pero verificar dimensiones uniformes.
- [ ] **Mobile < 380px**: sin probar. Hero de landing podría descuadrar.
- [ ] **Tono de los toasts de error** (sonner): voz por defecto, podría tener un tono propio.
- [ ] **Estado de loading global / transiciones de página**: actualmente cada página gestiona el suyo. ¿Vale la pena una skeleton global o no?

---

## Cómo mantener este documento

- Cualquier cambio visual no obvio se anota aquí en el commit donde se introduce.
- Cuando un "Pendiente" se resuelve: pasa a Componentes / Tokens / etc. con su regla, o desaparece si fue descartado.
- Cuando un anti-pattern se descubre: se añade con una frase del por qué, no como dogma.
- Si el documento crece más allá de 250 líneas: hay que partirlo o podar — está rotando.
