import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    title: "Una sola lista de personas",
    body: "Guarda intereses, presupuesto y notas de cada persona que te importa, en un solo sitio.",
  },
  {
    title: "Avisos a tiempo",
    body: "Configura cuántos días antes quieres saberlo. La campanita y el dashboard te avisan.",
  },
  {
    title: "6 ideas, una IA",
    body: "Pulsa un botón y recibe seis sugerencias personalizadas con enlace directo a Amazon.",
  },
];

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between p-6">
        <span className="font-semibold">Giftly</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isSignedIn ? <UserButton /> : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-12 text-center">
        <section className="space-y-5 max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            No olvides a las personas que te importan.
          </h1>
          <p className="text-lg text-muted-foreground">
            Guarda fechas importantes y recibe ideas de regalo personalizadas
            con IA cuando se acerca cada ocasión.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {isSignedIn ? (
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
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

        <section className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5 text-left space-y-2">
                <h2 className="font-medium">{f.title}</h2>
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="text-center text-xs text-muted-foreground p-6">
        Giftly · Hecho con Next.js, Convex y Gemini.
      </footer>
    </div>
  );
}
