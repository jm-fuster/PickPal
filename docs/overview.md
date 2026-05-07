# PickPal — Visión general

App web para recordar fechas importantes y recibir recomendaciones de regalos personalizadas con IA.

## Problema que resuelve

Es fácil olvidar cumpleaños y aniversarios, y cuando se recuerdan a última hora no hay tiempo para pensar en un regalo adecuado. Esta app centraliza todas las fechas importantes de las personas que te importan y, cuando se acerca una, te sugiere regalos adaptados a sus gustos y tu presupuesto.

## Cómo funciona

1. El usuario crea perfiles de personas (amigos, familia, pareja, compañeros…) con sus intereses, notas y presupuesto orientativo.
2. A cada persona se le añaden fechas importantes: cumpleaños, aniversario, graduación, o cualquier fecha personalizada.
3. La app muestra en el dashboard las fechas próximas (filtro de 30/60/90 días) y avisa con un badge en la campanilla.
4. Opcionalmente, el usuario activa **avisos por email** desde Ajustes y elige con cuántos días de antelación quiere recibirlos. Un cron diario en Convex envía un correo agrupado vía Resend cuando los eventos entran exactamente en esa ventana. Detalle completo en [`docs/email-notifications.md`](email-notifications.md).
5. En la página de regalos de cada persona, la IA genera 9 ideas personalizadas con rango de precio y chips de búsqueda en las tiendas favoritas del usuario (Amazon, El Corte Inglés, AliExpress, Miravia, Decathlon, IKEA, PcComponentes).

## Páginas principales

| Ruta | Descripción |
|---|---|
| `/` | Landing pública con CTA de registro |
| `/dashboard` | Fechas próximas con filtro 30/60/90 días |
| `/people` | Grid de todas las personas |
| `/people/new` | Formulario crear persona |
| `/people/[id]` | Detalle: info + fechas importantes |
| `/people/[id]/edit` | Editar persona |
| `/people/[id]/gifts` | Recomendaciones IA para esta persona |
| `/settings` | Días de aviso, notificaciones por correo, preferencias de cuenta |
