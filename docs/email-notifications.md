# Notificaciones por correo

Documento vivo. Captura cómo funciona el envío automático de emails de recordatorio de fechas importantes y todas sus implicaciones operativas. Cuando una decisión cambie, se actualiza este archivo en el mismo commit que toca el código.

---

## Qué hace

Un cron diario de Convex revisa los `userSettings` de todos los usuarios. Para cada usuario que tenga las notificaciones por correo activadas, busca las `importantDates` cuya próxima ocurrencia coincida con **alguna** de las antelaciones marcadas por el usuario (`emailNotifyDaysBefore`, array — opciones: 0 / 2 / 7 / 14 días) y le envía **un único email agrupado** con esos eventos. Cada disparo concreto se identifica por `(importantDateId, occurrenceYear, leadDays)` y se registra en una tabla aparte para no duplicar.

La activación y la antelación son configurables desde `/settings`.

---

## Modelo mental

| Concepto | Significado |
|---|---|
| `userSettings.notifyDaysBefore` | **Ventana visual** de la app (campanita y dashboard). "Muéstrame todo lo que ocurra en los próximos 30 días". |
| `userSettings.emailNotifyDaysBefore` | **Gatillos** del email (array). "Avísame cuando falten 14, 7, 2 días o el mismo día". Opciones permitidas: `[0, 2, 7, 14]`. Default `[14]`. Cada antelación marcada produce un email independiente cuando se alcanza. |
| `userSettings.emailNotificationsEnabled` | Toggle on/off. **Activo por defecto** para nuevos usuarios (si Clerk provee email). |
| `userSettings.email` | Copia local del email del usuario (vino del JWT de Clerk al guardar ajustes). El cron lo lee de aquí, sin volver a pedírselo a Clerk. |
| `emailNotifications` (tabla) | Registro de envíos para deduplicar. Una fila = una ocurrencia notificada. |

**Por qué dos campos de "días"** y no uno solo: la ventana de la campanita es ancha por diseño (muestra muchos eventos por adelantado, scroll cómodo). El email es push y solo dispara una vez por evento. Si compartieran valor, un usuario con `notifyDaysBefore = 60` recibiría correos 60 días antes, lo cual es ruido.

---

## Flujo end-to-end

```
[cron diario 08:00 UTC]
        │
        ▼
internal.emails.runDailyEmailNotifications  (action)
        │
        ├─► internal.notifications.findEventsNeedingEmail  (query)
        │     ├─ recorre userSettings con emailNotificationsEnabled=true
        │     ├─ para cada user, calcula daysUntil de cada importantDate
        │     ├─ filtra eventos cuyo daysUntil ∈ emailNotifyDaysBefore
        │     └─ descarta los ya presentes en emailNotifications(date, year, lead)
        │
        ├─► internal.emails.sendBatchedReminderEmail  (action, una por usuario)
        │     └─ POST https://api.resend.com/emails
        │
        └─► internal.notifications.markEmailsSent  (mutation, si el envío OK)
              └─ inserta filas en emailNotifications
```

Si el envío a un usuario falla (Resend devuelve 4xx/5xx, red caída, etc.), el orquestador **no** marca ese envío como hecho y continúa con el siguiente usuario. Como la ocurrencia sigue sin estar marcada, el cron del día siguiente lo vuelve a intentar — pero ese día ya `daysUntil` no coincidirá con esa antelación concreta y el filtro no matcheará, así que se pierde ese aviso (los demás disparos de la misma fecha siguen funcionando). Asumido conscientemente: simplificar > reintentar (una recuperación robusta requeriría una tabla de "pendientes").

---

## Defaults para nuevos usuarios

Al entrar por primera vez a la app (cualquier ruta autenticada), el componente `UserInitializer` llama a `settings.ensureDefaults`. Esta mutación crea la fila de `userSettings` si no existe, con:

| Campo | Valor por defecto | Condición |
|---|---|---|
| `emailNotificationsEnabled` | `true` | Solo si Clerk provee email. Si no hay email, queda `false`. |
| `emailNotifyDaysBefore` | `[14]` | Siempre. Array — el usuario puede marcar varias antelaciones (0/2/7/14) en `/settings`. |
| `notifyDaysBefore` | `30` | Siempre (ventana visual de campanita) |
| `email` | Del JWT de Clerk | Si está disponible |

