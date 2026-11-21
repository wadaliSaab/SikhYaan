"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  title: string;
  items: { title: string; referenceId: string; isActive: boolean }[];
};

export default function GuruSidebar({ title, items }: Props) {
  const [open, setOpen] = useState(false);
  const children = items.filter((item) => item.isActive);
  if (children.length === 0) return null;

  const list = (
    <div className="hide-scrollbar flex h-full flex-col gap-1 overflow-y-auto">
      {children.map((child) => (
        <Link
          key={child.referenceId}
          href={`/${child.referenceId}`}
          onClick={() => setOpen(false)}
          className="rounded-md p-2 hover:bg-primary/10"
        >
          <AppText variant="caption" className="text-accent">{child.title}</AppText>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-20 hidden min-h-0 w-60 shrink-0 self-start rounded-xl bg-text-background p-3 shadow-sm shadow-shadow/35 md:flex md:flex-col">
        <AppText variant="subHeading" className="mb-3 border-b border-border/20 px-2 pb-3 text-accent">
          {title}
        </AppText>
        {list}
      </aside>

      {/* Mobile: floating menu button */}
      <AppButton
        variant="icon"
        title="Menu"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 rounded-full bg-primary p-3 text-premium shadow-lg md:hidden"
      >
        <Menu size={20} />
      </AppButton>

      {/* Mobile: drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-secondary/40 backdrop-blur-sm transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[80%] flex-col bg-text-background p-3 shadow-2xl transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-3 flex items-center justify-between border-b border-border/20 px-2 pb-3">
            <AppText variant="subHeading" className="truncate text-accent">{title}</AppText>
            <AppButton variant="icon" onClick={() => setOpen(false)}>
              <X size={20} />
            </AppButton>
          </div>
          {list}
        </div>
      </div>
    </>
  );
}