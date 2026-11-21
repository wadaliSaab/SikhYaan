"use client";
import { useCallback, useEffect, useState } from "react";
import { getCounts, type Counts } from "@/services/settings/notification.sevice";
import { useLiveNotifications } from "@/src/hooks/useLiveNotifications";

const REFRESH_MS = 60_000;


export function useCounts(enabled: boolean) {
  const [counts, setCounts] = useState<Counts | null>(null);

  const refresh = useCallback(() => {
    if (!enabled) return;
    getCounts()
      .then(setCounts)
      .catch(() => {}); 
  }, [enabled]);

  useLiveNotifications(refresh);

  useEffect(() => {
    if (!enabled) return;

    refresh();
    const onVisible = () => document.visibilityState === "visible" && refresh();
    const timer = setInterval(onVisible, REFRESH_MS);

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, refresh]);

  return enabled ? counts : null;
}