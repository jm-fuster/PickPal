import { describe, expect, it } from "vitest";
import {
  ANALYTICS_OPT_OUT_KEY,
  asksNotToTrack,
  readAnalyticsOptOut,
  writeAnalyticsOptOut,
} from "./privacySignals";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const brokenStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("asksNotToTrack", () => {
  it("respeta Global Privacy Control", () => {
    expect(asksNotToTrack({ globalPrivacyControl: true })).toBe(true);
  });

  it("respeta Do Not Track", () => {
    expect(asksNotToTrack({ doNotTrack: "1" })).toBe(true);
  });

  it("cuenta la visita si no llega ninguna señal", () => {
    expect(asksNotToTrack({})).toBe(false);
    expect(asksNotToTrack({ doNotTrack: null })).toBe(false);
  });

  it("no toma por negativa una señal desactivada", () => {
    expect(
      asksNotToTrack({ globalPrivacyControl: false, doNotTrack: "0" }),
    ).toBe(false);
  });
});

describe("preferencia de no contar visitas", () => {
  it("se guarda, se lee y se retira", () => {
    const storage = memoryStorage();
    expect(readAnalyticsOptOut(storage)).toBe(false);

    expect(writeAnalyticsOptOut(storage, true)).toBe(true);
    expect(storage.getItem(ANALYTICS_OPT_OUT_KEY)).toBe("1");
    expect(readAnalyticsOptOut(storage)).toBe(true);

    expect(writeAnalyticsOptOut(storage, false)).toBe(true);
    expect(storage.getItem(ANALYTICS_OPT_OUT_KEY)).toBeNull();
    expect(readAnalyticsOptOut(storage)).toBe(false);
  });

  it("sin almacenamiento no hay preferencia ni se finge guardarla", () => {
    expect(readAnalyticsOptOut(undefined)).toBe(false);
    expect(writeAnalyticsOptOut(undefined, true)).toBe(false);
  });

  it("si el navegador bloquea el almacenamiento, no lanza", () => {
    expect(readAnalyticsOptOut(brokenStorage)).toBe(false);
    expect(writeAnalyticsOptOut(brokenStorage, true)).toBe(false);
    expect(writeAnalyticsOptOut(brokenStorage, false)).toBe(false);
  });
});
