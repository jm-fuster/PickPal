# Gift Reminder App — Visión general

App web para recordar fechas importantes y recibir recomendaciones de regalos personalizadas con IA.

## Problema que resuelve

Es fácil olvidar cumpleaños y aniversarios, y cuando se recuerdan a última hora no hay tiempo para pensar en un regalo adecuado. Esta app centraliza todas las fechas importantes de las personas que te importan y, cuando se acerca una, te sugiere regalos adaptados a sus gustos y tu presupuesto.

## Cómo funciona

1. El usuario crea perfiles de personas (amigos, familia, pareja, compañeros…) con sus intereses, notas y presupuesto orientativo.
2. A cada persona se le añaden fechas importantes: cumpleaños, aniversario, graduación, o cualquier fecha personalizada.
3. La app muestra en el dashboard las fechas próximas (filtro de 30/60/90 días) y avisa con un badge en la campanilla.
4. En la página de regalos de cada persona, la IA genera 6 ideas personalizadas con rango de precio y enlace directo a Amazon para comprar.

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
| `/settings` | Días de aviso, preferencias de cuenta |
