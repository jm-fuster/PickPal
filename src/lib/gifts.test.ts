import { describe, expect, it } from "vitest";
import { giftRecommendationsSchema } from "./gifts";

describe("giftRecommendationsSchema", () => {
  const validIdea = {
    title: "Libro de cocina",
    description: "Recetas mediterráneas para iniciados",
    priceMinEuros: 15,
    priceMaxEuros: 25,
    category: "Libros",
    amazonQuery: "libro recetas mediterraneas",
  };

  const nineIdeas = Array.from({ length: 9 }, () => validIdea);

  it("acepta exactamente 9 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({ ideas: nineIdeas }).success,
    ).toBe(true);
  });

  it("rechaza menos de 9 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({ ideas: nineIdeas.slice(0, 8) })
        .success,
    ).toBe(false);
  });

  it("rechaza más de 9 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({
        ideas: [...nineIdeas, validIdea],
      }).success,
    ).toBe(false);
  });

  it("rechaza idea con título vacío", () => {
    const broken = [...nineIdeas];
    broken[0] = { ...validIdea, title: "" };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });

  it("rechaza idea con precio negativo", () => {
    const broken = [...nineIdeas];
    broken[0] = { ...validIdea, priceMinEuros: -10 };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });

  it("rechaza descripción demasiado larga", () => {
    const broken = [...nineIdeas];
    broken[0] = { ...validIdea, description: "x".repeat(281) };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });
});
