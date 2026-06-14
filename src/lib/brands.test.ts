import { describe, expect, it } from "vitest";
import { generateBrandSearchUrl, matchFavoriteBrands } from "./brands";

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
