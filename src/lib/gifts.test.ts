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

  const sixIdeas = Array.from({ length: 6 }, () => validIdea);

  it("acepta exactamente 6 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({ ideas: sixIdeas }).success,
    ).toBe(true);
  });

  it("rechaza menos de 6 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({ ideas: sixIdeas.slice(0, 5) })
        .success,
    ).toBe(false);
  });

  it("rechaza más de 6 ideas", () => {
    expect(
      giftRecommendationsSchema.safeParse({
        ideas: [...sixIdeas, validIdea],
      }).success,
    ).toBe(false);
  });

  it("rechaza idea con título vacío", () => {
    const broken = [...sixIdeas];
    broken[0] = { ...validIdea, title: "" };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });

  it("rechaza idea con precio negativo", () => {
    const broken = [...sixIdeas];
    broken[0] = { ...validIdea, priceMinEuros: -10 };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });

  it("rechaza descripción demasiado larga", () => {
    const broken = [...sixIdeas];
    broken[0] = { ...validIdea, description: "x".repeat(281) };
    expect(
      giftRecommendationsSchema.safeParse({ ideas: broken }).success,
    ).toBe(false);
  });
});
