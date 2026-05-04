import { describe, expect, it } from "vitest";
import { generateAmazonUrl } from "./amazon";

describe("generateAmazonUrl", () => {
  it("genera URL de búsqueda en amazon.es", () => {
    expect(generateAmazonUrl("libro de cocina")).toBe(
      "https://www.amazon.es/s?k=libro+de+cocina",
    );
  });

  it("escapa caracteres especiales", () => {
    expect(generateAmazonUrl("café & té")).toBe(
      "https://www.amazon.es/s?k=caf%C3%A9+%26+t%C3%A9",
    );
  });

  it("acepta cadenas vacías sin romper", () => {
    expect(generateAmazonUrl("")).toBe("https://www.amazon.es/s?k=");
  });
});
