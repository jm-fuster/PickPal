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
 * TLDs reservados o de uso interno (RFC 2606, RFC 6761, RFC 6762, RFC 8375).
 * La regex de `normalizeBrandDomain` ya descarta IPs y `localhost` —ninguno
 * termina en un sufijo alfabético—, pero `algo.internal`, `algo.local` o
 * `algo.lan` sí la pasan, y el servidor los llegaría a resolver: tras aceptar
 * el dominio, `/api/recommendations` hace un `GET https://{dominio}/products.json`
 * para detectar si la tienda admite búsqueda interna. El dominio viene de
 * Brandfetch, no del usuario, así que el riesgo es bajo; esto cierra el hueco
 * igualmente, que es más barato que razonar cada vez sobre la red del runtime.
 * Espejado en `BRAND_RESERVED_TLDS` de `convex/validators.ts`.
 */
const RESERVED_TLDS = new Set([
  "local",
  "localhost",
  "internal",
  "intranet",
  "private",
  "corp",
  "home",
  "lan",
  "alt",
  "onion",
  "test",
  "example",
  "invalid",
]);

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
  if (RESERVED_TLDS.has(d.slice(d.lastIndexOf(".") + 1))) return null;
  return d;
}

/**
 * Enlace directo a la web oficial de la marca. El dominio ya viene saneado por
 * `normalizeBrandDomain` (hostname sin protocolo/path/www), así que es seguro
 * componer la URL. Lleva a la tienda directamente — no a una búsqueda — porque
 * es lo que el usuario espera al pulsar el botón de una marca con su logo.
 */
export function generateBrandStoreUrl(domain: string): string {
  return `https://${domain}`;
}

/**
 * Búsqueda del producto DENTRO de la web de la marca, usando la ruta de
 * búsqueda estándar `/search?q=` (Shopify y muchas otras). Solo se usa cuando
 * la resolución confirmó que la tienda la admite (`supportsSearch`), para no
 * enlazar a una ruta inventada que daría 404. El dominio ya viene saneado por
 * `normalizeBrandDomain`.
 */
export function generateBrandProductSearchUrl(
  domain: string,
  query: string,
): string {
  return `https://${domain}/search?q=${encodeURIComponent(query.trim())}`;
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
