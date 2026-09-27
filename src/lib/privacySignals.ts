/**
 * ¿Pide el navegador que no se le rastree? Vale Global Privacy Control
 * (`navigator.globalPrivacyControl`) o la señal antigua Do Not Track
 * (`navigator.doNotTrack === "1"`). La analítica descarta la visita cuando
 * llega cualquiera de las dos: es la forma de negarse que explica /privacidad
 * (docs/privacy.md §2.4).
 */
export function asksNotToTrack(nav: {
  globalPrivacyControl?: boolean;
  doNotTrack?: string | null;
}): boolean {
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}
