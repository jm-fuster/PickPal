import { describe, expect, it } from "vitest";
import { asksNotToTrack } from "./privacySignals";

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
