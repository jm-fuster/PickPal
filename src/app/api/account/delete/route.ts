import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export async function POST() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    await fetchMutation(api.account.deleteMyAccount, {}, { token });
  } catch (err) {
    console.error("[account/delete] convex purge:", err);
    return NextResponse.json(
      { error: "No hemos podido borrar tus datos. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch (err) {
    // Idempotencia: si el usuario ya no existe en Clerk (doble submit o
    // reintento tras un borrado parcial), el objetivo está cumplido.
    const status = (err as { status?: number } | null)?.status;
    if (status !== 404) {
      console.error("[account/delete] clerk delete:", err);
      return NextResponse.json(
        {
          error:
            "Tus datos se han borrado pero no hemos podido cerrar tu cuenta. Contacta con soporte.",
        },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
