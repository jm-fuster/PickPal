import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Default-deny: cualquier ruta no listada aquí requiere sesión.
// Esto bloquea automáticamente nuevas rutas que se creen sin auth explícita.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Aviso de privacidad: legítimamente público — debe ser legible antes de
  // crear cuenta y para que cualquiera al que un usuario haya añadido como
  // "ser querido" pueda consultar el tratamiento de sus datos.
  "/privacidad",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
