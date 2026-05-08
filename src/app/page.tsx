import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/LogoMark";

const FEATURES = [
  {
    emoji: "🪴",
    title: "Una libreta para los tuyos",
    body: "Guarda intereses, presupuesto y notas de cada persona que te importa. Como una agenda de papel, pero que no se pierde.",
  },
  {
    emoji: "🔔",
    title: "Avisos cuando hacen falta",
    body: "Decide tú con cuántos días de antelación quieres saberlo. La campanita y el dashboard te avisan a tiempo.",
  },
  {
    emoji: "✨",
    title: "Seis ideas hechas a medida",
    body: "Pulsa un botón y recibe seis sugerencias adaptadas a sus gustos, con enlace directo a Amazon.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-lg font-medium tracking-tight flex items-center gap-2">
          <LogoMark className="size-7" />
          PickPal
        </span>
        <div className="flex items-center gap-3">
          {isSignedIn ? <UserButton /> : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-16 px-6 py-16">
        <section className="space-y-6 max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Para las personas que te importan
          </p>
          <h1 className="text-balance text-4xl font-medium leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
            No olvides el cumpleaños de quien te hace bien.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Guarda fechas importantes y recibe ideas de regalo personalizadas
            con IA cuando se acerca cada ocasión.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            {isSignedIn ? (
              <Link href="/agenda" className={buttonVariants({ size: "lg" })}>
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
                  Empezar gratis
                </Link>
                <Link
                  href="/sign-in"
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid w-full max-w-5xl gap-4 grid-cols-1 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-border/60 shadow-sm">
              <CardContent className="space-y-3 p-6">
                <div className="text-2xl" aria-hidden>
                  {f.emoji}
                </div>
                <h2 className="text-xl font-medium">{f.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-muted-foreground">
        PickPal · Hecho con cariño en Next.js, Convex y Gemini.
      </footer>
    </div>
  );
}
