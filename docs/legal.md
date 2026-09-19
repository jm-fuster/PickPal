# Aviso legal y términos · PickPal

**Casi listo, pero aún no publicable.** Titular y email de contacto ya están puestos. Queda un solo hueco, la fecha de «Última actualización» de arriba, que se pone el día que esto se publique. NIF, domicilio, datos registrales y ciudad de jurisdicción **se han retirado a propósito**: el porqué y el disparador que obliga a revisarlo están en §1. Las secciones marcadas con _Revisar_ siguen requiriendo decisión consciente.

> **Bloqueo real antes de publicar (20-sep-2026):** `pickpal@jorgemolinafuster.com` **todavía no recibe correo** — el dominio no tiene registros MX. Es la vía por la que un tercero ejerce sus derechos RGPD, con un mes de plazo para responder, así que publicar estas páginas con una dirección que rebota sería peor que el texto de beta que hay ahora. Montar el reenvío (Cloudflare Email Routing, gratis, el dominio ya está en Cloudflare) y **comprobar que entrega** antes de sustituir el contacto en `/terminos` y `/privacidad`.

Última actualización: `{{FECHA_PUBLICACION}}`

> Cuando se publique la app, este contenido debe servirse en `/legal` (o separado en `/aviso-legal` y `/terminos`) y enlazarse desde el footer.

---

## 1. Información del titular

Datos identificativos y canal de contacto del titular del servicio:

- **Titular:** Jorge Molina Fuster
- **Email de contacto:** [pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com)

> **Por qué no figuran NIF ni domicilio: es una decisión del 20-sep-2026, no un hueco olvidado.** El art. 10 obliga a publicarlos, pero solo a los «prestadores de servicios de la sociedad de la información», que el Anexo de la propia LSSI define como servicios prestados normalmente **a título oneroso** — incluidos los gratuitos para el usuario **cuando constituyen una actividad económica para el prestador**. PickPal hoy no lo es: no cobra, no tiene suscripción, no muestra publicidad y **sus enlaces a tiendas son búsquedas sin etiqueta de afiliado** (verificado en [`src/lib/stores.ts`](../src/lib/stores.ts) y sus tests). Siendo el titular una persona física, su NIF y su domicilio particular son datos personales sensibles, y no se publican sin que la norma lo exija.
>
> **Disparador que obliga a revisar esto:** el día que PickPal ingrese algo por cualquier vía — suscripción, publicidad, patrocinio o **una etiqueta de afiliado añadida a los enlaces de tienda**, que es la manera más fácil de entrar en el supuesto sin darse cuenta. Ese día vuelven a ser obligatorios el NIF, el domicilio y los datos registrales si hay sociedad. Para el domicilio, la salida habitual de una persona física es un apartado de correos o una dirección profesional, no la vivienda.
>
> El RGPD, que sí aplica de lleno, **no pide el NIF**: le bastan la identidad y un canal de contacto que funcione (art. 13).

---

## 2. Objeto

PickPal es una aplicación web que permite al usuario guardar información sobre personas de su entorno (intereses, fechas señaladas, notas) y obtener recomendaciones personalizadas de regalo generadas por inteligencia artificial.

El uso de PickPal está sujeto a los presentes términos y a la [política de privacidad](privacy.md).

---

## 3. Aceptación

Al registrarse y utilizar PickPal, el usuario acepta estos términos. Si no está de acuerdo, no debe registrarse ni utilizar el servicio.

---

## 4. Cuenta de usuario

- Para usar PickPal hay que registrarse con **Google** o con **correo electrónico y contraseña**.
- El usuario es responsable de mantener la confidencialidad de sus credenciales.
- El usuario debe ser **mayor de 14 años**. Para menores de 14 se requiere consentimiento de sus tutores legales (RGPD art. 8 + LOPDGDD art. 7).

---

## 5. Uso aceptable

El usuario se compromete a:

