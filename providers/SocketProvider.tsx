"use client";

import { useEffect } from "react";
import { socket } from "@/src/lib/socket";
import { useAuth } from "@/providers/AuthProvider";


export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn } = useAuth();
  const userId = isLoggedIn ? user.id : null;

  useEffect(() => {
    if (!userId) return;

    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return children;
}