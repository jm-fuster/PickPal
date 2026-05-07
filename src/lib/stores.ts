export type StoreId = "amazon" | "aliexpress" | "miravia" | "elcorteingles";

export const ALL_STORES: readonly StoreId[] = [
  "amazon",
  "aliexpress",
  "miravia",
  "elcorteingles",
] as const;

export const STORE_LABELS: Record<StoreId, string> = {
  amazon: "Amazon",
  aliexpress: "AliExpress",
  miravia: "Miravia",
  elcorteingles: "El Corte Inglés",
};

export function generateStoreSearchUrl(store: StoreId, query: string): string {
  const q = encodeURIComponent(query);
  switch (store) {
    case "amazon":
      return `https://www.amazon.es/s?k=${q}`;
    case "aliexpress":
      return `https://es.aliexpress.com/w/wholesale-${q}.html`;
    case "miravia":
      return `https://www.miravia.es/search?q=${q}`;
    case "elcorteingles":
      return `https://www.elcorteingles.es/search/?s=${q}`;
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
