// Límites espejados de src/lib/schemas.ts y src/lib/gifts.ts. La validación
// cliente es UX; estas comprobaciones son la frontera de confianza del servidor.

const MAX_NAME = 80;
const MAX_NOTES = 1000;
const MAX_INTEREST = 80;
const MAX_INTERESTS = 20;
const MAX_LABEL = 40;
const MAX_RELATIONSHIP = 32;
// Convex almacena el presupuesto en céntimos; el form lo expone en euros (0–100.000€).
const MAX_BUDGET_CENTS = 100_000 * 100;
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const MAX_SIZE = 20;
const MAX_QUIRK = 200;
const MAX_AVATAR_URL = 512;
const DICEBEAR_PREFIX = "https://api.dicebear.com/";

// Recomendaciones IA. Espejados de giftRecommendationSchema en src/lib/gifts.ts.
const MAX_IDEA_TITLE = 80;
const MAX_IDEA_DESCRIPTION = 280;
const MAX_IDEA_CATEGORY = 40;
const MAX_IDEA_QUERY = 120;
const MAX_IDEA_PRICE_EUROS = 100_000;
const IDEAS_PER_GENERATION = 9;
// Lista de tiendas soportadas. Fuente de verdad para validación server-side
// tanto en `validateRecommendationIdeas` como en `setMine` (favoritas).
// Espejada en `STORE_IDS` de `src/lib/stores.ts` (cliente) — si añades una
// nueva tienda, actualiza ambos sitios.
export const ALLOWED_STORES = [
  "amazon",
  "elcorteingles",
  "aliexpress",
  "temu",
  "miravia",
  "decathlon",
  "ikea",
  "pccomponentes",
  "mediamarkt",
  "zalando",
  "druni",
] as const;

export type AllowedStore = (typeof ALLOWED_STORES)[number];

const MAX_SUGGESTED_STORES = ALLOWED_STORES.length;

const ALLOWED_RELATIONSHIPS = [
  "friend",
  "family",
  "partner",
  "colleague",
  "other",
];

export function validatePersonInput(input: {
  name?: string;
  relationship?: string;
  interests?: string[];
  notes?: string;
  shoeSize?: string;
  clothingSize?: string;
  allergies?: string;
  dislikes?: string;
  avatarUrl?: string;
}) {
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length === 0) throw new Error("El nombre es obligatorio.");
    if (trimmed.length > MAX_NAME) throw new Error("Nombre demasiado largo.");
  }
  if (input.relationship !== undefined) {
    if (!ALLOWED_RELATIONSHIPS.includes(input.relationship)) {
      throw new Error("Relación inválida.");
    }
    if (input.relationship.length > MAX_RELATIONSHIP) {
      throw new Error("Relación inválida.");
    }
  }
  if (input.notes !== undefined && input.notes.length > MAX_NOTES) {
    throw new Error("Notas demasiado largas.");
  }
  if (input.interests !== undefined) {
    if (input.interests.length > MAX_INTERESTS) {
      throw new Error("Demasiados intereses.");
    }
    for (const interest of input.interests) {
      if (interest.length > MAX_INTEREST) {
        throw new Error("Interés demasiado largo.");
      }
    }
  }
  if (input.shoeSize !== undefined && input.shoeSize.length > MAX_SIZE) {
    throw new Error("Talla de zapato demasiado larga.");
  }
  if (input.clothingSize !== undefined && input.clothingSize.length > MAX_SIZE) {
    throw new Error("Talla de ropa demasiado larga.");
  }
  if (input.allergies !== undefined && input.allergies.length > MAX_QUIRK) {
    throw new Error("Campo alergias demasiado largo.");
  }
  if (input.dislikes !== undefined && input.dislikes.length > MAX_QUIRK) {
    throw new Error("Campo no le gusta demasiado largo.");
  }
  if (input.avatarUrl !== undefined) {
    if (
      input.avatarUrl.length > MAX_AVATAR_URL ||
      !input.avatarUrl.startsWith(DICEBEAR_PREFIX)
    ) {
      throw new Error("URL de avatar inválida.");
    }
  }
}

export function validateBudget(min?: number, max?: number) {
  for (const [name, value] of [
    ["budgetMin", min],
    ["budgetMax", max],
  ] as const) {
    if (value === undefined) continue;
    if (!Number.isFinite(value) || value < 0 || value > MAX_BUDGET_CENTS) {
      throw new Error(`Presupuesto inválido (${name}).`);
    }
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("Presupuesto mínimo mayor que el máximo.");
  }
}

type RecommendationIdea = {
  title: string;
  description: string;
  priceMinEuros: number;
  priceMaxEuros: number;
  category: string | string[];
  amazonQuery: string;
  suggestedStores?: string[];
};

/**
 * Valida un lote de ideas devuelto por la IA antes de persistirlo.
 * Cap de tamaños y allowlist de tiendas — protege contra clientes que llamen
 * directamente a `api.recommendations.upsert` saltándose la API route.
 */
