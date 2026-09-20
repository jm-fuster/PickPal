# Dudas y decisiones pendientes

Preguntas abiertas del proyecto, y el registro de las que se cerraron.

> Repasado contra el código el 20-sep-2026. Cinco de las siete que figuraban como
> abiertas ya las había respondido la implementación — entre ellas «cero tests»,
> cuando hay 176 — y se han movido abajo con lo que se hizo de verdad.

---

## Abiertas

- [ ] **La ventana de la campana no se puede cambiar desde la app.**
  `notifyDaysBefore` existe en `userSettings`, el servidor acepta de 1 a 365 y el
  default es 30, pero **ninguna pantalla lo expone**: `/settings` no tiene ese
  control. O se añade, o se quita el campo y se fija en 30. Lo que no conviene es
  dejar un ajuste que solo se puede tocar por API.
  (Distinto de la antelación del **email**, que sí es configurable: 0, 2, 7 y 14
  días, y se pueden marcar varios.)

- [ ] **Compartir personas entre usuarios.**
  Ej.: la ficha de los padres, compartida entre hermanos. Cada persona pertenece
  hoy a un único usuario (`clerkUserId` en `people`), y todo el modelo de permisos
  cuelga de esa columna. Abrirlo obliga a repensar la comprobación de propiedad
  que hoy hace cada función de Convex, así que no es un cambio pequeño.

- [ ] **Exportación de datos.**
  `/privacidad` promete enviarla a mano si alguien la pide, porque no existe en el
  código. Cumple, pero es una obligación manual con un mes de plazo. Automatizarla
  quitaría ese riesgo.

---

## Decididas, no pendientes

- **Internacionalización: no, por ahora.** La app es solo en español, sin capa de
  i18n, y está pensada para España (euros, tiendas españolas, prompts en
  español). No es un descuido: añadir i18n obligaría a traducir también los
  prompts y el catálogo de intereses, y a decidir mercado por mercado qué tiendas
  tienen sentido. Si algún día se abre, el sitio por donde empezar es
  `src/lib/stores.ts` y `src/lib/interests.ts`.

---

## Resueltas

- [x] **¿Se guardan las recomendaciones o se regeneran cada vez?** Se guardan. La
  tabla `recommendations` las cachea por `(usuario, persona, ocasión, tipo de
  regalo)` — índice `by_user_person_occasion_type` —, así que volver a abrir una
  tanda ya generada no gasta cuota. Regenerar es una acción explícita, y la propia
  UI avisa de que consume cuota.

- [x] **¿Avisos por email además del badge?** Sí, implementados y **apagados de
  fábrica**, porque la base legal declarada es el consentimiento. Cron diario a
  las 08:00 UTC, envío por la API REST de Resend, un único correo agrupado por
  usuario y deduplicación por `(fecha, año, antelación)`. Detalle en
  [`email-notifications.md`](email-notifications.md).

- [x] **¿Presupuesto por persona o por fecha?** Por fecha. `budgetMin` y
  `budgetMax` viven en `importantDates`, no en `people`, que es lo que permite
  gastar distinto en un cumpleaños que en un detalle de Navidad. Se guarda en
  céntimos.

- [x] **¿Testing automatizado?** Sí: 176 tests con Vitest en 13 archivos, y desde
  el 20-sep-2026 cubren también `convex/` con `convex-test` — propiedad entre
  usuarios, los cuatro cubos de límite, el secreto compartido de la cuota, el
  borrado en cascada y la revalidación de lo que devuelve el modelo. Los de
  `convex/` piden `environment: "edge-runtime"` con una directiva por archivo;
  el resto sigue en `node`. CI los corre en cada push y PR junto a dos
  typechecks (`tsc --noEmit` y el de `convex/tsconfig.json`, que tiene el suyo).

- [x] **Nombre de la app:** PickPal. Repo: `jm-fuster/PickPal`. Proyectos en Clerk
  y Convex también `pickpal`. _Renombrado desde «Giftly» el 2026-05-04 por
  colisión con apps existentes._

- [x] **Modo oscuro.** `next-themes` con estrategia de clase, claro por defecto.

- [x] **Landing page pública.** Tres pasos numerados y CTA dual (registro /
  login). Si ya tienes sesión, redirige a `/agenda`.

- [x] **Rate limiting en `/api/recommendations`.** 10 generaciones por usuario y
  día UTC en `recommendationUsage`, con reserva atómica antes de llamar al modelo
  y devolución si algo falla. Hay además tres cubos genéricos en
  `rateLimitBuckets`: 50 personas, 100 fechas y 50 ideas guardadas al día.

- [x] **Manejo del 29 de febrero.** En años no bisiestos cae al 28 (`src/lib/dates.ts`).

- [x] **Hosting / despliegue.** Vercel con auto-deploy desde `main`, más Convex.
  Dominio `pickpal.jorgemolinafuster.com`, que es también el dominio de envío
  verificado en Resend. Alias previos: `pickpal-app.vercel.app`,
  `giftly-blond.vercel.app`. El correo **entrante** va por otro lado: Cloudflare
  Email Routing sobre el apex `jorgemolinafuster.com`, porque el subdominio es un
  CNAME a Vercel y un CNAME excluye los MX.