- No introducir datos de terceros sin tener una relación personal legítima con ellos.
- No introducir datos sensibles (ideología, religión, orientación sexual, salud, etc., art. 9 RGPD) en las notas. **Excepción acotada:** el campo "alergias o restricciones" existe precisamente para lo imprescindible (una alergia alimentaria, un material que no puede llevar) y se envía a Gemini; los términos piden anotar el mínimo que evite un regalo inservible, no un historial médico. Redactarlo como prohibición absoluta contradecía un campo que la propia app ofrece — ver `privacy.md` §4.1.
- No usar la app para fines ilícitos, ofensivos o que vulneren derechos de terceros.
- No intentar saltarse las medidas de seguridad, los rate limits ni acceder a datos de otros usuarios.
- No automatizar el uso del servicio mediante bots o scraping.

El incumplimiento puede conllevar la suspensión o eliminación de la cuenta.

---

## 6. Recomendaciones generadas por IA

Las ideas de regalo se generan con un modelo de lenguaje (Google Gemini) a partir de los datos introducidos por el usuario.

- Las sugerencias son **orientativas**: precios, disponibilidad y descripciones pueden no ser exactos.
- Los enlaces a Amazon son búsquedas: no garantizan la existencia ni el precio del producto.
- PickPal **no se hace responsable** de compras realizadas a partir de las recomendaciones.
- Para generar las ideas se envía a Google (Gemini) la ficha completa de la persona: nombre de pila (nunca apellidos), relación, intereses, marcas, notas íntegras, tallas, alergias/restricciones, dislikes, presupuesto, ocasión e historial de regalos. PickPal usa actualmente la capa gratuita de esa API, en la que Google puede usar esos datos para mejorar sus servicios y revisores humanos pueden leerlos; el detalle campo a campo está en la [política de privacidad](privacy.md) (§4.1). No basta con decir "los datos necesarios": el usuario tiene que poder saber que sus notas libres salen del sistema.

---

## 7. Propiedad intelectual

- El código de PickPal se distribuye bajo licencia MIT (ver [`LICENSE`](../LICENSE)).
- La marca, el diseño y el contenido editorial son propiedad de **Jorge Molina Fuster**.
- Los datos introducidos por el usuario son **del usuario**. PickPal los procesa en los términos descritos en la política de privacidad.

---

## 8. Disponibilidad y modificaciones del servicio

- PickPal se ofrece "tal cual" y "según disponibilidad". No garantizamos disponibilidad ininterrumpida.
- Podemos modificar, suspender o discontinuar funcionalidades. Avisaremos con antelación razonable de cambios sustanciales.
- _Revisar:_ política de retención de datos en caso de cierre del servicio (recomendable: 30 días para descargar copia + borrado).

---

## 9. Limitación de responsabilidad

En la medida permitida por la ley:

- PickPal no se responsabiliza de daños indirectos, lucro cesante o pérdida de datos derivados del uso o imposibilidad de uso del servicio.
- PickPal no se responsabiliza del uso que el usuario haga de las recomendaciones generadas.
- PickPal no se responsabiliza de los datos que el usuario introduzca sobre terceros sin la legitimación adecuada.

Estas limitaciones no afectan a derechos del consumidor que sean irrenunciables por ley.

---

## 10. Baja del servicio

El usuario puede dar de baja su cuenta en cualquier momento desde **Ajustes** (`/settings`). Tras la baja:

- **El borrado es inmediato y transaccional**: al confirmar, se purgan las nueve tablas de la base de datos y a continuación se elimina la cuenta en el proveedor de identidad. No hay periodo de gracia ni papelera.
- Las copias de seguridad de los proveedores de infraestructura se reciclan según sus propios plazos, y pueden conservarse los datos estrictamente necesarios para cumplir obligaciones legales (por ejemplo, logs de seguridad).

---

## 11. Modificación de los términos

Podemos actualizar estos términos para reflejar cambios en el servicio o en la normativa aplicable. Publicaremos la versión vigente en esta misma página y, si el cambio es sustancial, avisaremos con antelación razonable.

---

## 12. Ley aplicable y jurisdicción

- Legislación aplicable: **española y de la Unión Europea**.
- Para resolver conflictos serán competentes los **juzgados y tribunales que determine la ley**, y los consumidores podrán acudir en todo caso a los de su propio domicilio. _(No se designa una ciudad concreta: frente a un consumidor esa cláusula no sería oponible, y el titular no publica su domicilio — ver §1.)_

---

## 13. Contacto

Cualquier consulta sobre estos términos: [pickpal@jorgemolinafuster.com](mailto:pickpal@jorgemolinafuster.com).