export function validateRecommendationIdeas(
  ideas: ReadonlyArray<RecommendationIdea>,
) {
  if (ideas.length !== IDEAS_PER_GENERATION) {
    throw new Error(
      `Una recomendación debe contener exactamente ${IDEAS_PER_GENERATION} ideas.`,
    );
  }
  for (const idea of ideas) {
    const title = idea.title.trim();
    if (title.length === 0 || idea.title.length > MAX_IDEA_TITLE) {
      throw new Error("Título de idea inválido.");
    }
    const description = idea.description.trim();
    if (
      description.length === 0 ||
      idea.description.length > MAX_IDEA_DESCRIPTION
    ) {
      throw new Error("Descripción de idea inválida.");
    }
    const categories = Array.isArray(idea.category) ? idea.category : [idea.category];
    if (categories.length === 0 || categories.length > 3 ||
        categories.some(c => c.trim().length === 0 || c.length > MAX_IDEA_CATEGORY)) {
      throw new Error("Categoría de idea inválida.");
    }
    const query = idea.amazonQuery.trim();
    if (query.length === 0 || idea.amazonQuery.length > MAX_IDEA_QUERY) {
      throw new Error("Query de búsqueda inválida.");
    }
    for (const value of [idea.priceMinEuros, idea.priceMaxEuros]) {
      if (
        !Number.isFinite(value) ||
        value < 0 ||
        value > MAX_IDEA_PRICE_EUROS
      ) {
        throw new Error("Precio de idea fuera de rango.");
      }
    }
    if (idea.suggestedStores != null && idea.suggestedStores.length > 0) {
      if (idea.suggestedStores.length > MAX_SUGGESTED_STORES) {
        throw new Error("Cantidad de tiendas sugeridas inválida.");
      }
      const seen = new Set<string>();
      for (const store of idea.suggestedStores) {
        if (!(ALLOWED_STORES as readonly string[]).includes(store)) {
          throw new Error("Tienda sugerida inválida.");
        }
        if (seen.has(store)) {
          throw new Error("Tiendas sugeridas duplicadas.");
        }
        seen.add(store);
      }
    }
  }
}

export function validateSavedIdeaInput(input: {
  occasionLabel: string;
  title: string;
  description: string;
  priceMinEuros: number;
  priceMaxEuros: number;
  category: string | string[];
  amazonQuery: string;
  suggestedStores?: string[];
}) {
  const title = input.title.trim();
  if (title.length === 0 || input.title.length > MAX_IDEA_TITLE) {
    throw new Error("Título de idea inválido.");
  }
  const description = input.description.trim();
  if (description.length === 0 || input.description.length > MAX_IDEA_DESCRIPTION) {
    throw new Error("Descripción de idea inválida.");
  }
  const label = input.occasionLabel.trim();
  if (label.length === 0 || input.occasionLabel.length > MAX_LABEL) {
    throw new Error("Ocasión inválida.");
  }
  const categories = Array.isArray(input.category) ? input.category : [input.category];
  if (
    categories.length === 0 ||
    categories.length > 3 ||
    categories.some((c) => c.trim().length === 0 || c.length > MAX_IDEA_CATEGORY)
  ) {
    throw new Error("Categoría de idea inválida.");
  }
  const query = input.amazonQuery.trim();
  if (query.length === 0 || input.amazonQuery.length > MAX_IDEA_QUERY) {
    throw new Error("Query de búsqueda inválida.");
  }
  for (const value of [input.priceMinEuros, input.priceMaxEuros]) {
    if (!Number.isFinite(value) || value < 0 || value > MAX_IDEA_PRICE_EUROS) {
      throw new Error("Precio de idea fuera de rango.");
    }
  }
  if (input.suggestedStores != null && input.suggestedStores.length > 0) {
    if (input.suggestedStores.length > MAX_SUGGESTED_STORES) {
      throw new Error("Cantidad de tiendas sugeridas inválida.");
    }
    for (const store of input.suggestedStores) {
      if (!(ALLOWED_STORES as readonly string[]).includes(store)) {
        throw new Error("Tienda sugerida inválida.");
      }
    }
  }
}

export function validateDateInput(input: {
  label?: string;
  year?: number;
  recurring?: boolean;
  budgetMin?: number;
  budgetMax?: number;
}) {
  if (input.label !== undefined) {
    const trimmed = input.label.trim();
    if (trimmed.length === 0) throw new Error("La etiqueta es obligatoria.");
    if (trimmed.length > MAX_LABEL) throw new Error("Etiqueta demasiado larga.");
  }
  if (input.recurring === false && input.year === undefined) {
    throw new Error("Las fechas únicas requieren un año.");
  }
  if (input.year !== undefined) {
    if (
      !Number.isInteger(input.year) ||
      input.year < MIN_YEAR ||
      input.year > MAX_YEAR
    ) {
      throw new Error("Año inválido.");
    }
  }
  validateBudget(input.budgetMin, input.budgetMax);
}
