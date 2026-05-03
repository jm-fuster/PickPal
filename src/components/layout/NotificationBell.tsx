"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
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
      className="relative inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors"
      aria-label={`${count} fechas próximas`}
      title={`${count} fechas próximas en los próximos ${windowDays} días`}
    >
      <Bell className="size-4" aria-hidden />
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
