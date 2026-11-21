"use client";
import { useEffect, useRef } from "react";
import { socket } from "@/src/lib/socket";

const LOCAL = "notifications:changed";

export const notifyChanged = () => window.dispatchEvent(new Event(LOCAL));


export function useLiveNotifications(onChange: () => void, local = true) {
  const latest = useRef(onChange);

  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    const handle = () => latest.current();

    socket.on("notification:new", handle);
    socket.on("connect", handle);
    if (local) window.addEventListener(LOCAL, handle);

    return () => {
      socket.off("notification:new", handle);
      socket.off("connect", handle);
      if (local) window.removeEventListener(LOCAL, handle);
    };
  }, [local]);
}