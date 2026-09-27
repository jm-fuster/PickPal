/**
 * ¿Pide el navegador que no se le rastree? Vale Global Privacy Control
 * (`navigator.globalPrivacyControl`) o la señal antigua Do Not Track
 * (`navigator.doNotTrack === "1"`). La analítica descarta la visita cuando
 * llega cualquiera de las dos: es una de las dos formas de negarse que explica
 * /privacidad (docs/privacy.md §2.4).
 */
export function asksNotToTrack(nav: {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

/**
 * La otra forma de negarse: el interruptor «Contar mis visitas» de
 * /privacidad, que se guarda en `localStorage` bajo esta clave. Guardarlo no
 * necesita consentimiento: lo pide el propio usuario para que no se le cuente.
 */
export const ANALYTICS_OPT_OUT_KEY = "pickpal-analytics-opt-out";

type OptOutStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * `localStorage` no existe en el servidor y puede lanzar solo con tocarlo
 * (almacenamiento bloqueado, algunos modos privados). En ambos casos se trata
 * como si no hubiera preferencia guardada.
 */
export function browserStorage(): OptOutStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readAnalyticsOptOut(
  storage: OptOutStorage | undefined,
): boolean {
  try {
    return storage?.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Devuelve `false` si no se pudo guardar, para que la interfaz no dé por hecho
 * un cambio que no ha ocurrido.
 */
export function writeAnalyticsOptOut(
  storage: OptOutStorage | undefined,
  optOut: boolean,
): boolean {
  if (!storage) return false;
  try {
    if (optOut) storage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
    else storage.removeItem(ANALYTICS_OPT_OUT_KEY);
    return true;
  } catch {
    return false;
  }
}
