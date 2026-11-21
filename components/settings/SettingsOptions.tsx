import { Users, Shield, FileText, MessageSquare, BookOpen, Home, BarChart3, Settings, ChevronRight } from "lucide-react";
import AppText from "@/components/ui/AppText";

const options = [
  { title: "User Management", desc: "View and manage contributors, learners, roles and permissions", icon: Users },
  { title: "Permissions", desc: "Manage roles and access permissions for different sections", icon: Shield },
  { title: "Contribution Requests", desc: "Review and manage new content submissions from contributors", icon: FileText, badge: "28", badgeClass: "bg-error/15 text-error" },
  { title: "Text Requests", desc: "View suggested corrections and improvements", icon: MessageSquare, badge: "6", badgeClass: "bg-success/15 text-success" },
  { title: "Content Management", desc: "Add, edit, and organize all content items", icon: BookOpen },
  { title: "Home Page Settings", desc: "Manage home page sections and layout", icon: Home },
  { title: "Statistics", desc: "View contributors, learners and platform usage data", icon: BarChart3 },
  { title: "General Settings", desc: "Platform preferences and configuration", icon: Settings },
];

export default function SettingsOptions() {
  return (
    <section className="rounded-lg border  min-h-0 border-border/20 bg-text-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Settings size={16} className="text-accent" />
        <AppText variant="subHeading" className="text-accent">Settings Options</AppText>
      </div>
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {options.map(({ title, desc, icon: Icon, badge, badgeClass }) => (
          <div key={title} className="flex items-center gap-3 rounded-md border border-border/10 bg-text-background px-3 py-2.5 cursor-pointer hover:bg-primary/10 duration-200">
            <Icon size={18} className="shrink-0 text-accent" />
            <div className="flex-1 min-w-0">
              <AppText variant="body" className="text-accent">{title}</AppText>
              <AppText variant="small" className="cursor-pointer">{desc}</AppText>
            </div>
            {badge && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{badge}</span>
            )}
            <ChevronRight size={16} className="shrink-0 text-accent" />
          </div>
        ))}
      </div>
    </section>
  );
}