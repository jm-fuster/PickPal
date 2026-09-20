import { query } from "./_generated/server";
import { requireUser } from "./auth";

/**
 * Copia completa de los datos del usuario autenticado (RGPD art. 15 y 20).
 *
 * Recorre exactamente las mismas tablas que `account.deleteMyAccount`: si una
 * se borra al cerrar la cuenta, es porque es del usuario, y entonces tiene que
 * salir aquí. Cuando se añada una tabla nueva hay que tocar las dos, y
 * `exportData.test.ts` falla si solo se toca una.
 *
 * Igual que el borrado, la autorización es por sesión: `requireUser` saca el
 * `clerkUserId` del JWT y nunca se acepta como argumento, así que nadie puede
 * exportar la cuenta de otro.
 *
 * Los datos van anidados bajo cada persona —sus fechas, su historial, sus
 * ideas— porque una exportación que hay que recomponer a mano no sirve de
 * mucho. Se quitan `_id` y `clerkUserId` de cada fila: son identificadores
 * internos que fuera de la base de datos no significan nada. `_creationTime`
 * se queda, que sí dice algo: cuándo se creó.
 */

/**
 * Quita el ruido interno pero conserva cuándo se creó. El tipo de vuelta
 * mantiene el resto de campos: una exportación tipada como
 * `Record<string, unknown>` obliga a castear en cada uso, y el typecheck deja
 * de avisar si un campo cambia de nombre.
 */
const limpiar = <T extends Record<string, unknown>>(row: T) => {
  const { _id, clerkUserId, personId, ...resto } = row;
  void _id;
  void clerkUserId;
  void personId;
  return resto as Omit<T, "_id" | "clerkUserId" | "personId">;
};

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const clerkUserId = await requireUser(ctx);
    const identity = await ctx.auth.getUserIdentity();

    const people = await ctx.db
      .query("people")
      .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
      .collect();

    const seresQueridos = [];
    for (const person of people) {
      const [fechas, historial, ideasGuardadas, ideasGeneradas] = await Promise.all([
        ctx.db
          .query("importantDates")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .collect(),
        ctx.db
          .query("giftHistory")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .collect(),
        ctx.db
          .query("savedIdeas")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .collect(),
        ctx.db
          .query("recommendations")
          .withIndex("by_person", (q) => q.eq("personId", person._id))
          .collect(),
      ]);

      seresQueridos.push({
        ...limpiar(person),
        fechas: fechas.map(limpiar),
        historialDeRegalos: historial.map(limpiar),
        ideasGuardadas: ideasGuardadas.map(limpiar),
        ideasGeneradasPorLaIA: ideasGeneradas.map(limpiar),
      });
    }

    // Ideas de personas ya borradas: el borrado en cascada las recoge por este
    // mismo índice, así que la exportación también.
    const idsDePersonas = new Set(people.map((p) => p._id));
    const huerfanas = (
      await ctx.db
        .query("savedIdeas")
        .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
        .collect()
    ).filter((s) => !idsDePersonas.has(s.personId));

    const [ajustes, avisos, cuotaIA, cubosDeLimite] = await Promise.all([
      ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
        .collect(),
      ctx.db
        .query("emailNotifications")
        .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
        .collect(),
      ctx.db
        .query("recommendationUsage")
        .withIndex("by_user_day", (q) => q.eq("clerkUserId", clerkUserId))
        .collect(),
      ctx.db
        .query("rateLimitBuckets")
        .withIndex("by_user_day_bucket", (q) => q.eq("clerkUserId", clerkUserId))
        .collect(),
    ]);

    return {
      aplicacion: "PickPal",
      // Qué es cada cosa, para quien abra el archivo sin conocer el esquema.
      leeme:
        "Copia de todos tus datos en PickPal. Los datos de tu cuenta " +
        "(nombre, email, contraseña) los gestiona Clerk y puedes pedirlos allí; " +
        "aquí va lo que guarda PickPal. Las fechas están en milisegundos desde " +
        "1970 y los presupuestos en céntimos.",
      usuario: {
        // El identificador con el que se guarda todo lo de abajo.
        clerkUserId,
        email: identity?.email ?? null,
      },
      ajustes: ajustes.map(limpiar),
      seresQueridos,
      ideasGuardadasDePersonasYaBorradas: huerfanas.map(limpiar),
      avisosPorEmailEnviados: avisos.map(limpiar),
      // Contadores antiabuso. Se reinician cada día y no describen a nadie,
      // pero van igual: son filas asociadas a tu identificador.
      contadoresDeUso: {
        generacionesDeIA: cuotaIA.map(limpiar),
        otrosLimites: cubosDeLimite.map(limpiar),
      },
    };
  },
});
