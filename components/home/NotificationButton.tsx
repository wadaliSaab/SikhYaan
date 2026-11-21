"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useCounts } from "@/src/hooks/useCounts";

export default function NotificationButton() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const count = useCounts(isLoggedIn)?.total ?? 0; 

  const label = !isLoggedIn
    ? "Settings"
    : count
      ? `Notifications, ${count} unread`
      : "Notifications";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        router.push("/settings");
        router.refresh();
      }}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      className="fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-accent text-premium shadow-lg shadow-shadow/40 transition hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:size-14"
    >
      <Bell size={22} />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-2xs font-semibold leading-none text-premium ring-2 ring-background">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
