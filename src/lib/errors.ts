import { ConvexError } from "convex/values";

/**
 * Extrae el mensaje apto para el usuario de un error de Convex.
 *
 * Solo los `ConvexError` lanzados a propósito en `convex/**` llevan un mensaje
 * en español pensado para mostrarse en un toast (`err.data`). Cualquier otro
 * error (errores internos, redactados por Convex en prod, fallos de red) se
 * sustituye por el fallback: nunca se renderiza `err.message` crudo.
 */
export function userErrorMessage(
  err: unknown,
  fallback = "No se pudo guardar. Inténtalo de nuevo.",
) {
  return err instanceof ConvexError && typeof err.data === "string"
    ? err.data
    : fallback;
}
