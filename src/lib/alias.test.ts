import { describe, expect, it } from "vitest";
import * as viaAlias from "@/lib/dates";
import * as viaRelativo from "./dates";

// Ningún otro test de la suite importa por «@», así que sin esto una rotura
// del alias en vitest.config.mts pasaría desapercibida: los 133 tests
// seguirían en verde porque todos usan rutas relativas.
describe("alias @ de vitest.config.mts", () => {
  it("apunta a src/, y al mismo módulo que la ruta relativa", () => {
    expect(Object.keys(viaAlias).sort()).toEqual(Object.keys(viaRelativo).sort());
    // La identidad de la función es lo que descarta que sean dos copias.
    expect(viaAlias.computeDaysUntil).toBe(viaRelativo.computeDaysUntil);
  });
});
