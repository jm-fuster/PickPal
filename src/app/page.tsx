import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Bell, Gift, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/LogoMark";
import type { LucideIcon } from "lucide-react";

const STEPS: { number: number; icon: LucideIcon; title: string; body: string }[] = [
  {
    number: 1,
    icon: Users,
    title: "Añade a tus seres queridos",
    body: "Sus gustos, notas, tallas y sus eventos — cada ocasión con su presupuesto.",
  },
  {
    number: 2,
    icon: Bell,
    title: "Dile cuándo avisarte",
    body: "Elige con cuántos días de antelación quieres saber que se acerca una fecha. Sin sorpresas.",
  },
  {
    number: 3,
    icon: Gift,
    title: "Genera ideas perfectas",
    body: "Un botón. Nueve sugerencias adaptadas a esa persona, a la ocasión y a tu presupuesto.",
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
          <p className="font-sans text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Para las personas que te importan
          </p>
          <h1 className="text-balance text-4xl font-medium leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
            El regalo perfecto para quien más te importa.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Guarda lo que sabes de cada persona, activa los avisos y deja que la IA piense contigo cuando llegue el momento.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-3">
            {isSignedIn ? (
              <Link href="/agenda" className={buttonVariants({ size: "lg" })}>
                Ir a la agenda
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
          {STEPS.map(({ number, icon: Icon, title, body }) => (
            <Card key={title} className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {number}
                  </span>
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <h2 className="text-xl font-medium">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
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
