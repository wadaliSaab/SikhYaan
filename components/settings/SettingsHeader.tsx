import { ChevronDown } from "lucide-react";
import AppText from "@/components/ui/AppText";

export default function SettingsHeader() {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3">
      <div>
        <AppText variant="heading" as="h2" className="font-roboto-serif text-accent leading-none">
          SikhYaan
        </AppText>
        <AppText variant="small" className="text-accent">Content Manager</AppText>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-premium text-sm font-semibold">
          A
        </div>
        <AppText variant="body" className="text-accent hidden xs:block">Admin</AppText>
        <ChevronDown size={14} className="text-accent" />
      </div>
    </header>
  );
}