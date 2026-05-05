// Límites espejados de src/lib/schemas.ts. La validación cliente es UX;
// estas comprobaciones son la frontera de confianza del servidor.

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
  budgetMin?: number;
  budgetMax?: number;
  shoeSize?: string;
  clothingSize?: string;
  allergies?: string;
  dislikes?: string;
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
  validateBudget(input.budgetMin, input.budgetMax);
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
}

function validateBudget(min?: number, max?: number) {
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

export function validateDateInput(input: {
  label?: string;
  year?: number;
}) {
  if (input.label !== undefined) {
    const trimmed = input.label.trim();
    if (trimmed.length === 0) throw new Error("La etiqueta es obligatoria.");
    if (trimmed.length > MAX_LABEL) throw new Error("Etiqueta demasiado larga.");
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
}
