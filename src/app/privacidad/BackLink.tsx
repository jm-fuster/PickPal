"use client";

import { useRouter } from "next/navigation";

/**
 * Enlace "Volver" del pie de la política de privacidad. La página es pública
 * y se llega a ella desde varios sitios (landing, auth, Ajustes), así que el
 * destino no se conoce en render: usamos `router.back()` para volver al paso
 * anterior real (mismo patrón que el back link de las páginas de detalle).
 * Si no hay historial dentro de la app —p. ej. se abrió la URL directamente o
 * desde un enlace externo— caemos a la portada.
 */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      className="hover:text-foreground"
    >
      Volver
    </button>
  );
}
