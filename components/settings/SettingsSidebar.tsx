import { BookOpen, Home, FileText, Users, Settings, ArrowLeft } from "lucide-react";
import AppText from "@/components/ui/AppText";

const items = [
  { label: "Content", icon: BookOpen },
  { label: "Home Page", icon: Home },
  { label: "Contributions", icon: FileText },
  { label: "Users", icon: Users },
  { label: "Settings", icon: Settings },
];

export default function SettingsSidebar({ active = "Settings" }: { active?: string }) {
  return (
    <aside className="hidden md:flex w-52 shrink-0 flex-col justify-between p-3">
      <nav className="flex flex-col gap-1">
        {items.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer ${
              active === label ? "bg-primary/20" : "hover:bg-primary/10"
            }`}
          >
            <Icon size={16} className="text-accent" />
            <AppText variant="body" className="text-accent">{label}</AppText>
          </div>
        ))}
      </nav>
      <div className="flex items-center gap-3 px-3 py-2 cursor-pointer">
        <ArrowLeft size={16} className="text-accent" />
        <AppText variant="body" className="text-accent">Collapse</AppText>
      </div>
    </aside>
  );
}