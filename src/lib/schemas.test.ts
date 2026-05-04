import { describe, expect, it } from "vitest";
import { importantDateSchema, personFormSchema } from "./schemas";

describe("personFormSchema", () => {
  const validPerson = {
    name: "María",
    relationship: "friend" as const,
    interests: ["lectura"],
    notes: "Le gusta el café",
    budgetMinEuros: 20,
    budgetMaxEuros: 50,
    dates: [],
  };

  it("acepta una persona válida con todos los campos", () => {
    expect(personFormSchema.safeParse(validPerson).success).toBe(true);
  });

  it("acepta una persona sólo con campos obligatorios", () => {
    expect(
      personFormSchema.safeParse({
        name: "Pedro",
        relationship: "family",
        interests: [],
        dates: [],
      }).success,
    ).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = personFormSchema.safeParse({ ...validPerson, name: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza nombre con más de 80 caracteres", () => {
    const result = personFormSchema.safeParse({
      ...validPerson,
      name: "x".repeat(81),
    });
    expect(result.success).toBe(false);
  });

  it("recorta espacios en el nombre", () => {
    const result = personFormSchema.parse({
      ...validPerson,
      name: "  Lucía  ",
    });
    expect(result.name).toBe("Lucía");
  });

  it("rechaza relación no permitida", () => {
    const result = personFormSchema.safeParse({
      ...validPerson,
      relationship: "boss",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza presupuesto mínimo mayor que máximo", () => {
    const result = personFormSchema.safeParse({
      ...validPerson,
      budgetMinEuros: 100,
      budgetMaxEuros: 50,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("budgetMaxEuros")))
        .toBe(true);
    }
  });

  it("acepta mínimo igual a máximo", () => {
    expect(
      personFormSchema.safeParse({
        ...validPerson,
        budgetMinEuros: 30,
        budgetMaxEuros: 30,
      }).success,
    ).toBe(true);
  });

  it("rechaza más de 20 intereses", () => {
    const result = personFormSchema.safeParse({
      ...validPerson,
      interests: Array.from({ length: 21 }, (_, i) => `interés ${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza más de 10 fechas", () => {
    const validDate = { label: "Fecha", month: 6, day: 15 };
    const result = personFormSchema.safeParse({
      ...validPerson,
      dates: Array.from({ length: 11 }, () => validDate),
    });
    expect(result.success).toBe(false);
  });
});

describe("importantDateSchema", () => {
  const validDate = { label: "Cumpleaños", month: 6, day: 15 };

  it("acepta una fecha válida sin año", () => {
    expect(importantDateSchema.safeParse(validDate).success).toBe(true);
  });

  it("acepta una fecha válida con año", () => {
    expect(
      importantDateSchema.safeParse({ ...validDate, year: 1990 }).success,
    ).toBe(true);
  });

  it("rechaza etiqueta vacía", () => {
    expect(
      importantDateSchema.safeParse({ ...validDate, label: "" }).success,
    ).toBe(false);
  });

  it("rechaza mes fuera de rango", () => {
    expect(
      importantDateSchema.safeParse({ ...validDate, month: 0 }).success,
    ).toBe(false);
    expect(
      importantDateSchema.safeParse({ ...validDate, month: 13 }).success,
    ).toBe(false);
  });

  it("rechaza día fuera de rango", () => {
    expect(
      importantDateSchema.safeParse({ ...validDate, day: 0 }).success,
    ).toBe(false);
    expect(
      importantDateSchema.safeParse({ ...validDate, day: 32 }).success,
    ).toBe(false);
  });

  it("rechaza 31 de febrero", () => {
    expect(
      importantDateSchema.safeParse({ label: "x", month: 2, day: 31 }).success,
    ).toBe(false);
  });

  it("rechaza 31 de abril (mes corto)", () => {
    expect(
      importantDateSchema.safeParse({ label: "x", month: 4, day: 31 }).success,
    ).toBe(false);
  });

  it("acepta 29 de febrero (válido en años bisiestos)", () => {
    expect(
      importantDateSchema.safeParse({ label: "x", month: 2, day: 29 }).success,
    ).toBe(true);
  });

  it("rechaza año fuera de rango", () => {
    expect(
      importantDateSchema.safeParse({ ...validDate, year: 1800 }).success,
    ).toBe(false);
    expect(
      importantDateSchema.safeParse({ ...validDate, year: 2200 }).success,
    ).toBe(false);
  });
});
