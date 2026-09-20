import { v, ConvexError } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { requireUser } from "./auth";
import { checkAndIncrement } from "./rateLimit";

const MAX_INVITEES_PER_PERSON = 20;
const INVITE_DAILY_LIMIT = 20;
const MAX_CLERK_ID_LENGTH = 100;

/**
 * ¿Puede `clerkUserId` ver/editar `person`? Dueño (`people.clerkUserId`) o
 * invitado (fila en `personShares`). Punto único de la comprobación que antes
 * era una simple igualdad — cualquier archivo que necesite saber si alguien
 * tiene acceso a una persona pasa por aquí.
 */
export async function personHasAccess(
  ctx: QueryCtx | MutationCtx,
  person: Doc<"people"> | null,
  clerkUserId: string,
): Promise<boolean> {
  if (!person) return false;
  if (person.clerkUserId === clerkUserId) return true;
  const share = await ctx.db
    .query("personShares")
    .withIndex("by_person_and_user", (q) =>
      q.eq("personId", person._id).eq("clerkUserId", clerkUserId),
    )
    .unique();
  return share !== null;
}

/**
 * Busca la persona y exige acceso (dueño o invitado). Mismo mensaje si no
 * existe o si no es tuya ni te la han compartido — el cliente no puede
 * distinguir los dos casos (docs/security.md §5).
 */
export async function assertPersonAccess(
  ctx: QueryCtx | MutationCtx,
  personId: Id<"people">,
  clerkUserId: string,
  notFoundMessage = "Persona no encontrada.",
): Promise<Doc<"people">> {
  const person = await ctx.db.get(personId);
  if (!(await personHasAccess(ctx, person, clerkUserId))) {
    throw new ConvexError(notFoundMessage);
  }
  return person as Doc<"people">;
}

/**
 * Solo quien la creó. Compartir amplía casi todos los permisos, pero no
 * estos: borrar la ficha para todos e invitar a más gente siguen siendo cosa
 * exclusiva del dueño (decisión 1 y "empieza por el punto 3" de
 * docs/encargo-compartir.md).
 */
export function assertIsOwner(
  person: Doc<"people"> | null,
  clerkUserId: string,
  message = "Persona no encontrada.",
): Doc<"people"> {
  if (!person || person.clerkUserId !== clerkUserId) {
    throw new ConvexError(message);
  }
  return person;
}

/** Usado por `deletePersonCascade`: sin esto, borrar una persona compartida
 * dejaría filas de `personShares` huérfanas apuntando a un `personId` muerto. */
export async function deleteSharesForPerson(
  ctx: MutationCtx,
  personId: Id<"people">,
) {
  const shares = await ctx.db
    .query("personShares")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .collect();
  for (const s of shares) await ctx.db.delete(s._id);
}

/**
 * Todas las fichas ajenas que se han compartido con `clerkUserId`: las deja
 * de ver todas de golpe. Se usa al borrar la cuenta — es la versión en bloque
 * de `leave`, para las fichas que este usuario no posee.
 */
export async function deleteSharesForUser(
  ctx: MutationCtx,
  clerkUserId: string,
) {
  const shares = await ctx.db
    .query("personShares")
    .withIndex("by_user", (q) => q.eq("clerkUserId", clerkUserId))
    .collect();
  for (const s of shares) await ctx.db.delete(s._id);
}

/**
 * El invitado con la fila más antigua de `personId`, o `null` si no hay
 * ninguno. Es quien recibe la propiedad si quien creó la ficha cierra su
 * cuenta (decisión 6 de docs/dudas.md): bloquear el borrado no es opción
 * —irse es un derecho RGPD— y borrar en cascada castigaría a alguien que no
 * tomó esa decisión.
 */
export async function oldestInviteeClerkUserId(
  ctx: MutationCtx,
  personId: Id<"people">,
): Promise<string | null> {
  const [oldest] = await ctx.db
    .query("personShares")
    .withIndex("by_person", (q) => q.eq("personId", personId))
    .order("asc")
    .take(1);
  return oldest?.clerkUserId ?? null;
}

