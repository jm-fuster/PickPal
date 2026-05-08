"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import { GiftsPanel } from "@/components/gifts/GiftsPanel";

export default function GiftsPage({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = use(params);
  const searchParams = useSearchParams();
  const initialOccasion = searchParams.get("occasion") ?? undefined;
  const backHref =
    searchParams.get("from") === "person"
      ? `/seres-queridos/${personId}`
      : "/agenda";

  return (
    <GiftsPanel
      personId={personId as Id<"people">}
      initialOccasion={initialOccasion}
      backHref={backHref}
    />
  );
}
