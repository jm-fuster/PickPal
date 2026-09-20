/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// El avatar del ser querido se pinta dentro de `url('…')` en un atributo
// `style` del correo de avisos. Son dos contextos anidados —HTML fuera, CSS
// dentro— y `escapeHtml` solo cubre el de fuera: convierte `'` en `&#39;`, que
// el cliente de correo decodifica de vuelta a `'` antes de leer el CSS. Estos
// tests fijan que la URL se percent-encodea, que es lo que sí sobrevive.

import { describe, expect, it } from "vitest";
import { encodeCssUrl } from "./emails";

describe("encodeCssUrl", () => {
  it("deja intacta la URL que genera el picker", () => {
    const url =
      "https://api.dicebear.com/9.x/dylan/svg?seed=pickpal&skinColor[]=ffcd94&mood[]=happy";
    expect(encodeCssUrl(url)).toBe(url);
  });

  it("percent-encodea la comilla que cerraría el url()", () => {
    expect(encodeCssUrl("https://api.dicebear.com/a?b='")).toBe(
      "https://api.dicebear.com/a?b=%27",
    );
  });

  it("no deja escapar del url() aunque la URL traiga la carga entera", () => {
    const payload =
      "https://api.dicebear.com/9.x/dylan/svg?seed=x')}/**/;background-image:url('https://atacante.example/p.png";
    const encoded = encodeCssUrl(payload);
    expect(encoded).not.toContain("'");
    expect(encoded).not.toContain("(");
    expect(encoded).not.toContain(")");
  });

  it("también cubre comillas dobles, barra invertida y espacios", () => {
    expect(encodeCssUrl('a" b\\c')).toBe("a%22%20b%5Cc");
  });
});