/**
 * Si `person` tiene invitados, transfiere la propiedad al más antiguo —y
 * borra su fila de invitado, que ya no aplica— y devuelve su `clerkUserId`.
 * Si no tiene ninguno, no toca nada y devuelve `null`: quien la llama decide
 * qué hacer (normalmente, borrar la ficha con `deletePersonCascade`).
 */
export async function transferToOldestInviteeOrNull(
  ctx: MutationCtx,
  person: Doc<"people">,
): Promise<string | null> {
  const heir = await oldestInviteeClerkUserId(ctx, person._id);
  if (!heir) return null;
  await ctx.db.patch(person._id, { clerkUserId: heir });
  const heirShare = await ctx.db
    .query("personShares")
    .withIndex("by_person_and_user", (q) =>
      q.eq("personId", person._id).eq("clerkUserId", heir),
    )
    .unique();
  if (heirShare) await ctx.db.delete(heirShare._id);
  return heir;
}

export const listMembers = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);
    const person = await assertPersonAccess(ctx, personId, clerkUserId);
    const shares = await ctx.db
      .query("personShares")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .collect();
    return {
      ownerClerkUserId: person.clerkUserId,
      isOwner: person.clerkUserId === clerkUserId,
      invitees: shares.map((s) => ({
        clerkUserId: s.clerkUserId,
        since: s._creationTime,
      })),
    };
  },
});

/**
 * Concede acceso a `clerkUserId` (ya resuelto server-side a partir de un
 * email por `src/app/api/people/[personId]/share/route.ts`, vía Clerk). Solo
 * el dueño puede invitar — no hay reparto de la capacidad de compartir.
 */
export const invite = mutation({
  args: { personId: v.id("people"), clerkUserId: v.string() },
  handler: async (ctx, { personId, clerkUserId: targetClerkUserId }) => {
    const clerkUserId = await requireUser(ctx);
    assertIsOwner(
      await ctx.db.get(personId),
      clerkUserId,
      "Solo quien creó la ficha puede compartirla.",
    );

    if (
      targetClerkUserId.length === 0 ||
      targetClerkUserId.length > MAX_CLERK_ID_LENGTH
    ) {
      throw new ConvexError("Identificador de usuario inválido.");
    }
    if (targetClerkUserId === clerkUserId) {
      throw new ConvexError("No puedes compartir la ficha contigo mismo.");
    }

    const existing = await ctx.db
      .query("personShares")
      .withIndex("by_person_and_user", (q) =>
        q.eq("personId", personId).eq("clerkUserId", targetClerkUserId),
      )
      .unique();
    if (existing) return existing._id;

    const shareCount = (
      await ctx.db
        .query("personShares")
        .withIndex("by_person", (q) => q.eq("personId", personId))
        .collect()
    ).length;
    if (shareCount >= MAX_INVITEES_PER_PERSON) {
      throw new ConvexError(
        "Esta ficha ya tiene el máximo de personas invitadas.",
      );
    }

    await checkAndIncrement(
      ctx,
      clerkUserId,
      "invite_person",
      INVITE_DAILY_LIMIT,
    );

    return await ctx.db.insert("personShares", {
      personId,
      clerkUserId: targetClerkUserId,
      role: "invitee",
    });
  },
});

/** Desligarse: deja de ver una ficha que te han compartido. No es borrado —
 * el dueño y el resto de invitados la conservan igual (decisión 1). */
export const leave = mutation({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);
    const share = await ctx.db
      .query("personShares")
      .withIndex("by_person_and_user", (q) =>
        q.eq("personId", personId).eq("clerkUserId", clerkUserId),
      )
      .unique();
    if (!share) {
      throw new ConvexError("No tienes esta ficha compartida contigo.");
    }
    await ctx.db.delete(share._id);
  },
});
