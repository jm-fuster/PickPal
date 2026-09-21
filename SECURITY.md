# Security Policy · Política de seguridad

> **Do not open a public issue for a security bug.** Use the
> [private advisory form](https://github.com/jm-fuster/PickPal/security/advisories/new)
> or write to [pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com).
>
> **No abras una issue pública para un fallo de seguridad.** Usa el
> [aviso privado de GitHub](https://github.com/jm-fuster/PickPal/security/advisories/new)
> o escribe a [pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com).

[**English**](#english) · [**Español**](#español)

---

## English

PickPal is a free personal project with one maintainer. There is no bounty
programme and no service level agreement, but security reports are taken
seriously, and they come before anything else in this repository.

### Reporting a vulnerability

**Do not open a public issue.** Email
**[pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com)** with
*security* in the subject, or use the
[private advisory form](https://github.com/jm-fuster/PickPal/security/advisories/new).
The advisory form is the one I prefer, because it keeps the thread next to the
code.

It helps a lot to include:

- What breaks, and what someone gets out of exploiting it.
- Steps to reproduce it, or an example request.
- The version or commit you saw it on.

### What to expect

| | |
|---|---|
| Acknowledgement | Within 72 hours |
| First assessment | Within 7 days |
| Fix | Depends on severity; I keep you posted |

If you want to publish it, please wait until a fix is deployed. If I have not
answered in a week, chase me: it will have got buried, not ignored.

### Scope

Anything in this repository and in the deployment at
`pickpal.jorgemolinafuster.com`. The ones I care about most:

- **Reading another user's data.** Every Convex function checks ownership with
  `requireUser` and the document's `clerkUserId`. If you find one that does not,
  that is serious.
- **Getting past the default-deny proxy** (`src/proxy.ts`) to reach an
  authenticated route.
- **Getting past the rate limits**, above all the AI quota reservation, which is
  guarded by a shared secret so a browser client cannot refund quota to itself.
- **Injection through what the model returns.** Everything is re-validated
  server-side in `convex/validators.ts`, and that is where to look for gaps.
- **Data reaching third parties** (Google, Pexels, Brandfetch, Resend) beyond
  what [`/privacidad`](https://pickpal.jorgemolinafuster.com/privacidad)
  declares.

Out of scope is what I do not control: vulnerabilities in Clerk, Convex, Vercel
or Google — report those to them — and automated scanner output with no
demonstrated impact.

### What I already know

[`docs/security.md`](docs/security.md) is the long version: the trust model, the
mandatory patterns and, in particular, a section titled *«Lo que NO está
implementado todavía»* listing what I decided on purpose not to do. If what you
found is in there, it is probably a limitation I accepted rather than a finding
— though if you think I got the assessment wrong, tell me anyway. **That
document is in Spanish**, like the rest of `docs/`.

### The data at stake

The app stores data about **other people** that the user typed in: the names,
interests, notes, sizes and allergies of their loved ones. Any bug that exposes
that data counts as serious by default, even if it reaches a single account.
What gets processed is described at
[`/privacidad`](https://pickpal.jorgemolinafuster.com/privacidad) (in Spanish),
and anyone who wants to exercise their rights can write to the address above.

---

## Español

PickPal es un proyecto personal y gratuito, mantenido por una sola persona. No hay
programa de recompensas ni acuerdo de nivel de servicio, pero los avisos de
seguridad se atienden en serio y con prioridad sobre cualquier otra cosa del
repositorio.

### Cómo reportar una vulnerabilidad

**No abras una issue pública.** Escribe a
**[pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com)** con
«seguridad» en el asunto, o usa el
[aviso privado de GitHub](https://github.com/jm-fuster/PickPal/security/advisories/new),
que es la vía preferida porque deja el hilo junto al código.

Ayuda mucho incluir:

- Qué falla y qué se puede conseguir aprovechándolo.
- Pasos para reproducirlo, o una petición de ejemplo.
- La versión o el commit sobre el que lo has visto.

### Qué puedes esperar

| | |
|---|---|
| Acuse de recibo | En 72 horas |
| Primera valoración | En 7 días |
| Arreglo | Depende de la gravedad; te mantengo al tanto |

Si quieres publicarlo, te pido que esperes a que haya un arreglo desplegado. Si no
respondo en una semana, insiste: será que se me ha traspapelado, no que lo esté
ignorando.

### Alcance

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

### Lo que ya sabemos

[`docs/security.md`](docs/security.md) es el documento largo: el modelo de
confianza, los patrones obligatorios y, en particular, una sección **«Lo que NO
está implementado todavía»** con las decisiones conscientes de no hacer algo. Si
lo que has encontrado está ahí, probablemente sea una limitación asumida y no un
hallazgo — aunque si crees que la valoración es incorrecta, dímelo igual.

### Tratamiento de datos

La app guarda datos de **terceros** que introduce el usuario: nombres, intereses,
notas, tallas y alergias de sus seres queridos. Cualquier fallo que exponga esos
datos se considera grave por defecto, aunque el usuario afectado sea solo uno.
El tratamiento está descrito en
[`/privacidad`](https://pickpal.jorgemolinafuster.com/privacidad), y quien quiera
ejercer sus derechos puede escribir a la misma dirección de arriba.
