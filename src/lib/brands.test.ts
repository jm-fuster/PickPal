import { describe, expect, it } from "vitest";
import {
  findBrandStore,
  generateBrandProductSearchUrl,
  generateBrandSearchUrl,
  generateBrandStoreUrl,
  matchFavoriteBrands,
  normalizeBrandDomain,
} from "./brands";

const idea = (title: string, amazonQuery: string) => ({ title, amazonQuery });

describe("matchFavoriteBrands", () => {
  it("devuelve [] sin marcas favoritas", () => {
    expect(matchFavoriteBrands(idea("Auriculares Sony", "auriculares sony"), [])).toEqual([]);
    expect(matchFavoriteBrands(idea("Auriculares", "auriculares"), undefined)).toEqual([]);
  });

  it("detecta una marca en el título", () => {
    expect(
      matchFavoriteBrands(idea("Set LEGO Star Wars", "set construccion"), ["LEGO"]),
    ).toEqual(["LEGO"]);
  });

  it("detecta una marca en la query aunque no esté en el título", () => {
    expect(
      matchFavoriteBrands(idea("Zapatillas de running", "zapatillas nike running talla 42"), ["Nike"]),
    ).toEqual(["Nike"]);
  });

  it("ignora acentos y mayúsculas", () => {
    expect(
      matchFavoriteBrands(idea("Perfume LANCÔME", "perfume lancome"), ["Lancôme"]),
    ).toEqual(["Lancôme"]);
  });

  it("no casa una marca corta dentro de otra palabra", () => {
    // "HP" no debe casar dentro de "champú".
    expect(matchFavoriteBrands(idea("Champú hidratante", "champu"), ["HP"])).toEqual([]);
  });

  it("casa marcas de varias palabras", () => {
    expect(
      matchFavoriteBrands(idea("Vale El Corte Inglés", "tarjeta regalo el corte ingles"), [
        "El Corte Inglés",
      ]),
    ).toEqual(["El Corte Inglés"]);
  });

  it("devuelve varias marcas deduplicadas en el orden definido", () => {
    expect(
      matchFavoriteBrands(idea("Mando Sony para consola Sony", "mando nike sony"), [
        "Nike",
        "Sony",
      ]),
    ).toEqual(["Nike", "Sony"]);
  });

  it("devuelve [] cuando ninguna marca aparece", () => {
    expect(
      matchFavoriteBrands(idea("Libro de cocina", "libro cocina italiana"), ["Apple", "Nike"]),
    ).toEqual([]);
  });
});

describe("generateBrandSearchUrl", () => {
  it("añade la marca a la query del producto y apunta a Google", () => {
    expect(generateBrandSearchUrl("top blanco", "Brandy Melville")).toBe(
      "https://www.google.com/search?q=top%20blanco%20Brandy%20Melville",
    );
  });

  it("no duplica la marca si la query ya la contiene", () => {
    expect(generateBrandSearchUrl("top brandy melville blanco", "Brandy Melville")).toBe(
      "https://www.google.com/search?q=top%20brandy%20melville%20blanco",
    );
  });

  it("ignora acentos y mayúsculas al deduplicar la marca", () => {
    expect(generateBrandSearchUrl("zapatillas Núñez", "nunez")).toBe(
      "https://www.google.com/search?q=zapatillas%20N%C3%BA%C3%B1ez",
    );
  });

  it("cae a solo la query cuando la marca está vacía", () => {
    expect(generateBrandSearchUrl("vela aromática", "")).toBe(
      "https://www.google.com/search?q=vela%20arom%C3%A1tica",
    );
  });
});

describe("normalizeBrandDomain", () => {
  it("limpia protocolo, www y path a un hostname", () => {
    expect(normalizeBrandDomain("https://www.brandymelville.com/shop")).toBe(
      "brandymelville.com",
    );
    expect(normalizeBrandDomain("Brandymelville.com")).toBe("brandymelville.com");
  });

  it("devuelve null para entradas que no son dominio", () => {
    expect(normalizeBrandDomain("not a domain")).toBeNull();
    expect(normalizeBrandDomain("javascript:alert(1)")).toBeNull();
    expect(normalizeBrandDomain("")).toBeNull();
    expect(normalizeBrandDomain("localhost")).toBeNull();
  });
});

describe("generateBrandStoreUrl", () => {
  it("enlaza directo a la web oficial de la marca", () => {
    expect(generateBrandStoreUrl("brandymelville.com")).toBe(
      "https://brandymelville.com",
    );
  });
});

describe("generateBrandProductSearchUrl", () => {
  it("busca el producto dentro de la web de la marca (ruta /search?q=)", () => {
    expect(
      generateBrandProductSearchUrl("brandymelville.com", "top blanco"),
    ).toBe("https://brandymelville.com/search?q=top%20blanco");
  });
});

describe("findBrandStore", () => {
  const stores = [
    { brand: "Brandy Melville", domain: "brandymelville.com" },
    { brand: "Nike", domain: "nike.com", logoUrl: "https://cdn.brandfetch.io/nike.com/icon" },
  ];

  it("encuentra la tienda comparando sin acentos ni mayúsculas", () => {
    expect(findBrandStore("brandy melville", stores)?.domain).toBe("brandymelville.com");
    expect(findBrandStore("NIKE", stores)?.domain).toBe("nike.com");
  });

  it("devuelve undefined si la marca no se resolvió", () => {
    expect(findBrandStore("Adidas", stores)).toBeUndefined();
    expect(findBrandStore("Nike", undefined)).toBeUndefined();
    expect(findBrandStore("Nike", [])).toBeUndefined();
  });
});
