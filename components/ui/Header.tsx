"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Home, LogIn , Power } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

import {useAuth} from "@/providers/AuthProvider";
import { logoutUser } from "@/services/auth.service";


const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
type Props = {
  
  subtitle?: string;
  search?: boolean; 
};

const link = "flex items-center gap-1.5 p-2 hover:text-accent";

export default function Header({  subtitle, search = false }: Props) {
  const { user, isLoggedIn } = useAuth();

  const role = isLoggedIn ? user.role : "guest";

  const router = useRouter();
  const [open, setOpen] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    router.push(`/search?q=${encodeURIComponent(String(q))}`);
    setOpen(false);
  };

  const form = (cls: string) => (
    <form onSubmit={submit} className={`items-center rounded-md border border-border/40 bg-premium px-3 ${cls}`}>
      <input name="q" placeholder="Search Gurus, topics, stories..." className="flex-1 bg-transparent py-2 text-sm outline-none" />
      <AppButton variant="icon" type="submit"><Search size={16} /></AppButton>
    </form>
  );

  const logout = async () => {
  try {
    await logoutUser();
    window.location.replace("/auth");
  } catch {
    alert("Logout failed. Please try again.");
  }
};

  return (
    <header className="sticky top-0 z-40 bg-text-background/70 shadow-sm">
      <div className="mx-auto flex max-w-375 items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0">
          <AppText variant="heading" as="h2" className="font-roboto-serif leading-none text-accent">SikhYaan</AppText>
          <AppText variant="small" className={`cursor-default ${subtitle ? "" : "hidden sm:block"}`}>
            {subtitle ?? "Learn · Contribute · Spread Knowledge"}
          </AppText>
        </Link>

        {search && form("mx-auto hidden w-full max-w-lg md:flex")}

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          {search && (
            <AppButton variant="icon" className="p-2 md:hidden" onClick={() => setOpen(!open)}>
              <Search size={20} />
            </AppButton>
          )}

          <Link href="/" className={link}>
            <Home size={18} /> <AppText variant="body" as="span" className="hidden sm:inline">Home</AppText>
          </Link>

          {role === "guest" ? (
            <Link href="/auth" className={link}>
              <LogIn size={18} /> <AppText variant="body" as="span" className="hidden sm:inline">Login</AppText>
            </Link>
          ) : (
            <AppButton variant="icon" className={link} onClick={logout}>
              <Power size={18} /> <AppText variant="body" as="span" className="hidden sm:inline">Logout</AppText>
            </AppButton>
          )}

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-premium">
              {cap(role)[0]}
            </span>
            <AppText variant="body" as="span" className="hidden text-accent sm:block">{cap(role)}</AppText>
          </div>
        </nav>
      </div>

      {search && open && <div className="px-4 pb-3 md:hidden">{form("flex")}</div>}
    </header>
  );
}