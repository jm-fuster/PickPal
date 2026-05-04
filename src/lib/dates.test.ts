import { describe, expect, it } from "vitest";
import {
  computeDaysUntilNextOccurrence,
  formatDayMonth,
  formatDaysUntil,
} from "./dates";

describe("computeDaysUntilNextOccurrence", () => {
  it("devuelve 0 si la fecha es hoy", () => {
    const today = new Date(2026, 5, 15); // 15 jun 2026
    expect(computeDaysUntilNextOccurrence(6, 15, today)).toBe(0);
  });

  it("devuelve 1 si la fecha es mañana", () => {
    const today = new Date(2026, 5, 15);
    expect(computeDaysUntilNextOccurrence(6, 16, today)).toBe(1);
  });

  it("salta al año siguiente si la fecha ya pasó este año", () => {
    const today = new Date(2026, 5, 15); // 15 jun 2026
    // 1 ene del año siguiente = 200 días
    expect(computeDaysUntilNextOccurrence(1, 1, today)).toBe(200);
  });

  it("calcula bien atravesando fin de año", () => {
    const today = new Date(2026, 11, 30); // 30 dic 2026
    expect(computeDaysUntilNextOccurrence(1, 5, today)).toBe(6);
  });

  describe("29 de febrero", () => {
    it("en año bisiesto, calcula desde la fecha real", () => {
      const today = new Date(2028, 1, 1); // 1 feb 2028 (bisiesto)
      expect(computeDaysUntilNextOccurrence(2, 29, today)).toBe(28);
    });

    it("en año NO bisiesto, hace fallback al 28 de febrero", () => {
      const today = new Date(2026, 1, 1); // 1 feb 2026 (no bisiesto)
      // Sin fallback, computaría 28 días al "29 feb 2026" (que en JS es 1 mar).
      // Con fallback al 28 feb, son 27 días.
      expect(computeDaysUntilNextOccurrence(2, 29, today)).toBe(27);
    });

    it("en año NO bisiesto, si ya pasó el 28-feb, salta al 29-feb del siguiente bisiesto", () => {
      const today = new Date(2027, 2, 1); // 1 mar 2027 (no bisiesto, día después del fallback)
      // Próxima ocurrencia: 29 feb 2028.
      const result = computeDaysUntilNextOccurrence(2, 29, today);
      // 1 mar 2027 → 29 feb 2028 = 365 días (2028 es bisiesto pero contamos
      // desde marzo, así que un año estándar no bisiesto desde el punto de vista
      // del cómputo: 365 días).
      expect(result).toBe(365);
    });
  });

  it("trata correctamente años bisiestos para el 1 de marzo", () => {
    // No regresión: el fix del 29-feb no debe afectar al 1 de marzo.
    const today = new Date(2028, 1, 28); // 28 feb 2028 (bisiesto)
    expect(computeDaysUntilNextOccurrence(3, 1, today)).toBe(2); // 29 feb + 1 mar = 2 días
  });
});

describe("formatDayMonth", () => {
  it("formatea día y mes en español en minúsculas", () => {
    expect(formatDayMonth(1, 1)).toBe("1 de enero");
    expect(formatDayMonth(12, 31)).toBe("31 de diciembre");
    expect(formatDayMonth(7, 4)).toBe("4 de julio");
  });
});

describe("formatDaysUntil", () => {
  it("'Hoy' para 0", () => {
    expect(formatDaysUntil(0)).toBe("Hoy");
  });

  it("'Mañana' para 1", () => {
    expect(formatDaysUntil(1)).toBe("Mañana");
  });

  it("'En N días' para >= 2", () => {
    expect(formatDaysUntil(2)).toBe("En 2 días");
    expect(formatDaysUntil(30)).toBe("En 30 días");
    expect(formatDaysUntil(365)).toBe("En 365 días");
  });
});
