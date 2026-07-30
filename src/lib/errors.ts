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

/** Mensajes de fallo del proveedor de IA. Todos afirman que no se ha gastado
 *  cuota porque la route hace `refund` antes de responder (ver §4 de
 *  `docs/security.md`): al llegar al catch no se ha persistido ninguna idea. */
const PROVIDER_MESSAGES = {
  overloaded:
    "La IA está saturada ahora mismo — no se ha consumido cuota. Inténtalo en unos minutos.",
  quotaDaily:
    "La cuota diaria de la IA se ha agotado — no se ha consumido cuota. Vuelve a intentarlo mañana.",
  quotaRate:
    "Demasiadas peticiones seguidas — no se ha consumido cuota. Espera un minuto y vuelve a intentarlo.",
  quotaUnknown:
    "La IA ha alcanzado su límite de uso — no se ha consumido cuota. Inténtalo más tarde.",
  generic:
    "No hemos podido generar ideas en este momento — no se ha consumido cuota. Inténtalo de nuevo.",
} as const;

export type ProviderFailure = {
  status: number;
  error: string;
  /** Para logs: distingue los 429 entre sí sin volver a mirar el cuerpo. */
  kind: keyof typeof PROVIDER_MESSAGES;
};

const readProp = (value: unknown, key: string): unknown =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)[key]
    : undefined;

/**
 * Traduce un fallo del proveedor de IA en status HTTP + mensaje para el usuario,
 * sin filtrar detalles internos (§5 de `docs/security.md`).
 *
 * El caso que motiva la clasificación es el `429`: agotar la cuota **diaria** del
 * proyecto de Google no se arregla reintentando, así que un "inténtalo de nuevo"
 * genérico manda al usuario a reintentar hasta el reset (medianoche del
 * Pacífico). El cuerpo de un 429 de Gemini trae un `quotaId` del estilo
 * `GenerateRequestsPerDayPerProjectPerModel-FreeTier` (o su variante
 * `...PerMinute...`), que es lo que se busca aquí. Si no se puede determinar
 * cuál de los dos es, se degrada a un mensaje que **no promete ningún plazo**:
 * preferible a prometer el equivocado.
 */
export function classifyProviderError(err: unknown): ProviderFailure {
  // `AI_RetryError` envuelve la causa real en `lastError`.
  const lastError = readProp(err, "lastError");
  const statusCode =
    readProp(err, "statusCode") ?? readProp(lastError, "statusCode");

  if (statusCode === 503) {
    return { status: 503, error: PROVIDER_MESSAGES.overloaded, kind: "overloaded" };
  }
  // Cualquier otra cosa (timeout, JSON inválido, "response did not match
  // schema", bloqueo de seguridad de Gemini) no es un problema de cuota.
  if (statusCode !== 429) {
    return { status: 500, error: PROVIDER_MESSAGES.generic, kind: "generic" };
  }

  const bodies = [readProp(err, "responseBody"), readProp(lastError, "responseBody")]
    .filter((b): b is string => typeof b === "string")
    .join(" ")
    .toLowerCase();

  if (bodies.includes("perday") || bodies.includes("per day")) {
    return { status: 429, error: PROVIDER_MESSAGES.quotaDaily, kind: "quotaDaily" };
  }
  if (bodies.includes("perminute") || bodies.includes("per minute")) {
    return { status: 429, error: PROVIDER_MESSAGES.quotaRate, kind: "quotaRate" };
  }
  return { status: 429, error: PROVIDER_MESSAGES.quotaUnknown, kind: "quotaUnknown" };
}
