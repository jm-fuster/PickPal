# Política de privacidad · PickPal

**Esqueleto. No publicar tal cual.** Los marcadores `{{...}}` son huecos a rellenar antes de hacer la app pública. Las secciones marcadas con _Revisar_ requieren decisión consciente.

Última actualización: `{{FECHA_PUBLICACION}}`

> Cuando se publique la app, este contenido debe servirse en `/privacy` (p. ej. `src/app/(legal)/privacy/page.tsx`) y enlazarse desde el footer y desde la pantalla de registro.

---

## 1. Responsable del tratamiento

- **Titular:** `{{NOMBRE_O_RAZON_SOCIAL}}`
- **NIF/CIF:** `{{NIF}}`
- **Dirección:** `{{DIRECCION_POSTAL}}`
- **Email de contacto:** `{{EMAIL_CONTACTO}}`
- **Delegado de protección de datos (DPO):** _No aplica_ (no se cumplen los supuestos del art. 37 RGPD para PickPal mientras sea operación a pequeña escala).

---

## 2. Datos que tratamos

### 2.1 Datos del usuario registrado

Recogidos a través de [Clerk](https://clerk.com) cuando el usuario se registra:

- Email
- Nombre (si lo proporciona)
- Identificador único de usuario
- Datos de sesión (IP, user-agent, timestamps de login) — gestionados por Clerk

### 2.2 Datos introducidos por el usuario sobre terceros

El usuario introduce información sobre personas de su entorno (amigos, familia, etc.):

- Nombre
- Tipo de relación
- Intereses
- Notas libres
- Rango de presupuesto
- Fechas señaladas (cumpleaños, aniversarios)

**Importante:** estos datos **no son del usuario, son de terceros**. Ver sección 7.

### 2.3 Datos de uso

- Contadores de cuota diaria de recomendaciones (anti-abuso)
- Logs de errores en servidor (sin contenido personal)

### 2.4 Cookies

- **Clerk** instala cookies técnicas de sesión (1ª parte). No requieren consentimiento bajo LSSI art. 22.2.
- **No usamos cookies analíticas, publicitarias ni de terceros.** La analítica de uso se hace con **Vercel Web Analytics**, que es *cookieless* (no almacena ni accede a información en el dispositivo, recoge métricas agregadas), por lo que no requiere banner de consentimiento bajo LSSI art. 22.2.
- Si en el futuro se añade analítica basada en cookies (Plausible con cookies, GA, etc.) o publicidad, habrá que añadir banner de consentimiento y actualizar este documento.

---

## 3. Finalidades y bases legales

| Finalidad | Datos | Base legal (RGPD art. 6) |
|---|---|---|
| Permitir el uso de la app (cuenta, login) | Datos de Clerk | Ejecución de contrato (b) |
| Almacenar la libreta personal del usuario | Datos sobre terceros, fechas | Ejecución de contrato (b) + interés legítimo del usuario (f) |
| Generar recomendaciones de regalo con IA | Datos de la persona seleccionada | Ejecución de contrato (b) |
| Enviar avisos de fechas próximas | Email + fechas | Consentimiento (a) — _Revisar: implementar opt-in explícito_ |
| Prevenir abuso (rate limit, logs) | Identificador de usuario, contadores | Interés legítimo (f) |

---

## 4. Encargados del tratamiento

Compartimos datos con los siguientes proveedores que actúan como encargados:

| Proveedor | Para qué | Ubicación | Garantías |
|---|---|---|---|
| [Clerk](https://clerk.com) | Autenticación y gestión de cuentas | EE. UU. | DPA + SCCs / EU-US DPF |
| [Convex](https://convex.dev) | Base de datos y backend | EE. UU. | DPA + SCCs / EU-US DPF |
| [Google (Gemini API)](https://ai.google.dev) | Generación de recomendaciones | EE. UU. | DPA + SCCs / EU-US DPF |
| [Vercel](https://vercel.com) | Hosting de la web y analítica de uso *cookieless* (Vercel Web Analytics) | EE. UU. | DPA + SCCs / EU-US DPF |
| [Pexels](https://www.pexels.com) | Fotos de stock que ilustran las ideas de regalo | EE. UU. | Solo recibe búsquedas genéricas en inglés (server-side) y la IP del navegador al cargar las fotos (ver 4.2) |
| [DiceBear](https://www.dicebear.com) | Avatares ilustrados de los seres queridos | UE | Solo recibe la IP del navegador al cargar el avatar (ver 4.2) |

_Revisar antes de publicar:_ firmar / aceptar el DPA de cada proveedor (suelen estar en su panel) y confirmar que están en la lista DPF vigente.

### 4.1 Datos enviados a Google Gemini

Cuando el usuario pide recomendaciones, enviamos a Gemini el nombre, intereses, notas, presupuesto y ocasión de la persona seleccionada.

Actualmente PickPal usa la **capa gratuita** de la Gemini API. Según los [términos de Google](https://ai.google.dev/gemini-api/terms), en los servicios *no* de pago **Google usa el contenido enviado y las respuestas para mejorar y desarrollar sus productos y sus modelos de machine learning**, y **revisores humanos pueden leer, anotar y procesar** las entradas y salidas de la API. Por eso advertimos al usuario (en la app y en la sección 7) de no introducir en las notas datos que no quiera compartir con Google.

> Si en el futuro se migra a la **capa de pago** de Gemini, Google deja de usar los datos para mejorar sus productos (solo los retiene brevemente por seguridad/abuso). Si se hace ese cambio, **actualizar esta sección y la página `/privacidad`** para reflejarlo. Verificar en cada renovación de los términos.

### 4.2 Imágenes de terceros (Pexels y DiceBear)

Las fotos de las ideas de regalo y los avatares se cargan por *hotlink* directo desde los CDNs de Pexels y DiceBear: el navegador del usuario se conecta a esos dominios, que ven su **dirección IP**, user-agent y el dominio de origen (solo el origen, no la ruta, por la `Referrer-Policy` del sitio — `strict-origin-when-cross-origin`).

En el lado servidor, PickPal envía a Pexels únicamente la búsqueda genérica en inglés que genera la IA por cada idea (p. ej. "wireless headphones") — **nunca** nombres, intereses en bruto ni ningún dato del perfil del ser querido. A DiceBear se le envía una semilla aleatoria, no derivada del nombre.

> Alternativa evaluada y descartada por ahora: proxear las imágenes a través del propio servidor (ocultaría la IP del usuario a cambio de tráfico, latencia y complejidad en el hosting). Si la app sale de beta, reevaluar.

---

## 5. Transferencias internacionales

La mayoría de los proveedores anteriores tratan datos en EE. UU. (DiceBear opera en la UE). La legitimación se basa en:

- Cláusulas Contractuales Tipo (SCCs) aprobadas por la Comisión Europea, y/o
- Adhesión al **EU-US Data Privacy Framework**.

---

## 6. Conservación

| Dato | Plazo |
|---|---|
| Cuenta de usuario y datos asociados | Mientras la cuenta esté activa. Tras la baja, eliminación en `{{DIAS_BORRADO}}` días. |
| Logs de seguridad (errores, rate limit) | `{{DIAS_LOGS}}` días |
| Datos enviados a Gemini | No conservados por nosotros tras la respuesta. En la capa gratuita, Google puede usarlos para mejorar sus productos (ver §4.1); política de retención de Google aplicable. |

_Revisar:_ implementar el flujo de borrado de cuenta en la app antes de publicar.

---

## 7. Datos sobre terceros (importante)

PickPal permite al usuario guardar información sobre personas de su entorno que **no han prestado consentimiento directamente** (su pareja, familia, amigos).

- El **usuario es el responsable** de los datos que introduce sobre terceros: debe asegurarse de tener una base legítima (relación personal cercana) y no introducir datos sensibles innecesarios.
- **PickPal actúa como encargado** del tratamiento para esos datos.
- Cualquier tercero puede solicitar el borrado o información sobre los datos que se guardan sobre él escribiendo a `{{EMAIL_CONTACTO}}`. Daremos curso a la petición localizando los registros que le mencionen y eliminándolos en un plazo máximo de 30 días.
- **Datos sensibles** (salud, ideología, orientación sexual, etc., art. 9 RGPD): el usuario **no debe** introducirlos en notas. Si se detecta su uso sistemático, podemos suspender la cuenta.

---

## 8. Derechos del usuario

Como interesado, tienes derecho a:

- **Acceso** a tus datos
- **Rectificación**
- **Supresión** ("derecho al olvido")
- **Oposición** al tratamiento
- **Limitación** del tratamiento
- **Portabilidad** (recibir tus datos en formato estructurado)

Puedes ejercerlos:

1. **Desde la app**: edición y borrado están disponibles en la propia interfaz.
2. **Por email** a `{{EMAIL_CONTACTO}}`, indicando qué derecho quieres ejercer.

Si consideras que tus derechos no se han atendido correctamente, puedes presentar una reclamación ante la **Agencia Española de Protección de Datos** (https://www.aepd.es).

---

## 9. Seguridad

Las medidas técnicas y organizativas se documentan en [`security.md`](security.md). En resumen: cifrado en tránsito (HTTPS), autenticación obligatoria, control de propiedad por usuario, validación server-side, rate limiting y headers de seguridad HTTP.

---

## 10. Menores

PickPal no está dirigida a menores de 14 años. Si detectamos una cuenta de un menor sin consentimiento de sus tutores, será eliminada.

---

## 11. Cambios en esta política

Publicaremos cualquier cambio sustancial en esta misma página y notificaremos por email a los usuarios registrados con al menos 15 días de antelación.
