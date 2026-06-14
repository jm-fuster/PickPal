import { normalizeInterest } from "./interests";
import type { MatchedBrandStore } from "./gifts";

// Espejo de MAX_BRANDS en convex/validators.ts — si cambia allí, cambiar aquí.
export const MAX_BRANDS = 10;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Marcas favoritas que aparecen mencionadas en una idea (en el título o en la
 * query de búsqueda), comparando sin acentos ni mayúsculas y con límite de
 * palabra para no casar una marca corta dentro de otra palabra (p. ej. "HP"
 * dentro de "champú"). Devuelve las marcas en su forma original, deduplicadas
 * y en el orden en que el usuario las definió.
 *
 * Sirve para cerrar el círculo en la card: cuando la IA usó de verdad una
 * marca favorita, la card lo muestra. Es una heurística sobre el texto que ya
 * devolvió la IA — no requiere que el modelo marque nada explícitamente.
 */
export function matchFavoriteBrands(
  idea: { title: string; amazonQuery: string },
  favoriteBrands: readonly string[] | undefined,
): string[] {
  if (!favoriteBrands || favoriteBrands.length === 0) return [];
  const haystack = normalizeInterest(`${idea.title} ${idea.amazonQuery}`);
  if (!haystack) return [];
  const matched: string[] = [];
  const seen = new Set<string>();
  for (const brand of favoriteBrands) {
    const needle = normalizeInterest(brand);
    if (!needle || seen.has(needle)) continue;
    seen.add(needle);
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`);
    if (re.test(haystack)) matched.push(brand.trim());
  }
  return matched;
}

/**
 * URL de búsqueda acotada a una marca favorita. Cuando una idea encaja con una
 * marca (p. ej. "Brandy Melville"), esa marca a menudo NO vende en los
 * marketplaces genéricos (Amazon, El Corte Inglés…) porque es de distribución
 * propia (DTC). Buscar en Google "{producto} {marca}" coloca la tienda oficial
 * de la marca como primer resultado, así que el botón de marca lleva ahí en
 * vez de a una búsqueda de marketplace que saldría vacía.
 *
 * Misma vía que el botón a Google de los regalos no físicos: no añade APIs,
 * claves ni endpoints — solo construye una URL de búsqueda determinista.
 *
 * Si la query del producto ya contiene la marca (la IA la metió en
 * `amazonQuery`), no la duplica.
 */
export function generateBrandSearchUrl(query: string, brand: string): string {
  const q = query.trim();
  const b = brand.trim();
  const alreadyHasBrand =
    b !== "" && normalizeInterest(q).includes(normalizeInterest(b));
  const search = b === "" || alreadyHasBrand ? q : `${q} ${b}`;
  return `https://www.google.com/search?q=${encodeURIComponent(search.trim())}`;
}

/**
 * Normaliza el dominio que devuelve Brandfetch a un hostname limpio
 * ("https://www.brandymelville.com/shop" → "brandymelville.com"). Devuelve
 * null si no parece un dominio válido — la marca cae entonces al botón de
 * búsqueda de marca (Capa 0). La validación del servidor en
 * `convex/validators.ts` espeja esta regla (regex + tope de longitud).
 */
export function normalizeBrandDomain(raw: string): string | null {
  const d = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
  if (d.length === 0 || d.length > 253) return null;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return null;
  return d;
}

/**
 * Búsqueda del producto acotada a la tienda oficial de la marca
 * (`{producto} site:{dominio}`). Google indexa la web de la marca, así que el
 * resultado aterriza en sus páginas de producto sin depender del buscador
 * propio de cada tienda (que varía y a menudo no es enlazable).
 */
export function generateBrandStoreSearchUrl(
  query: string,
  domain: string,
): string {
  const q = `${query.trim()} site:${domain}`.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

/**
 * Tienda resuelta para una marca matcheada, comparando el nombre de forma
 * normalizada (sin acentos/mayúsculas). Devuelve undefined si esa marca no se
 * resolvió — la card cae al botón de búsqueda (Capa 0).
 */
export function findBrandStore(
  brand: string,
  stores: readonly MatchedBrandStore[] | undefined,
): MatchedBrandStore | undefined {
  if (!stores || stores.length === 0) return undefined;
  const needle = normalizeInterest(brand);
  return stores.find((s) => normalizeInterest(s.brand) === needle);
}
