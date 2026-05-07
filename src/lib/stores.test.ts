import { describe, expect, it } from "vitest";
import {
  ALL_STORES,
  generateStoreSearchUrl,
  isStoreId,
  pickEffectiveStores,
  sanitizeFavoriteStores,
} from "./stores";

describe("generateStoreSearchUrl", () => {
  it("genera URL de búsqueda en amazon.es", () => {
    expect(generateStoreSearchUrl("amazon", "libro de cocina")).toBe(
      "https://www.amazon.es/s?k=libro%20de%20cocina",
    );
  });

  it("genera URL de búsqueda en aliexpress", () => {
    expect(generateStoreSearchUrl("aliexpress", "auriculares bluetooth")).toBe(
      "https://es.aliexpress.com/w/wholesale-auriculares%20bluetooth.html",
    );
  });

  it("genera URL de búsqueda en miravia", () => {
    expect(generateStoreSearchUrl("miravia", "regalo cumple")).toBe(
      "https://www.miravia.es/search?q=regalo%20cumple",
    );
  });

  it("genera URL de búsqueda en El Corte Inglés", () => {
    expect(
      generateStoreSearchUrl("elcorteingles", "pulsera personalizada"),
    ).toBe(
      "https://www.elcorteingles.es/search/?s=pulsera%20personalizada",
    );
  });

  it("escapa caracteres especiales", () => {
    expect(generateStoreSearchUrl("amazon", "café & té")).toBe(
      "https://www.amazon.es/s?k=caf%C3%A9%20%26%20t%C3%A9",
    );
  });
});

describe("isStoreId", () => {
  it("acepta tiendas conocidas", () => {
    for (const store of ALL_STORES) {
      expect(isStoreId(store)).toBe(true);
    }
  });

  it("rechaza valores desconocidos", () => {
    expect(isStoreId("ebay")).toBe(false);
    expect(isStoreId("etsy")).toBe(false);
    expect(isStoreId("")).toBe(false);
    expect(isStoreId("AMAZON")).toBe(false);
  });
});

describe("sanitizeFavoriteStores", () => {
  it("filtra valores desconocidos", () => {
    expect(
      sanitizeFavoriteStores(["amazon", "ebay", "elcorteingles"]),
    ).toEqual(["amazon", "elcorteingles"]);
  });

  it("descarta tiendas legacy retiradas (etsy)", () => {
    expect(sanitizeFavoriteStores(["amazon", "etsy", "miravia"])).toEqual([
      "amazon",
      "miravia",
    ]);
  });

  it("elimina duplicados manteniendo orden canónico", () => {
    expect(
      sanitizeFavoriteStores([
        "elcorteingles",
        "amazon",
        "amazon",
        "miravia",
      ]),
    ).toEqual(["amazon", "miravia", "elcorteingles"]);
  });

  it("devuelve array vacío si no hay tiendas válidas", () => {
    expect(sanitizeFavoriteStores(["ebay", "shein"])).toEqual([]);
  });
});

describe("pickEffectiveStores", () => {
  it("devuelve todas las favoritas cuando suggestedStores es undefined (idea cacheada pre-v2)", () => {
    const result = pickEffectiveStores(
      ["amazon", "miravia"],
      undefined,
    );
    expect(result).toEqual({
      stores: ["amazon", "miravia"],
      isFallback: false,
    });
  });

  it("devuelve todas las favoritas cuando suggestedStores está vacío", () => {
    const result = pickEffectiveStores(["amazon", "miravia"], []);
    expect(result).toEqual({
      stores: ["amazon", "miravia"],
      isFallback: false,
    });
  });

  it("devuelve la intersección cuando hay solapamiento", () => {
    const result = pickEffectiveStores(
      ["amazon", "aliexpress", "miravia", "elcorteingles"],
      ["amazon", "elcorteingles"],
    );
    expect(result).toEqual({
      stores: ["amazon", "elcorteingles"],
      isFallback: false,
    });
  });

  it("hace fallback a todas las favoritas si no hay intersección", () => {
    const result = pickEffectiveStores(
      ["aliexpress", "miravia"],
      ["amazon", "elcorteingles"],
    );
    expect(result).toEqual({
      stores: ["aliexpress", "miravia"],
      isFallback: true,
    });
  });

  it("filtra tiendas sugeridas inválidas antes de calcular la intersección", () => {
    const result = pickEffectiveStores(
      ["amazon", "miravia"],
      ["amazon", "etsy", "carrefour"],
    );
    expect(result).toEqual({
      stores: ["amazon"],
      isFallback: false,
    });
  });

  it("trata sugerencias con solo tiendas inválidas como ausencia de sugerencia", () => {
    const result = pickEffectiveStores(
      ["amazon", "miravia"],
      ["etsy", "carrefour"],
    );
    expect(result).toEqual({
      stores: ["amazon", "miravia"],
      isFallback: false,
    });
  });

  it("mantiene el orden canónico de favoritas en la intersección", () => {
    const result = pickEffectiveStores(
      ["elcorteingles", "amazon", "miravia"],
      ["miravia", "amazon"],
    );
    // ALL_STORES order: amazon, aliexpress, miravia, elcorteingles
    // favoriteStores debería venir ya en orden canónico desde sanitizeFavoriteStores
    expect(result.stores).toEqual(["amazon", "miravia"]);
  });
});
