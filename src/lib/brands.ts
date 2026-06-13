import { normalizeInterest } from "./interests";

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
