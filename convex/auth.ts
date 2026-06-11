import { ConvexError } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Sesión no encontrada. Inicia sesión para continuar.");
  }
  return identity.subject;
}
