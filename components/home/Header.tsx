"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

const navButtons = [
  { label: "Sikh Gurus", href: "/SG-CPW3" },
  { label: "Granth Sahib ji", href: "/SGGSJ-S4CC" },
  { label: "Doubt", href: "/doubt" },
  { label: "Gyaan", href: "/gyaan/test" },
  {label : "Sikh History" , href:"/WITS-VFKK"}
];

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const search = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="w-full shrink-0 bg-primary/20">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2 sm:gap-5 sm:px-5">
        <Image
          src="/sikhyaan_logo.png"
          width={80}
          height={80}
          alt="SikhYaan"
          priority
          className="size-12 shrink-0 sm:size-16 md:size-20"
        />

        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <AppText as="h4" variant="title" className="hidden text-center sm:block">
            Explore, Learn & Discover the Sikh Heritage
          </AppText>

          <form onSubmit={search} className="relative w-full max-w-170">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search to Explore Sikh Heritage..."
              className="golden-border h-10 w-full rounded-full border-4 bg-background px-4 pr-11 text-sm text-text-primary outline-none placeholder:text-center placeholder:text-text-secondary focus:ring-accent"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-accent"
            >
              <Search size={18} />
            </button>
          </form>
        </div>

        <Image
          src="/sikh-symbol.png"
          width={80}
          height={80}
          alt=""
          className="hidden h-16 w-20 shrink-0 object-contain md:block"
        />
      </div>

      <nav className="hide-scrollbar flex w-full overflow-x-auto bg-primary/5 shadow-sm shadow-shadow/60">
        <div className="mx-auto flex shrink-0 gap-5 px-4 pb-1.5 pt-2 sm:gap-8">
          {navButtons.map((button) => (
            <AppButton
              key={button.href}
              variant="link"
              onClick={() => router.push(button.href)}
              className="shrink-0 whitespace-nowrap"
            >
              {button.label}
            </AppButton>
          ))}
        </div>
      </nav>
    </header>
  );
}