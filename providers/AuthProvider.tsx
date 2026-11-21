"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { AuthUser } from "@/src/types/auth";

export type { AuthUser, UserRole } from "@/src/types/auth";

const guest: AuthUser = {
  id: "",
  name: "Guest",
  email: "",
  role: "guest",
  createdAt: "",
  avatarUrl: null,
};

const AuthContext = createContext<AuthUser>(guest);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  useEffect(() => {
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) window.location.reload(); 
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
}, []);
  return (
    <AuthContext.Provider value={user ?? guest}>{children}</AuthContext.Provider>
  );
}

export const useAuth = () => {

  const user = useContext(AuthContext);
  return { user, isLoggedIn: user.role !== "guest" };
};