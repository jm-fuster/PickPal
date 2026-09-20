/// <reference types="vite/client" />
// @vitest-environment edge-runtime

// `notifyDaysBefore` estuvo desde el principio en el schema, validado de 1 a
// 365, y hasta el 20-sep-2026 ninguna pantalla lo exponía: solo se podía tocar
// por API. Ahora hay un control en /settings, así que los rangos que el
// servidor acepta pasan a importar de verdad.

import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import {
  DEFAULT_NOTIFY_DAYS_BEFORE,
  DEFAULT_EMAIL_NOTIFICATIONS_ENABLED,
} from "./settings";

const modules = import.meta.glob("./**/*.ts");

const ALICE = { subject: "user_alice", issuer: "https://test.clerk.dev" };
const BOB = { subject: "user_bob", issuer: "https://test.clerk.dev" };

describe("valores por defecto", () => {
  test("la ventana de la campana arranca en 30", async () => {
    const t = convexTest(schema, modules);
    const s = await t.withIdentity(ALICE).query(api.settings.getMine, {});
    expect(s.notifyDaysBefore).toBe(DEFAULT_NOTIFY_DAYS_BEFORE);
    expect(DEFAULT_NOTIFY_DAYS_BEFORE).toBe(30);
  });

  test("los avisos por correo salen apagados, que es la base legal declarada", async () => {
    const t = convexTest(schema, modules);
    const s = await t.withIdentity(ALICE).query(api.settings.getMine, {});
    expect(s.emailNotificationsEnabled).toBe(false);
    expect(DEFAULT_EMAIL_NOTIFICATIONS_ENABLED).toBe(false);
  });
});

describe("notifyDaysBefore", () => {
  test("acepta los presets que ofrece la interfaz", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    for (const dias of [7, 15, 30, 60, 90]) {
      await alice.mutation(api.settings.setMine, { notifyDaysBefore: dias });
      const s = await alice.query(api.settings.getMine, {});
      expect(s.notifyDaysBefore).toBe(dias);
    }
  });

  test("acepta los extremos del rango", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    for (const dias of [1, 365]) {
      await alice.mutation(api.settings.setMine, { notifyDaysBefore: dias });
      expect((await alice.query(api.settings.getMine, {})).notifyDaysBefore).toBe(dias);
    }
  });

  test("rechaza lo que cae fuera", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    for (const malo of [0, -1, 366, 1000]) {
      await expect(
        alice.mutation(api.settings.setMine, { notifyDaysBefore: malo }),
      ).rejects.toThrow();
    }
  });

  test("rechaza los no enteros", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.withIdentity(ALICE).mutation(api.settings.setMine, { notifyDaysBefore: 7.5 }),
    ).rejects.toThrow();
  });

  test("un valor rechazado no pisa el que ya estaba guardado", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(ALICE);
    await alice.mutation(api.settings.setMine, { notifyDaysBefore: 15 });
    await expect(
      alice.mutation(api.settings.setMine, { notifyDaysBefore: 9999 }),
    ).rejects.toThrow();
    expect((await alice.query(api.settings.getMine, {})).notifyDaysBefore).toBe(15);
  });

  test("los ajustes son de cada usuario", async () => {
    const t = convexTest(schema, modules);
    await t.withIdentity(ALICE).mutation(api.settings.setMine, { notifyDaysBefore: 90 });
    const deBob = await t.withIdentity(BOB).query(api.settings.getMine, {});
    expect(deBob.notifyDaysBefore).toBe(DEFAULT_NOTIFY_DAYS_BEFORE);
  });

  test("sin sesión no se guarda nada", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.settings.setMine, { notifyDaysBefore: 7 }),
    ).rejects.toThrow(/Sesión no encontrada/);
  });
});
