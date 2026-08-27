import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { BackLink } from "@/components/layout/BackLink";

export const metadata = {
  title: "Privacidad · PickPal",
  description:
    "Cómo trata PickPal los datos personales tuyos y de las personas que añades.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="text-lg font-medium tracking-tight flex items-center gap-2"
        >
          <LogoMark className="size-7" />
          PickPal
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-8 px-6 py-12">
        <div className="space-y-3">
          <h1 className="text-4xl font-medium">Privacidad</h1>
          <p className="text-sm text-foreground">
            PickPal está en beta privada. Esta página describe en lenguaje
            llano qué datos guardamos, dónde van y qué puedes hacer con ellos.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Qué datos guardamos</h2>
          <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
            <li>
              <span className="text-foreground">Tu cuenta:</span> email y datos
              básicos que gestiona Clerk para autenticarte.
            </li>
            <li>
              <span className="text-foreground">Tus seres queridos:</span> los
              datos que tú decides introducir sobre las personas a las que vas
              a regalar — nombre, relación, intereses, notas, tallas,
              alergias, fechas importantes y presupuestos.
            </li>
            <li>
              <span className="text-foreground">Tu historial de regalos</span>{" "}
              y las recomendaciones que la IA ha generado para ti.
            </li>
            <li>
              <span className="text-foreground">Tus ajustes:</span>{" "}
              preferencias de notificaciones por correo y tiendas favoritas. El
              tema claro u oscuro se queda en tu navegador, no llega a nuestros
              servidores.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Quién procesa esos datos</h2>
          <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
            <li>
              <span className="text-foreground">Clerk</span> — autenticación y
              gestión de cuentas. Su verificación anti-bot se carga desde
              Cloudflare, que ve tu IP cuando entras en las pantallas de acceso.
            </li>
            <li>
              <span className="text-foreground">Convex</span> — base de datos
              donde se guardan los seres queridos, eventos y ajustes.
            </li>
            <li>
              <span className="text-foreground">Vercel</span> — aloja la web y
              recoge una analítica de uso agregada que no usa cookies ni te
              identifica personalmente.
            </li>
            <li>
              <span className="text-foreground">Google (Gemini)</span> — genera
              las ideas de regalo. Cada vez que pulsas &laquo;generar
              ideas&raquo; recibe la ficha de ese ser querido: su nombre de pila
              (nunca los apellidos), la relación contigo, sus intereses y
              marcas favoritas, tus notas tal como las escribiste, las tallas,
              las alergias o restricciones, lo que no le gusta, el presupuesto,
              la ocasión y el historial de regalos anteriores con su reacción.
              Usamos la capa gratuita de su API: Google puede usar esos datos
              para mejorar sus modelos y personal de Google podría revisarlos.
              No escribas en las notas nada que no quieras compartir con Google.
            </li>
            <li>
              <span className="text-foreground">Resend</span> — envía los
              correos de aviso si activas las notificaciones. Para escribirlos
              recibe tu email, el nombre del ser querido, el evento y su fecha.
            </li>
            <li>
              <span className="text-foreground">Brandfetch</span> — busca la web
              oficial de las marcas favoritas que anotas, para poder enlazarte a
              su tienda. Solo recibe el nombre de la marca (p. ej.
              &laquo;Nike&raquo;), nunca datos de tu ser querido. Su servidor
              sirve además los logos que ves en las ideas, así que ve tu IP al
              cargarlos.
            </li>
            <li>
              <span className="text-foreground">Pexels</span> — pone las
              fotos que ilustran las ideas de regalo. Solo recibe búsquedas
              genéricas en inglés (p. ej. &laquo;wireless headphones&raquo;),
              nunca el nombre ni los datos de tu ser querido. Al mostrar las
              fotos, tu navegador las descarga directamente de sus
              servidores, que ven tu IP — como al cargar cualquier imagen
              externa.
            </li>
            <li>
              <span className="text-foreground">DiceBear</span> — genera los
              avatares ilustrados. No recibe el nombre ni la ficha de la
              persona, pero los rasgos que eliges para el dibujo (tono de piel,
              pelo, expresión) viajan en la dirección de la imagen. Tu navegador
              la carga directamente de sus servidores, que ven tu IP; en los
              correos de aviso la carga tu gestor de correo.
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-border/60 p-5">
          <h2 className="text-xl font-medium">
            Importante: datos de otras personas
          </h2>
          <p className="text-sm text-foreground">
            Cuando añades a alguien como &laquo;ser querido&raquo;, estás
            guardando datos de un tercero que probablemente no es usuario de
            PickPal y no ha dado su consentimiento aquí.
          </p>
          <p className="text-sm text-foreground">
            Eres tú quien decide qué información introducir y eres
            responsable de que esa persona sepa que estás usando un servicio
            como este para acordarte de sus fechas y pensar en regalos. Si
            alguien te pide quitar sus datos, puedes hacerlo desde su ficha o
            eliminando tu cuenta entera.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Cookies</h2>
          <p className="text-sm text-foreground">
            Solo usamos cookies técnicas necesarias para mantener tu sesión
            iniciada (las gestiona Clerk). No usamos cookies de publicidad ni de
            seguimiento, por lo que no hace falta ningún banner de
            consentimiento. La analítica de Vercel funciona sin cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Cuánto lo conservamos</h2>
          <p className="text-sm text-foreground">
            Todo lo que guardas se conserva mientras tu cuenta esté activa. Si
            eliminas tu cuenta, se borra de nuestra base de datos en ese mismo
            momento, sin periodo de gracia; las copias de seguridad de nuestros
            proveedores pueden tardar algo más en reciclarse. Lo que ya se envió
            a Google o a Resend para generar una idea o un correo se rige por
            sus propias políticas de conservación.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Tus derechos</h2>
          <p className="text-sm text-foreground">
            Como titular de los datos tienes derecho de acceso, rectificación,
            supresión, oposición, limitación del tratamiento y portabilidad.
            Puedes ejercerlos así:
          </p>
          <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
            <li>
              <span className="text-foreground">Acceso y modificación:</span>{" "}
              todos tus datos son visibles y editables desde la app.
            </li>
            <li>
              <span className="text-foreground">Borrado:</span> en{" "}
              <Link
                href="/settings"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Ajustes
              </Link>{" "}
              tienes &laquo;Eliminar mi cuenta&raquo;, que borra de forma
              permanente todos tus datos en PickPal y cierra tu cuenta.
            </li>
            <li>
              <span className="text-foreground">Exportación:</span> en beta no
              está automatizada. Si la necesitas, escríbenos al contacto de
              abajo.
            </li>
            <li>
              <span className="text-foreground">
                Oposición y limitación:
              </span>{" "}
              para cualquier otro derecho, escríbenos al contacto de abajo.
            </li>
          </ul>
          <p className="text-sm text-foreground">
            Si crees que no hemos atendido bien tus derechos, puedes reclamar
            ante la{" "}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Agencia Española de Protección de Datos
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Contacto</h2>
          <p className="text-sm text-foreground">
            Para cualquier duda sobre tus datos, escribe a la persona que te
            invitó a la beta.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Última actualización: 29 de julio de 2026.
        </p>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground">
        <BackLink fallbackHref="/" icon={false} />
      </footer>
    </div>
  );
}
