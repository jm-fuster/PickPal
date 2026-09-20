# Política de seguridad

PickPal es un proyecto personal y gratuito, mantenido por una sola persona. No hay
programa de recompensas ni acuerdo de nivel de servicio, pero los avisos de
seguridad se atienden en serio y con prioridad sobre cualquier otra cosa del
repositorio.

## Cómo reportar una vulnerabilidad

**No abras una issue pública.** Escribe a
**[pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com)** con
«seguridad» en el asunto, o usa el
[aviso privado de GitHub](https://github.com/jm-fuster/PickPal/security/advisories/new),
que es la vía preferida porque deja el hilo junto al código.

Ayuda mucho incluir:

- Qué falla y qué se puede conseguir aprovechándolo.
- Pasos para reproducirlo, o una petición de ejemplo.
- La versión o el commit sobre el que lo has visto.

## Qué puedes esperar

| | |
|---|---|
| Acuse de recibo | En 72 horas |
| Primera valoración | En 7 días |
| Arreglo | Depende de la gravedad; te mantengo al tanto |

Si quieres publicarlo, te pido que esperes a que haya un arreglo desplegado. Si no
respondo en una semana, insiste: será que se me ha traspapelado, no que lo esté
ignorando.

## Alcance

Entra dentro cualquier cosa de este repositorio y del despliegue en
`pickpal.jorgemolinafuster.com`. Interesan especialmente:

- Acceso a datos de otro usuario. Cada función de Convex comprueba propiedad con
  `requireUser` y el `clerkUserId` del documento; si encuentras una que no lo
  haga, es un fallo serio.
- Saltarse el proxy de denegación por defecto (`src/proxy.ts`) para llegar a una
  ruta autenticada.
- Saltarse los límites de uso, sobre todo la reserva de cuota de IA, que está
  protegida por un secreto compartido para que un cliente del navegador no pueda
  devolverse cuota a sí mismo.
- Inyección a través de lo que devuelve el modelo. Todo se revalida en el
  servidor en `convex/validators.ts`, y ahí es donde hay que buscar huecos.
- Fuga de datos hacia terceros (Google, Pexels, Brandfetch, Resend) más allá de
  lo que declara [`/privacidad`](https://pickpal.jorgemolinafuster.com/privacidad).

Queda fuera lo que no controlo: vulnerabilidades de Clerk, Convex, Vercel o Google
—repórtalas a ellos—, y los resultados de escáneres automáticos sin un impacto
demostrado.

## Lo que ya sabemos

[`docs/security.md`](docs/security.md) es el documento largo: el modelo de
confianza, los patrones obligatorios y, en particular, una sección **«Lo que NO
está implementado todavía»** con las decisiones conscientes de no hacer algo. Si
lo que has encontrado está ahí, probablemente sea una limitación asumida y no un
hallazgo — aunque si crees que la valoración es incorrecta, dímelo igual.

## Tratamiento de datos

La app guarda datos de **terceros** que introduce el usuario: nombres, intereses,
notas, tallas y alergias de sus seres queridos. Cualquier fallo que exponga esos
datos se considera grave por defecto, aunque el usuario afectado sea solo uno.
El tratamiento está descrito en
[`/privacidad`](https://pickpal.jorgemolinafuster.com/privacidad), y quien quiera
ejercer sus derechos puede escribir a la misma dirección de arriba.
