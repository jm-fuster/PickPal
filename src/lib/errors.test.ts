import { describe, expect, it } from "vitest";
import { ConvexError } from "convex/values";
import { classifyProviderError, userErrorMessage } from "./errors";

/**
 * Cuerpo real de un 429 de la Gemini API (recortado). El dato que importa es
 * `quotaId`: es lo único que distingue "cuota diaria agotada" (no se arregla
 * reintentando) de "ráfaga por minuto" (sí).
 */
const quotaBody = (quotaId: string) =>
  JSON.stringify({
    error: {
      code: 429,
      message: "You exceeded your current quota.",
      status: "RESOURCE_EXHAUSTED",
      details: [
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [
            {
              quotaMetric:
                "generativelanguage.googleapis.com/generate_content_free_tier_requests",
              quotaId,
            },
          ],
        },
      ],
    },
  });

describe("classifyProviderError", () => {
  it("503 del proveedor → saturación, reintentar en unos minutos", () => {
    const result = classifyProviderError({ statusCode: 503 });
    expect(result.status).toBe(503);
    expect(result.kind).toBe("overloaded");
    expect(result.error).toContain("saturada");
  });

  it("desenvuelve AI_RetryError y lee el statusCode de lastError", () => {
    const result = classifyProviderError({
      name: "AI_RetryError",
      lastError: { statusCode: 503 },
    });
    expect(result.status).toBe(503);
    expect(result.kind).toBe("overloaded");
  });

  it("429 por cuota diaria → manda a mañana, no a reintentar", () => {
    const result = classifyProviderError({
      statusCode: 429,
      responseBody: quotaBody("GenerateRequestsPerDayPerProjectPerModel-FreeTier"),
    });
    expect(result.status).toBe(429);
    expect(result.kind).toBe("quotaDaily");
    expect(result.error).toContain("mañana");
  });

  it("429 por ráfaga → manda a esperar un minuto", () => {
    const result = classifyProviderError({
      statusCode: 429,
      responseBody: quotaBody(
        "GenerateRequestsPerMinutePerProjectPerModel-FreeTier",
      ),
    });
    expect(result.status).toBe(429);
    expect(result.kind).toBe("quotaRate");
    expect(result.error).toContain("minuto");
  });

  it("lee el responseBody cuando viene dentro de lastError", () => {
    const result = classifyProviderError({
      name: "AI_RetryError",
      lastError: {
        statusCode: 429,
        responseBody: quotaBody("GenerateRequestsPerDayPerProjectPerModel"),
      },
    });
    expect(result.kind).toBe("quotaDaily");
  });

  it("429 sin cuerpo reconocible no promete ningún plazo", () => {
    const result = classifyProviderError({ statusCode: 429 });
    expect(result.status).toBe(429);
    expect(result.kind).toBe("quotaUnknown");
    // Prometer el plazo equivocado es peor que no prometer ninguno.
    expect(result.error).not.toContain("mañana");
    expect(result.error).not.toContain("minuto");
  });

  it("los fallos que no son de cuota caen en el mensaje genérico", () => {
    // Lo que lanza el AI SDK cuando Gemini devuelve 9 ideas que no validan.
    const schemaError = new Error("response did not match schema");
    expect(classifyProviderError(schemaError)).toMatchObject({
      status: 500,
      kind: "generic",
    });
    expect(classifyProviderError({ statusCode: 500 }).kind).toBe("generic");
    expect(classifyProviderError({ statusCode: 400 }).kind).toBe("generic");
  });

  it("no revienta con valores que no son objetos", () => {
    for (const value of [null, undefined, "boom", 42]) {
      expect(classifyProviderError(value).status).toBe(500);
    }
  });

  it("ningún mensaje filtra detalles internos del proveedor", () => {
    const leaky = {
      statusCode: 429,
      responseBody: quotaBody("GenerateRequestsPerDayPerProjectPerModel"),
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash",
    };
    const { error } = classifyProviderError(leaky);
    expect(error).not.toContain("googleapis");
    expect(error).not.toContain("gemini");
    expect(error).not.toContain("429");
  });
});

describe("userErrorMessage", () => {
  it("usa el mensaje del ConvexError cuando `data` es un string", () => {
    expect(userErrorMessage(new ConvexError("Nombre demasiado largo."))).toBe(
      "Nombre demasiado largo.",
    );
  });

  it("cae al fallback con cualquier otro error (nunca `err.message` crudo)", () => {
    expect(userErrorMessage(new Error("ECONNREFUSED 127.0.0.1:3210"))).not.toContain(
      "ECONNREFUSED",
    );
    expect(userErrorMessage(new ConvexError({ code: 500 }), "Fallback.")).toBe(
      "Fallback.",
    );
  });
});
