/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// La comprobación de propiedad es la única frontera entre los datos de un
// usuario y los de otro: no hay fila que no cuelgue de `clerkUserId`. Estos
// tests recorren cada función expuesta preguntando dos cosas — ¿exige sesión?
// y ¿deja a un tercero tocar lo que no es suyo? — porque un olvido aquí no
// rompe nada visible, solo filtra.

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ALICE = { subject: "user_alice", issuer: "https://test.clerk.dev" };
const BOB = { subject: "user_bob", issuer: "https://test.clerk.dev" };

const PERSON = {
  name: "Marta",
  relationship: "family",
  interests: ["cerámica"],
};

describe("requireUser", () => {
  test("sin sesión, las queries de lectura fallan", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.people.getAll, {})).rejects.toThrow(
      /Sesión no encontrada/,
    );
  });

  test("sin sesión, no se puede crear", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.people.create, PERSON)).rejects.toThrow(
      /Sesión no encontrada/,
    );
  });

  test("con sesión, se crea y se lee", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    const id = await alice.mutation(api.people.create, PERSON);
    const all = await alice.query(api.people.getAll, {});
    expect(all).toHaveLength(1);
    expect(all[0]._id).toBe(id);
    expect(all[0].name).toBe("Marta");
  });
});

describe("propiedad entre usuarios", () => {
  test("la lista de cada uno solo trae lo suyo", async () => {
    const t = convexTest(schema, modules);
    await t.withIdentity(ALICE).mutation(api.people.create, PERSON);
    await t
      .withIdentity(BOB)
      .mutation(api.people.create, { ...PERSON, name: "Otra" });

    const deAlice = await t.withIdentity(ALICE).query(api.people.getAll, {});
    const deBob = await t.withIdentity(BOB).query(api.people.getAll, {});

    expect(deAlice.map((p) => p.name)).toEqual(["Marta"]);
    expect(deBob.map((p) => p.name)).toEqual(["Otra"]);
  });

  test("getById devuelve null para la persona de otro, no la fila", async () => {
    const t = convexTest(schema, modules);
    const id = await t.withIdentity(ALICE).mutation(api.people.create, PERSON);
    // Bob conoce el id — es lo que pasaría si se filtrara por una URL.
    const visto = await t.withIdentity(BOB).query(api.people.getById, { id });
    expect(visto).toBeNull();
  });

  test("update sobre la persona de otro no la modifica", async () => {
    const t = convexTest(schema, modules);
    const id = await t.withIdentity(ALICE).mutation(api.people.create, PERSON);

    await expect(
      t.withIdentity(BOB).mutation(api.people.update, { id, name: "Secuestrada" }),
    ).rejects.toThrow(/no encontrada/i);

    const sigue = await t.withIdentity(ALICE).query(api.people.getById, { id });
    expect(sigue?.name).toBe("Marta");
  });

  test("remove sobre la persona de otro no la borra", async () => {
    const t = convexTest(schema, modules);
    const id = await t.withIdentity(ALICE).mutation(api.people.create, PERSON);

    await expect(
      t.withIdentity(BOB).mutation(api.people.remove, { id }),
    ).rejects.toThrow(/no encontrada/i);

    expect(await t.withIdentity(ALICE).query(api.people.getById, { id })).not.toBeNull();
  });

  test("no se pueden colgar fechas de la persona de otro", async () => {
    const t = convexTest(schema, modules);
    const personId = await t
      .withIdentity(ALICE)
      .mutation(api.people.create, PERSON);

    await expect(
      t.withIdentity(BOB).mutation(api.importantDates.create, {
        personId,
        label: "Cumpleaños",
        month: 3,
        day: 24,
        recurring: true,
      }),
    ).rejects.toThrow();
  });
});