`ensureDefaults` es idempotente: si la fila ya existe, no hace nada. Los usuarios que ya han guardado ajustes manualmente no se ven afectados.

---

## Archivos

| Archivo | Rol |
|---|---|
| [`convex/schema.ts`](../convex/schema.ts) | Campos nuevos en `userSettings` y tabla `emailNotifications` con sus índices. |
| [`convex/settings.ts`](../convex/settings.ts) | `getMine` devuelve los nuevos campos + email del JWT. `setMine` valida y los persiste. `ensureDefaults` inicializa la fila al primer acceso. Si se activa el toggle sin email en JWT, lanza error. |
| [`src/components/layout/UserInitializer.tsx`](../src/components/layout/UserInitializer.tsx) | Componente cliente (renderizado en el app layout). Llama a `ensureDefaults` al montar, una vez por sesión autenticada. |
| [`convex/notifications.ts`](../convex/notifications.ts) | Cálculo de próxima ocurrencia (recurrente / no recurrente), matching contra antelación, dedup vs. `emailNotifications`. Exporta el tipo `EventToNotify` (incluye `personId` para el CTA del email). |
| [`convex/emails.ts`](../convex/emails.ts) | Llama a Resend (vía `fetch`, sin SDK) y orquesta el cron diario. Construye HTML inline en español con diseño visual propio (ver sección "Plantilla de email"). |
| [`convex/crons.ts`](../convex/crons.ts) | `crons.cron("0 8 * * *", ...)` — diario a las 08:00 UTC. |
| [`src/app/(app)/settings/page.tsx`](../src/app/%28app%29/settings/page.tsx) | UI: toggle + grid de checkboxes con las antelaciones (0/2/7/14) + email destino visible. |

---

## Plantilla de email

El HTML se genera en `convex/emails.ts` (`buildHtml()`). No usa React Email ni ninguna librería externa — es una cadena de template literal con tabla HTML para compatibilidad con clientes de correo.

### Estructura visual

```
┌─────────────────────────────────────────┐
│  Header verde (#2D4033)                 │
│  "PickPal"  ·  "Recordatorio de evento" │
├─────────────────────────────────────────┤
│  Fondo crema (#FBF7EE)                  │
│  "Tienes un evento próximo:"            │
│  ┌─ card por evento ─────────────────┐  │
│  │  Nombre (negrita) · Etiqueta      │  │
│  │  dd/mm · "en X días" (terracota)  │  │
│  └───────────────────────────────────┘  │
│  [ Botón CTA ]                          │
├─────────────────────────────────────────┤
│  Footer crema · texto opt-out           │
└─────────────────────────────────────────┘
```

### Paleta

Los tokens del design system se traducen a hex porque los clientes de correo no soportan CSS variables ni `oklch`.

| Token app | Hex en email | Uso |
|---|---|---|
| `--primary` | `#2D4033` | Fondo header, fondo botón CTA |
| `--background` | `#FBF7EE` | Fondo body y footer |
| `--secondary` | `#D97757` | Texto del countdown ("en X días") |
| `--foreground` | `#3D2E1E` | Texto principal del body |
| `--border` | `#E0D5C5` | Borde de cards y secciones |
| muted | `#9A8A75` | Texto secundario, footer |

### Botón CTA

- **1 evento** → `"Generar ideas de regalo para {personName}"` → `https://pickpal-app.vercel.app/people/{personId}`
- **N eventos** → `"Ver mis eventos próximos"` → `https://pickpal-app.vercel.app/people`

El `personId` viene del tipo `EventToNotify` (campo añadido en `convex/notifications.ts`). El loop sobre personas ya tenía el ID disponible; solo había que propagarlo.

La URL base está hardcodeada como constante `APP_BASE_URL = "https://pickpal-app.vercel.app"` en `emails.ts`. Si el dominio cambia, actualizar ahí.

### Footer

