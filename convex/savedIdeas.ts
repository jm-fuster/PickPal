import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireUser } from "./auth";
import { checkAndIncrement } from "./rateLimit";
import { validateSavedIdeaInput } from "./validators";
import { assertPersonAccess, personHasAccess } from "./personShares";

export const getByPerson = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const clerkUserId = await requireUser(ctx);
    // Las ideas guardadas SÍ se comparten, con autoría (decisión 10): no se
    // filtran por quién las guardó.
    const person = await ctx.db.get(personId);
    if (!(await personHasAccess(ctx, person, clerkUserId))) return [];
    return ctx.db
      .query("savedIdeas")
      .withIndex("by_person", (q) => q.eq("personId", personId))
      .order("desc")
      .take(200);
  },
});

export const save = mutation({
  args: {
    personId: v.id("people"),
    occasionLabel: v.string(),
    title: v.string(),
    description: v.string(),
    priceMinEuros: v.number(),
    priceMaxEuros: v.number(),
    category: v.union(v.string(), v.array(v.string())),
    amazonQuery: v.string(),
    suggestedStores: v.optional(v.array(v.string())),
    giftType: v.optional(
      v.union(
        v.literal("fisica"),
        v.literal("experiencia"),
        v.literal("tiempo-juntos"),
        v.literal("sorprendeme"),
      ),
    ),
    // Allowlist verificada en validateSavedIdeaInput (ALLOWED_IMAGE_KEYS).
    imageKey: v.optional(v.string()),
    // Foto de stock Pexels; prefijo de URL verificado en validateSavedIdeaInput.
    image: v.optional(
      v.object({
        url: v.string(),
        photographer: v.optional(v.string()),
        photographerUrl: v.optional(v.string()),
      }),
    ),
    // Tienda oficial de cada marca matcheada; dominio/logo verificados en
    // validateSavedIdeaInput (mismo shape que recommendations).
    matchedBrandStores: v.optional(
      v.array(
        v.object({
          brand: v.string(),
          domain: v.string(),
          logoUrl: v.optional(v.string()),
          supportsSearch: v.optional(v.boolean()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireUser(ctx);
    await assertPersonAccess(ctx, args.personId, clerkUserId, "No autorizado");
    validateSavedIdeaInput(args);
    // Dedupe server-side: guardar dos veces la misma idea para la misma
    // ocasión (doble clic, doble pestaña) no crea una segunda fila ni
    // consume rate limit.
    const existing = await ctx.db
      .query("savedIdeas")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    const duplicate = existing.find(
      (s) => s.title === args.title && s.occasionLabel === args.occasionLabel,
    );
    if (duplicate) return duplicate._id;
    await checkAndIncrement(ctx, clerkUserId, "save_idea", 50);
    return ctx.db.insert("savedIdeas", { clerkUserId, ...args });
  },
});

export const remove = mutation({
  args: { id: v.id("savedIdeas") },
  handler: async (ctx, { id }) => {
    const clerkUserId = await requireUser(ctx);
    const entry = await ctx.db.get(id);
    if (!entry) throw new ConvexError("No autorizado");
    // Igual que el historial: quitar una idea guardada es de quien tiene
    // acceso a la ficha, no solo de quien la guardó.
    await assertPersonAccess(ctx, entry.personId, clerkUserId, "No autorizado");
    await ctx.db.delete(id);
  },
});
