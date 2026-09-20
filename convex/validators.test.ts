/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// `recommendations.upsert` recibe lo que ha producido un modelo de lenguaje,
// pasado por una API route. Ni una cosa ni la otra son de fiar: el esquema Zod
// de `src/lib/gifts.ts` solo es una pista para el modelo, y la route podría
// estar comprometida. Quien manda es este validador.
//
// Importa especialmente el tope de `suggestedStores`: el 20-sep-2026 se quitó
// del esquema de generación porque Gemini 3 rechaza los arrays de enum con
// minItems/maxItems, y la justificación fue "Convex lo sigue acotando". Estos
// tests son esa justificación.

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { ALLOWED_STORES, ALLOWED_IMAGE_KEYS } from "./validators";

const modules = import.meta.glob("./**/*.ts");

const ALICE = { subject: "user_alice", issuer: "https://test.clerk.dev" };

const idea = (over: Record<string, unknown> = {}) => ({
  title: "Rodillo de cerámica",
  description: "Para su taller nuevo",
  priceMinEuros: 30,
  priceMaxEuros: 45,
  category: ["ceramica"],
  amazonQuery: "rodillo ceramica",
  ...over,
});

async function conPersona(t: ReturnType<typeof convexTest>) {
  const alice = t.withIdentity(ALICE);
  const personId = await alice.mutation(api.people.create, {
    name: "Marta",
    relationship: "family",
    interests: ["cerámica"],
  });
  return { alice, personId };
}

const upsert = (
  alice: ReturnType<ReturnType<typeof convexTest>["withIdentity"]>,
  personId: string,
  ideas: unknown[],
) =>
  alice.mutation(api.recommendations.upsert, {
    personId: personId as never,
    occasionLabel: "Cumpleaños",
    giftType: "fisica",
    ideas: ideas as never,
  });

describe("cuántas ideas se aceptan", () => {
  test("una tanda normal entra", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, Array.from({ length: 9 }, (_, i) => idea({ title: "Idea " + i }))),
    ).resolves.toBeDefined();
  });

  test("una tanda corta entra: el dedupe de títulos puede dejar menos de nueve", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(upsert(alice, personId, [idea()])).resolves.toBeDefined();
  });

  test("cero ideas se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(upsert(alice, personId, [])).rejects.toThrow();
  });

  test("más de nueve se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, Array.from({ length: 10 }, (_, i) => idea({ title: "Idea " + i }))),
    ).rejects.toThrow();
  });
});

describe("suggestedStores: el tope que ya no está en el esquema de generación", () => {
  test("una lista válida entra", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [idea({ suggestedStores: ["amazon", "decathlon"] })]),
    ).resolves.toBeDefined();
  });

  test("una tienda inventada se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [idea({ suggestedStores: ["tienda-que-no-existe"] })]),
    ).rejects.toThrow();
  });

  test("más tiendas que la allowlist se rechaza, aunque todas sean válidas", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    // Repetidas para pasarse del tope sin usar ningún id inválido: esto es lo
    // que el esquema Zod ya no puede frenar.
    const demasiadas = [...ALLOWED_STORES, ...ALLOWED_STORES];
    await expect(
      upsert(alice, personId, [idea({ suggestedStores: demasiadas })]),
    ).rejects.toThrow();
  });
});

describe("otros campos que vienen del modelo", () => {
  test("una imageKey fuera del catálogo se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [idea({ imageKey: "no-existe" })]),
    ).rejects.toThrow();
  });

  test("una imageKey del catálogo entra", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [idea({ imageKey: ALLOWED_IMAGE_KEYS[0] })]),
    ).resolves.toBeDefined();
  });

  test("un logo de marca fuera del CDN de Brandfetch se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [
        idea({
          matchedBrandStores: [
            {
              brand: "Decathlon",
              domain: "decathlon.es",
              logoUrl: "https://evil.example.com/logo.png",
            },
          ],
        }),
      ]),
    ).rejects.toThrow();
  });

  test("un título desmesurado se rechaza", async () => {
    const t = convexTest(schema, modules);
    const { alice, personId } = await conPersona(t);
    await expect(
      upsert(alice, personId, [idea({ title: "x".repeat(5000) })]),
    ).rejects.toThrow();
  });
});

describe("propiedad", () => {
  test("no se pueden escribir recomendaciones sobre la persona de otro", async () => {
    const t = convexTest(schema, modules);
    const { personId } = await conPersona(t);
    const bob = t.withIdentity({ subject: "user_bob", issuer: "https://test.clerk.dev" });
    await expect(upsert(bob, personId, [idea()])).rejects.toThrow();
  });
});
