# Dudas y decisiones pendientes

Preguntas abiertas del proyecto, y el registro de las que se cerraron.

> Repasado contra el código el 20-sep-2026. Cinco de las siete que figuraban como
> abiertas ya las había respondido la implementación — entre ellas «cero tests»,
> cuando hay 176 — y se han movido abajo con lo que se hizo de verdad.

---

## Abiertas

- [ ] **Compartir personas entre usuarios.**

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

  **Falta decidir — cuatro huecos que las respuestas de arriba no cubren:**

  - **a) Qué pasa cuando el creador borra su cuenta.** El más urgente, porque
    choca con código ya escrito: `account.deleteMyAccount` recorre las personas
    del usuario y las borra en cascada, así que cerrar la cuenta **le arrancaría
    la ficha a los invitados sin avisar**. Salidas: bloquear el borrado mientras
    haya invitados, transferir la propiedad al invitado más antiguo, o avisar y
    borrar igual. _Inclinación: transferir — es lo único que no castiga a un
    tercero por una decisión que no tomó._

  - **b) ¿Las tandas generadas se comparten o son de cada uno?** La decisión 4
    fija de quién es la cuota, no qué pasa con el resultado. La caché está
    indexada por `(clerkUserId, personId, ocasión, tipo)`, así que **por defecto
    cada usuario generaría su propia tanda sobre la misma persona** y dos
    hermanos gastarían dos cuotas para lo mismo. _Inclinación: compartirlas, y
    que regenerar sea explícito — igual que hoy, pero visible para todos._

  - **c) ¿Dónde se avisa de que las notas se comparten?** La decisión 2 es
    correcta, pero hoy el campo lleva un aviso (`AiNotesNotice`) que dice que las
    notas van a la IA de Google y que no escribas nada que no quieras compartir
    **con ella**. Eso fija la expectativa de quien escribe. Si además las lee su
    cuñado, el aviso tiene que decirlo **ahí, donde se escribe**, no solo en
    `/privacidad`. _Inclinación: cambiar el texto del aviso en cuanto exista la
    compartición, no después._

  - **d) ¿El invitado ve la ficha entera?** Las **alergias son datos de salud**,
    categoría especial del art. 9 del RGPD — la misma preocupación que este
    documento ya recoge para el tono de piel del avatar. Compartir la ficha las
    transmite a otra cuenta. No lo hace inviable, pero obliga a elegir entre ficha
    completa o versión recortada, y a escribirlo. _Inclinación: ficha completa,
    porque una alergia oculta es justo lo que provoca el regalo equivocado, pero
    diciéndolo explícitamente al invitar._

  **Coste técnico.** Todo el modelo de permisos cuelga de una columna:
  `clerkUserId` en `people`. Hay **15 comprobaciones de propiedad** repartidas por
  nueve archivos de `convex/`, todas con la forma «¿esta fila es tuya? si no, no
  existe». Compartir convierte esa relación en muchos-a-muchos: hace falta una
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
