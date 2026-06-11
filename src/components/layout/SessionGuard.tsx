"use client";

import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";

/**
 * Redirige a sign-in cuando la sesión deja de existir con la app abierta
 * (revocada en otra pestaña, expirada…). Sin esto, todas las queries
 * autenticadas quedan en "skip" y cada página muestra skeletons para siempre.
 */
export function SessionGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void clerk.redirectToSignIn();
    }
  }, [isLoaded, isSignedIn, clerk]);

  return null;
}
