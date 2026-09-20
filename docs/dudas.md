# Dudas y decisiones pendientes

Preguntas abiertas del proyecto, y el registro de las que se cerraron.

> Repasado contra el código el 20-sep-2026. Cinco de las siete que figuraban como
> abiertas ya las había respondido la implementación — entre ellas «cero tests»,
> cuando hay 176 — y se han movido abajo con lo que se hizo de verdad.

---

## Abiertas

- [ ] **Compartir personas entre usuarios.** — *diseño cerrado el 20-sep-2026;
  lo que queda es construirlo, no decidirlo.*

  El caso: tres hermanos comparten la ficha de sus padres. Hoy cada uno la crea
  por su cuenta y lleva su propio historial, sin saber qué regalaron los otros.
  Lo mismo para una pareja con los amigos comunes.

  **Lo que de verdad lo justifica** no es ahorrarse teclear la ficha dos veces:
  es que el historial alimenta la generación. Compartirlo hace que la IA deje de
  proponer la misma taza que ya regaló tu hermana. Sin eso, compartir es poco más
  que una comodidad.

  **Decidido (Jorge, 20-sep-2026):**

  1. **Borra solo quien la creó.** El invitado puede desligarse para dejar de
     verla, pero no borrarla para todos.
  2. **Las notas se ven.** Es la información que hace útil colaborar, y ocultarlas
     dejaría la ficha compartida a medias.
  3. **Historial conjunto, con autoría**: cada regalo queda asociado a quien lo
     hizo. Barato: `giftHistory` ya lleva `clerkUserId`; hoy significa «el dueño»
     y pasaría a significar «quién lo registró».
  4. **La cuota es de quien genera.** Ya funciona así: `recommendationUsage` está
     indexada por `clerkUserId`. Cero trabajo.
  5. **`/privacidad` hay que actualizarla.**

  **Decidido también, tras revisar los huecos que dejaban las cinco primeras:**

  6. **Si el creador borra su cuenta, la propiedad se transfiere** al invitado más
     antiguo. Bloquear el borrado no es opción —irse es un derecho RGPD, no un
     permiso— y borrar en cascada castigaría a un tercero por una decisión que no
     tomó. Toca `account.deleteMyAccount`, que hoy arrastra las personas del
     usuario sin mirar si están compartidas.
  7. **Las tandas generadas NO se comparten.** Cada usuario genera las suyas. La
     razón no es el coste —10 al día es holgado— sino que una tanda es material de
     trabajo: depende del tipo de regalo que elijas y de lo que hayas descartado
     antes, que son decisiones tuyas. Lo que se comparte es el resultado curado,
     no el borrador. Además es lo que ya hace el índice
     `by_user_person_occasion_type`, así que cuesta cero.
  8. **El aviso de las notas cambia en el mismo commit que la compartición**, no
     después. Hoy `AiNotesNotice` dice «no escribas nada que no quieras compartir
     con ella» refiriéndose a la IA, y eso fija la expectativa de quien escribe.
     Cambiar quién lo lee sin cambiar el aviso sería una traición a esa promesa.
  9. **El invitado ve la ficha entera**, y se le dice al invitar. Una alergia
     oculta es exactamente lo que provoca el regalo equivocado, que es el problema
     que resuelve la app. Pero son datos de salud (art. 9 RGPD), así que la
     pantalla de invitar tiene que decir qué se está compartiendo **antes** de
     compartirlo, no enterrarlo en `/privacidad`.

  10. **Las ideas guardadas SÍ se comparten**, con autoría como el historial. Es
     la pieza que hace que compartir valga la pena: ver que tu hermana ya tiene
     apalabrado el rodillo de cerámica **antes** de comprarlo tú. Sin esto la
     coordinación llega a toro pasado, cuando el regalo ya está hecho, que es
     tarde justo para lo que justificaba la función. Contrapartida aceptada: entre
     quienes comparten la ficha se acaba la sorpresa. `savedIdeas` ya tiene los
     dos índices necesarios (`by_person` y `by_user`).

  **Coste técnico.** Todo el modelo de permisos cuelga de una columna:
  `clerkUserId` en `people`. Hay **15 comprobaciones de propiedad**, todas con la forma
  «¿esta fila es tuya? si no, no existe», repartidas por cinco archivos:
  `giftHistory.ts` (4), `people.ts` (3), `recommendations.ts` (3),
  `savedIdeas.ts` (3) e `importantDates.ts` (2). Compartir convierte esa relación en muchos-a-muchos: hace falta una
  tabla de enlace `(personId, clerkUserId, rol)` y reescribir las quince para que
  consulten propiedad **o** invitación. La parte buena es que esas quince están
  cubiertas por `convex/auth.test.ts`, así que el cambio no sería a ciegas.

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

- [x] **Exportación de datos.** Hecha el 20-sep-2026. Era una obligación legal
  (RGPD art. 20) que `/privacidad` cumplía prometiendo enviarla a mano, con un
  mes de plazo y todo el trabajo recayendo en una persona. Ahora Ajustes →
  «Descargar mis datos» da un JSON al momento. `convex/exportData.ts` recorre
  las mismas nueve tablas que `account.deleteMyAccount`, con los datos anidados
  bajo cada ser querido, y un test compara los dos recorridos: añadir una tabla
  al borrado sin añadirla a la exportación hace fallar la suite.

- [x] **La ventana de la campana ya se puede cambiar.** `notifyDaysBefore` llevaba
  desde el principio en `userSettings`, validado de 1 a 365 en el servidor, y
  hasta el 20-sep-2026 **ninguna pantalla lo exponía**: solo se podía tocar por
  API. Se resolvió exponiéndolo, no quitándolo: el backend estaba entero y
  borrar el campo habría pedido una migración de schema para eliminar una
  capacidad que funcionaba. `/settings` ofrece cinco presets (7, 15, 30, 60 y 90
  días) en lugar de un campo numérico libre, así que no hay estado inválido
  posible aunque el servidor acepte todo el rango. (Distinto de la antelación del
  **email**, que es un selector múltiple de 0, 2, 7 y 14 días.)

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
