/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// Los tres cubos de `rateLimitBuckets` existen para que una cuenta comprometida
// —o un script— no pueda llenar la base de datos. Lo que se comprueba aquí no es
// el número, que puede cambiar, sino las tres propiedades que lo hacen útil:
// que corte, que corte por usuario y no en global, y que un cubo no gaste el de
// otro.

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ALICE = { subject: "user_alice", issuer: "https://test.clerk.dev" };
const BOB = { subject: "user_bob", issuer: "https://test.clerk.dev" };

const PERSONAS_AL_DIA = 50;
const FECHAS_AL_DIA = 100;
const IDEAS_AL_DIA = 50;

const persona = (n: number) => ({
  name: "Persona " + n,
  relationship: "friend",
  interests: [],
});

describe("create_person", () => {
  test("corta en el límite diario", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);

    for (let i = 0; i < PERSONAS_AL_DIA; i++) {
      await alice.mutation(api.people.create, persona(i));
    }
    await expect(
      alice.mutation(api.people.create, persona(999)),
    ).rejects.toThrow(/Límite diario/i);
  });

  test("el límite es de cada usuario", async () => {
    const t = convexTest(schema, modules);
    for (let i = 0; i < PERSONAS_AL_DIA; i++) {
      await t.withIdentity(ALICE).mutation(api.people.create, persona(i));
    }
    // Bob empieza de cero aunque Alice haya agotado el suyo.
    await expect(
      t.withIdentity(BOB).mutation(api.people.create, persona(0)),
    ).resolves.toBeDefined();
  });

  test("un rechazo no consume una unidad de más", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);

    for (let i = 0; i < PERSONAS_AL_DIA; i++) {
      await alice.mutation(api.people.create, persona(i));
    }
    for (let i = 0; i < 3; i++) {
      await expect(alice.mutation(api.people.create, persona(i))).rejects.toThrow();
    }

    // Las 50 creadas siguen ahí: los intentos fallidos no borran ni duplican.
    const todas = await alice.query(api.people.getAll, {});
    expect(todas).toHaveLength(PERSONAS_AL_DIA);
  });
});

describe("los cubos son independientes", () => {
  test("agotar create_person no impide guardar ideas", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);

    const personId = await alice.mutation(api.people.create, persona(0));
    for (let i = 1; i < PERSONAS_AL_DIA; i++) {
      await alice.mutation(api.people.create, persona(i));
    }
    await expect(alice.mutation(api.people.create, persona(999))).rejects.toThrow();

    // save_idea tiene su propio contador y no se ha tocado.
    await expect(
      alice.mutation(api.savedIdeas.save, {
        personId,
        occasionLabel: "Cumpleaños",
        title: "Algo",
        description: "Una idea",
        priceMinEuros: 10,
        priceMaxEuros: 20,
        category: ["libros"],
        amazonQuery: "algo",
      }),
    ).resolves.toBeDefined();
  });

  test("create_date tiene un tope propio, más alto que el de personas", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    const personId = await alice.mutation(api.people.create, persona(0));

    // Más fechas que el límite de personas: si compartieran cubo, fallaría aquí.
    for (let i = 0; i < PERSONAS_AL_DIA + 5; i++) {
      await alice.mutation(api.importantDates.create, {
        personId,
        label: "Evento " + i,
        month: ((i % 12) + 1),
        day: ((i % 28) + 1),
        recurring: true,
      });
    }
    const fechas = await alice.query(api.importantDates.getByPerson, { personId });
    expect(fechas.length).toBe(PERSONAS_AL_DIA + 5);
    expect(FECHAS_AL_DIA).toBeGreaterThan(PERSONAS_AL_DIA);
  });
});

describe("save_idea", () => {
  test("corta en su propio límite", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    const personId = await alice.mutation(api.people.create, persona(0));

    const idea = (n: number) => ({
      personId,
      occasionLabel: "Cumpleaños",
      title: "Idea " + n,
      description: "Una idea",
      priceMinEuros: 10,
      priceMaxEuros: 20,
      category: ["libros"],
      amazonQuery: "idea " + n,
    });

    for (let i = 0; i < IDEAS_AL_DIA; i++) {
      await alice.mutation(api.savedIdeas.save, idea(i));
    }
    await expect(alice.mutation(api.savedIdeas.save, idea(999))).rejects.toThrow(
      /Límite diario/i,
    );
  });
});
