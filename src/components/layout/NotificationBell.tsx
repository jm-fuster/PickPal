"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { computeDaysUntilNextOccurrence } from "@/lib/dates";

export function NotificationBell() {
  const { isLoaded, isSignedIn } = useAuth();
  const ready = isLoaded && isSignedIn;
  const upcoming = useQuery(api.importantDates.getUpcoming, ready ? {} : "skip");
  const settings = useQuery(api.settings.getMine, ready ? {} : "skip");

  const windowDays = settings?.notifyDaysBefore ?? 30;

  const count =
    upcoming?.filter(
      ({ date }) =>
        computeDaysUntilNextOccurrence(date.month, date.day) <= windowDays,
    ).length ?? 0;

  return (
    <Link
      href="/dashboard"
      className="relative inline-flex items-center justify-center size-8 rounded-md hover:bg-muted"
      aria-label={`${count} fechas próximas`}
      title={`${count} fechas próximas en los próximos ${windowDays} días`}
    >
      <BellIcon />
      {count > 0 ? (
        <Badge
          variant="default"
          className="absolute -top-1 -right-1 size-4 p-0 text-[10px] flex items-center justify-center rounded-full"
        >
          {count > 9 ? "9+" : count}
        </Badge>
      ) : null}
    </Link>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