> Si no quieres seguir recibiendo estos recordatorios, desactívalos en tus [ajustes](https://pickpal-app.vercel.app/settings) de PickPal.

"ajustes" enlaza a `/settings`. Texto en minúsculas deliberadamente — registro conversacional.

---

## Cálculo de próxima ocurrencia

Misma lógica que `importantDates.getUpcoming`, replicada en [`convex/notifications.ts`](../convex/notifications.ts):

- **No recurrente** (`recurring === false`): si tiene `year` y aún no ha pasado, `daysUntil` desde hoy. Si no hay `year` o ya pasó → la fecha no entra al cálculo.
- **Recurrente** (default): se prueba con el aniversario de este año. Si ya pasó, salta al del año siguiente. `occurrenceYear` es el año real de la ocurrencia (clave para deduplicar).

El cálculo se hace **siempre en UTC** (`Date.UTC(...)`) para que el cron, que corre en horario UTC, no se desfase por DST.

---

## Variables de entorno

Viven en el **deployment de Convex**, no en Next.js, porque solo las consume el backend.

```bash
npx convex env set RESEND_API_KEY re_xxxxxxxxxxxxx
npx convex env set EMAIL_FROM "PickPal <onboarding@resend.dev>"   # opcional
```

Para el deployment de producción se añade `--prod` a cada comando.

| Variable | Obligatoria | Default | Notas |
|---|---|---|---|
| `RESEND_API_KEY` | **sí** | — | API key de Resend. Sin ella, `sendBatchedReminderEmail` lanza error. |
| `EMAIL_FROM` | no | `PickPal <onboarding@resend.dev>` | Remitente. El sandbox de Resend solo manda al email de la cuenta dueña. Para enviar a cualquiera hay que verificar dominio en Resend. |

---

## Requisitos en Clerk

El JWT template `convex` debe incluir el claim `email`. Sin él:

- `setMine` lanza `"No encontramos tu email..."` cuando se activa el toggle.
- El cron no puede determinar el destinatario del usuario.

Configuración en Clerk Dashboard → Configure → JWT Templates → convex:

```json
{
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.email_verified}}"
}
```

> Si más adelante se quiere exigir solo emails verificados, el filtro se haría en `setMine` leyendo `identity.emailVerified`.

---

## Cadencia y modelo de envíos

- **Una ejecución diaria** del cron a las **08:00 UTC** (10:00 verano / 09:00 invierno en España peninsular). Hora elegida para que el correo llegue en horario de mañana sin invadir madrugadas.
- **Un email por usuario** que tenga eventos disparando ese día. Si un usuario tiene 3 cumples a 7 días vista, recibe 1 correo con los 3, no 3 correos.
- **Sin reintentos automáticos** (ver "Flujo end-to-end").
- **Recordatorios escalonados (multi-trigger)**: el usuario puede marcar varias antelaciones (0/2/7/14) en `/settings`. Cada antelación marcada genera un email independiente cuando se alcanza. La dedupe es por `(importantDateId, occurrenceYear, leadDays)`, así que los avisos a 14 y a 7 días para la misma ocurrencia coexisten sin bloquearse.

---

## Seguridad

Resumen — el detalle vive en [`docs/security.md`](security.md).

- Funciones de envío y query de eventos son **`internal*`** — nunca expuestas en `api.*`. Solo el cron las puede invocar.
- El email destino se lee del JWT de Clerk en `setMine`. **Nunca** se acepta como argumento del cliente; eso permitiría a un usuario malicioso enviar correos a cuentas ajenas con plantilla de PickPal.
- `emailNotifications` lleva `clerkUserId` en todas sus filas. Cualquier query futura sobre la tabla debe filtrar por usuario (`by_user`) — no exponer índices que crucen usuarios.
- El cron corre 1 vez/día y la dedup `(importantDateId, occurrenceYear)` impide duplicados, así que no necesita rate limit. Si en algún momento se añade un endpoint manual "enviar email de prueba", aplicar `checkAndIncrement` con bucket `email_test` (sugerido: 5/día).
- `RESEND_API_KEY` es secret server-only; vive en el entorno de Convex, **no** en `NEXT_PUBLIC_*`.

---

## Privacidad

- El email del usuario se almacena en `userSettings.email` por dos razones: (1) evitar que el cron tenga que llamar a la API de Clerk en cada ejecución, (2) tener un valor estable aunque cambie el JWT.
- Si el usuario desactiva el toggle, el campo `email` **se conserva** (no se borra en `setMine`). Esto permite reactivar sin volver a forzar Save desde un cliente con JWT fresco. Si en el futuro hay tema de RGPD que exija borrarlo, hay que añadir lógica explícita.
- El cuerpo del email contiene nombres de personas y etiquetas de eventos del usuario — son datos del propio usuario y van a su email, no se filtran a terceros. Resend almacena los emails enviados durante un tiempo en su panel; revisar [política de Resend](https://resend.com/legal/privacy-policy) si la app crece.

---

## Costes y límites

- **Resend free tier**: 3.000 emails/mes, 100/día. Con un usuario y la mayoría de eventos siendo cumpleaños anuales, el consumo real es bajísimo (≤ N personas × 1 email/año por persona).
- **Cron de Convex**: incluido en el plan free. Una ejecución/día.
- **Crecimiento**: el límite duro lo marca Resend. Con 100 usuarios y 5 eventos/usuario, sigue cabiendo holgadamente. Si se acerca, paso lógico es plan de pago de Resend o cambiar a Postmark/SES.

---

## Operativa

### Probar manualmente sin esperar al cron

**Opción A — disparo real del cron** (requiere que haya eventos con `daysUntil === emailNotifyDaysBefore` hoy):

```bash
# dev
npx convex run emails:runDailyEmailNotifications

# prod
npx convex run emails:runDailyEmailNotifications --prod
```

**Opción B — email de prueba visual** (envía a cualquier email con datos reales del usuario, sin condición de días):

Crear temporalmente `convex/emailTest.ts` con una action pública que llame a `internal.emails.sendBatchedReminderEmail` usando IDs reales consultados desde la base de datos. Ejemplo mínimo:

```ts
export const sendTestReminderEmail = action({
  args: { to: v.optional(v.string()) },
  handler: async (ctx, { to }) => {
    // consultar un usuario + persona + fecha reales del deployment
    // llamar a internal.emails.sendBatchedReminderEmail con esos datos
  },
});
```

```bash
npx convex dev --once
npx convex run emailTest:sendTestReminderEmail
```

**Importante**: borrar `emailTest.ts` tras la prueba. No commitear — es scaffolding temporal. Los IDs del dev deployment no existen en prod (la pantalla de error al pulsar el CTA en el email de prueba es esperada y no es un bug).

### Logs

```bash
npx convex logs           # dev
npx convex logs --prod    # prod
```

El orquestador imprime al final un resumen `[emails] Cron diario: X usuario(s) notificados, Y fallo(s).` y un `console.error` por cada usuario que falló.

### Inspeccionar qué eventos disparan hoy

```bash
npx convex run notifications:findEventsNeedingEmail
```

Devuelve la lista que el orquestador tomaría como entrada, **sin enviar** nada. Útil para depurar por qué no llega un correo (¿falta el toggle? ¿falta email en JWT? ¿la fecha no matchea la antelación? ¿ya estaba en `emailNotifications`?).

### Forzar un reenvío

Si por alguna razón hay que reenviar un aviso ya marcado como enviado, hay que borrar la fila correspondiente de `emailNotifications` desde el dashboard de Convex (Tables → emailNotifications → eliminar fila por `(importantDateId, occurrenceYear)`) y luego relanzar `emails:runDailyEmailNotifications`.

---

## Limitaciones conocidas y decisiones "ahora no"

- **Sin reintentos**: ver "Flujo end-to-end".
- **Sin email de prueba desde Ajustes**: cuando lo haya, requiere bucket de rate limit. De momento, ver "Opción B" en la sección de operativa.
- **Sin localización**: el correo va siempre en español, igual que el resto de la app.
- **Sin opciones por evento**: el toggle es global. No se puede silenciar el recordatorio de una persona o evento concreto.
- **Sin verificación de email**: si el JWT trae `email_verified=false`, hoy no se rechaza. Aceptable mientras Clerk no permita registros sin verificar; revisar si cambia.
- **Sandbox de Resend**: hasta verificar dominio, los correos solo llegan al email de la cuenta dueña en Resend. Documentado, asumido para uso personal.
