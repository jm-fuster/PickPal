/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// `/privacidad` promete que borrar la cuenta "borra de forma permanente todos
// tus datos". Eso es una afirmación legal, no una funcionalidad: si queda una
// fila huérfana, la página miente. La auditoría de junio encontró exactamente
// ese fallo — `savedIdeas` sobrevivía al borrado — y estos tests existen para
// que no vuelva sin que nadie se entere.

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ALICE = { subject: "user_alice", issuer: "https://test.clerk.dev" };
const BOB = { subject: "user_bob", issuer: "https://test.clerk.dev" };

const IDEA = {
  occasionLabel: "Cumpleaños",
  title: "Rodillo de cerámica",
  description: "Para su taller nuevo",
  priceMinEuros: 30,
  priceMaxEuros: 45,
  category: ["ceramica"],
  amazonQuery: "rodillo ceramica",
  giftType: "fisica" as const,
};

/** Deja a un usuario con una fila en cada tabla que cuelga de él. */
async function sembrar(t: ReturnType<typeof convexTest>, identidad: typeof ALICE) {
  const u = t.withIdentity(identidad);
  const personId = await u.mutation(api.people.create, {
    name: "Marta",
    relationship: "family",
    interests: ["cerámica"],
  });
  await u.mutation(api.importantDates.create, {
    personId,
    label: "Cumpleaños",
    month: 3,
    day: 24,
    recurring: true,
  });
  await u.mutation(api.savedIdeas.save, { personId, ...IDEA });
  await u.mutation(api.giftHistory.create, {
    personId,
    giftName: "Libro",
    occasionLabel: "Cumpleaños",
    year: 2025,
    reaction: "loved",
  });
  await u.mutation(api.settings.ensureDefaults, {});
  return personId;
}

/** Cuenta filas por tabla saltándose las funciones de usuario. */
async function contar(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => ({
    people: (await ctx.db.query("people").collect()).length,
    importantDates: (await ctx.db.query("importantDates").collect()).length,
    savedIdeas: (await ctx.db.query("savedIdeas").collect()).length,
    giftHistory: (await ctx.db.query("giftHistory").collect()).length,
    userSettings: (await ctx.db.query("userSettings").collect()).length,
  }));
}

describe("borrar una persona", () => {
  test("arrastra fechas, ideas guardadas e historial", async () => {
    const t = convexTest(schema, modules);
    const personId = await sembrar(t, ALICE);

    expect(await contar(t)).toMatchObject({
      people: 1,
      importantDates: 1,
      savedIdeas: 1,
      giftHistory: 1,
    });

    await t.withIdentity(ALICE).mutation(api.people.remove, { id: personId });

    expect(await contar(t)).toMatchObject({
      people: 0,
      importantDates: 0,
      // El fallo concreto de la auditoría de junio: esta quedaba huérfana.
      savedIdeas: 0,
      giftHistory: 0,
    });
  });
});

describe("borrar la cuenta", () => {
  test("no deja ninguna fila del usuario", async () => {
    const t = convexTest(schema, modules);
    await sembrar(t, ALICE);

    await t.withIdentity(ALICE).mutation(api.account.deleteMyAccount, {});

    expect(await contar(t)).toEqual({
      people: 0,
      importantDates: 0,
      savedIdeas: 0,
      giftHistory: 0,
      userSettings: 0,
    });
  });

  test("no toca los datos de otro usuario", async () => {
    const t = convexTest(schema, modules);
    await sembrar(t, ALICE);
    await sembrar(t, BOB);

    await t.withIdentity(ALICE).mutation(api.account.deleteMyAccount, {});

    // Queda exactamente el juego de filas de Bob, entero.
    expect(await contar(t)).toEqual({
      people: 1,
      importantDates: 1,
      savedIdeas: 1,
      giftHistory: 1,
      userSettings: 1,
    });
    const deBob = await t.withIdentity(BOB).query(api.people.getAll, {});
    expect(deBob).toHaveLength(1);
  });

  test("sin sesión no se borra nada", async () => {
    const t = convexTest(schema, modules);
    await sembrar(t, ALICE);

    await expect(t.mutation(api.account.deleteMyAccount, {})).rejects.toThrow(
      /Sesión no encontrada/,
    );
    expect((await contar(t)).people).toBe(1);
  });
});
