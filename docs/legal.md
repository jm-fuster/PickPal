# Aviso legal y términos · PickPal

**Esqueleto. No publicar tal cual.** Los marcadores `{{...}}` son huecos a rellenar. Las secciones marcadas con _Revisar_ requieren decisión consciente antes de hacer pública la app.

Última actualización: `{{FECHA_PUBLICACION}}`

> Cuando se publique la app, este contenido debe servirse en `/legal` (o separado en `/aviso-legal` y `/terminos`) y enlazarse desde el footer.

---

## 1. Información del titular (LSSI-CE art. 10)

Por exigencia de la Ley 34/2002 de Servicios de la Sociedad de la Información:

- **Titular:** `{{NOMBRE_O_RAZON_SOCIAL}}`
- **NIF/CIF:** `{{NIF}}`
- **Domicilio:** `{{DIRECCION_POSTAL}}`
- **Email de contacto:** `{{EMAIL_CONTACTO}}`
- **Datos registrales:** _Si aplica_ (`{{REGISTRO_MERCANTIL}}`)

---

## 2. Objeto

PickPal es una aplicación web que permite al usuario guardar información sobre personas de su entorno (intereses, fechas señaladas, notas) y obtener recomendaciones personalizadas de regalo generadas por inteligencia artificial.

El uso de PickPal está sujeto a los presentes términos y a la [política de privacidad](privacy.md).

---

## 3. Aceptación

Al registrarse y utilizar PickPal, el usuario acepta estos términos. Si no está de acuerdo, no debe registrarse ni utilizar el servicio.

---

## 4. Cuenta de usuario

- Para usar PickPal hay que registrarse mediante `{{METODOS_LOGIN}}` _(p. ej. email + contraseña, Google)_.
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
- La marca, el diseño y el contenido editorial son propiedad de `{{NOMBRE_O_RAZON_SOCIAL}}`.
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

El usuario puede dar de baja su cuenta en cualquier momento desde `{{RUTA_BORRADO_CUENTA}}` _(p. ej. `/settings`)_. Tras la baja:

- Sus datos se eliminan en un plazo máximo de `{{DIAS_BORRADO}}` días.
- Algunos datos pueden conservarse el tiempo necesario para cumplir obligaciones legales (logs de seguridad, registros contables si aplica).

---

## 11. Modificación de los términos

Podemos actualizar estos términos para reflejar cambios en el servicio o en la normativa aplicable. Publicaremos la versión vigente en esta misma página y, si el cambio es sustancial, avisaremos con antelación razonable.

---

## 12. Ley aplicable y jurisdicción

- Legislación aplicable: **española y de la Unión Europea**.
- Para resolver conflictos, las partes se someten a los **juzgados y tribunales de `{{CIUDAD}}`**, salvo en el caso de consumidores, que podrán acudir a los de su domicilio.

---

## 13. Contacto

Cualquier consulta sobre estos términos: `{{EMAIL_CONTACTO}}`.
