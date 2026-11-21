"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, ClipboardList, Info, LayoutList, User, Users, type LucideIcon } from "lucide-react";
import MyRequestsSection from "@/components/settings/sections/MyRequests";
import AppButton from "@/components/ui/AppButton";
import Header from "@/components/ui/Header";
import ProfileSection from "@/components/settings/sections/Profile";
import MembersSection from "@/components/settings/sections/Members";
import NotificationsSection from "@/components/settings/sections/Notifications";
import InfoSection from "@/components/settings/sections/Information";
import { useAuth } from "@/providers/AuthProvider";
import { useCounts } from "@/src/hooks/useCounts";

const CONTENT_MANAGER_PATH = "/settings/content/manager";


export type Role = "guest" | "learner" | "contributor" | "admin";
type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  href?: string; 
};

const ALL: Role[] = ["guest", "learner", "contributor", "admin"];
const MEMBERS: Role[] = ["learner", "contributor", "admin"];
const NAV: NavItem[] = [
  { id: "profile", label: "Profile", icon: User, roles: MEMBERS },
  { id: "members", label: "Members & Requests", icon: Users, roles: ["admin"] },
  { id: "requests", label: "My Requests", icon: ClipboardList, roles: ["learner", "contributor"] },
  { id: "content", label: "Manage Content", icon: LayoutList, roles: ["admin"], href: CONTENT_MANAGER_PATH },
  { id: "notifications", label: "Notifications", icon: Bell, roles: ALL },
  { id: "info", label: "Information", icon: Info, roles: ALL },
];

// ---------- Page ----------

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const role = user.role as Role;
  const counts = useCounts(isLoggedIn);

  const items = NAV.filter((i) => i.roles.includes(role));
  const [selected, setSelected] = useState(items[0].id);
  const tab = items.some((i) => i.id === selected) ? selected : items[0].id;

  const open = (item: NavItem) => (item.href ? router.push(item.href) : setSelected(item.id));
  const unread = counts?.notifications ?? 0;

  return (
    <div className="h-dvh min-h-0 w-full bg-background/50">
      <main className="mx-auto flex h-full min-h-0 w-full max-w-8xl flex-col space-y-5 p-4">
        <Header subtitle="Settings" />

        <div className="flex min-h-0 flex-col gap-5 md:flex-row">
          <nav className="flex gap-1 overflow-x-auto hide-scrollbar md:w-56 md:shrink-0 md:flex-col">
            {items.map((item) => (
              <AppButton
                key={item.id}
                variant="filter"
                active={tab === item.id}
                onClick={() => open(item)}
                className="w-auto shrink-0 md:w-full"
              >
                <item.icon className="h-4 w-4" /> {item.label}
                {item.href && <ArrowRight className="ml-auto h-4 w-4" />}
                {item.id === "notifications" && unread > 0 && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-2xs font-semibold leading-none text-premium md:ml-auto">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </AppButton>
            ))}
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1">
            {tab === "profile" && <ProfileSection />}
            {tab === "members" && <MembersSection />}
            {tab === "notifications" && <NotificationsSection onOpenTab={setSelected} />}
            {tab === "requests" && <MyRequestsSection />}
            {tab === "info" && <InfoSection role={role} />}
          </div>
        </div>
      </main>
    </div>
  );
}