import { BookOpen, FileText, MessageSquare, Users, Zap } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

const actions = [
  { label: "Add New Content", icon: BookOpen },
  { label: "View Contributions", icon: FileText },
  { label: "View Text Requests", icon: MessageSquare },
  { label: "Manage Users", icon: Users },
];

export default function QuickActions() {
  return (
    <section className="rounded-lg border border-border/20 bg-text-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap size={16} className="text-accent" />
        <AppText variant="subHeading" className="text-accent">Quick Actions</AppText>
      </div>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon }) => (
          <AppButton
            key={label}
            className="flex gap-2 rounded-md border border-primary bg-transparent py-2.5 pb-2.5 text-primary hover:bg-primary/10"
          >
            <Icon size={15} /> {label}
          </AppButton>
        ))}
      </div>
    </section>
  );
}