"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function UserInitializer() {
  const { isLoaded, isSignedIn } = useAuth();
  const ensureDefaults = useMutation(api.settings.ensureDefaults);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      ensureDefaults();
    }
  }, [isLoaded, isSignedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
