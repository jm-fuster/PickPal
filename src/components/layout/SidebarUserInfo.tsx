"use client";

import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export function SidebarUserInfo() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <UserButton />
      <span className="text-xs text-muted-foreground truncate">{email}</span>
    </div>
  );
}
