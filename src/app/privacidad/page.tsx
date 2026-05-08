import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";

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
          <p className="text-sm text-muted-foreground">
            PickPal está en beta privada. Esta página describe en lenguaje
            llano qué datos guardamos, dónde van y qué puedes hacer con ellos.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Qué datos guardamos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
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
              preferencias de notificaciones por correo, tiendas favoritas,
              tema claro/oscuro.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Quién procesa esos datos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>
              <span className="text-foreground">Clerk</span> — autenticación y
              gestión de cuentas.
            </li>
            <li>
              <span className="text-foreground">Convex</span> — base de datos
              donde se guardan los seres queridos, eventos y ajustes.
            </li>
            <li>
              <span className="text-foreground">Google (Gemini)</span> — recibe
              los datos del ser querido y de la ocasión cada vez que pulsas
              &laquo;generar ideas&raquo;, para devolver sugerencias de
              regalo. Google no entrena modelos con esos datos cuando se
              accede vía la API que usamos.
            </li>
            <li>
              <span className="text-foreground">Resend</span> — envía los
              correos de aviso si activas las notificaciones.
            </li>
          </ul>
        </section>

        <section className="space-y-3 rounded-xl border border-border/60 p-5">
          <h2 className="text-xl font-medium">
            Importante: datos de otras personas
          </h2>
          <p className="text-sm text-muted-foreground">
            Cuando añades a alguien como &laquo;ser querido&raquo;, estás
            guardando datos de un tercero que probablemente no es usuario de
            PickPal y no ha dado su consentimiento aquí.
          </p>
          <p className="text-sm text-muted-foreground">
            Eres tú quien decide qué información introducir y eres
            responsable de que esa persona sepa que estás usando un servicio
            como este para acordarte de sus fechas y pensar en regalos. Si
            alguien te pide quitar sus datos, puedes hacerlo desde su ficha o
            eliminando tu cuenta entera.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Tus derechos</h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
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
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-medium">Contacto</h2>
          <p className="text-sm text-muted-foreground">
            Para cualquier duda sobre tus datos, escribe a la persona que te
            invitó a la beta.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">
          Última actualización: 8 de mayo de 2026.
        </p>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Volver al inicio
        </Link>
      </footer>
    </div>
  );
}
