export const STORE_IDS = [
  "amazon",
  "elcorteingles",
  "aliexpress",
  "miravia",
  "fnac",
  "decathlon",
  "ikea",
  "pccomponentes",
] as const;

export type StoreId = (typeof STORE_IDS)[number];

export const ALL_STORES: readonly StoreId[] = STORE_IDS;

export const STORE_LABELS: Record<StoreId, string> = {
  amazon: "Amazon",
  elcorteingles: "El Corte Inglés",
  aliexpress: "AliExpress",
  miravia: "Miravia",
  fnac: "Fnac",
  decathlon: "Decathlon",
  ikea: "IKEA",
  pccomponentes: "PcComponentes",
};

export function generateStoreSearchUrl(store: StoreId, query: string): string {
  const q = encodeURIComponent(query);
  switch (store) {
    case "amazon":
      return `https://www.amazon.es/s?k=${q}`;
    case "elcorteingles":
      return `https://www.elcorteingles.es/search/?s=${q}`;
    case "aliexpress":
      return `https://es.aliexpress.com/w/wholesale-${q}.html`;
    case "miravia":
      return `https://www.miravia.es/search?q=${q}`;
    case "fnac":
      return `https://www.fnac.es/SearchResult/ResultList.aspx?Search=${q}`;
    case "decathlon":
      return `https://www.decathlon.es/es/search?q=${q}`;
    case "ikea":
      return `https://www.ikea.com/es/es/search/?q=${q}`;
    case "pccomponentes":
      return `https://www.pccomponentes.com/search/?query=${q}`;
  }
}

export function isStoreId(s: string): s is StoreId {
  return (ALL_STORES as readonly string[]).includes(s);
}

export function sanitizeFavoriteStores(stores: readonly string[]): StoreId[] {
  const seen = new Set<StoreId>();
  for (const s of stores) {
    if (isStoreId(s)) seen.add(s);
  }
  return ALL_STORES.filter((s) => seen.has(s));
}

/**
 * Decide qué tiendas mostrar en una tarjeta de regalo físico, dada la lista
 * de tiendas favoritas del usuario y las tiendas sugeridas por la IA.
 *
 * - Si la IA no sugiere nada (campo ausente o vacío), mostramos todas las
 *   favoritas (comportamiento previo a v2).
 * - Si la IA sugiere algo y hay intersección con las favoritas, mostramos
 *   solo esa intersección.
 * - Si la IA sugiere algo pero ninguna favorita encaja, hacemos fallback
 *   a todas las favoritas y marcamos `isFallback: true` para que la UI
 *   pueda indicar que es una búsqueda genérica.
 */
export function pickEffectiveStores(
  favoriteStores: readonly StoreId[],
  suggestedStores: readonly string[] | undefined,
): { stores: StoreId[]; isFallback: boolean } {
  const sanitizedSuggested = suggestedStores
    ? sanitizeFavoriteStores(suggestedStores)
    : [];
  if (sanitizedSuggested.length === 0) {
    return { stores: [...favoriteStores], isFallback: false };
  }
  const intersection = favoriteStores.filter((s) =>
    sanitizedSuggested.includes(s),
  );
  if (intersection.length > 0) {
    return { stores: intersection, isFallback: false };
  }
  return { stores: [...favoriteStores], isFallback: true };
}
