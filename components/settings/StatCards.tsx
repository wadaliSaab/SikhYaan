import { Users, GraduationCap, FileText, MessageSquare, ArrowRight } from "lucide-react";
import AppText from "@/components/ui/AppText";

const stats = [
  { value: "12", title: "Contributors", desc: "People who submit content", icon: Users, color: "bg-primary/20 text-primary" },
  { value: "1,248", title: "Learners", desc: "People who read content", icon: GraduationCap, color: "bg-secondary-primary/15 text-secondary-primary" },
  { value: "28", title: "Pending Contributions", desc: "Content waiting for review", icon: FileText, color: "bg-error/15 text-error" },
  { value: "6", title: "Text Requests", desc: "Correction / improvement requests", icon: MessageSquare, color: "bg-success/15 text-success" },
];

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ value, title, desc, icon: Icon, color }) => (
        <div key={title} className="flex flex-col gap-2 rounded-lg border border-border/20 bg-text-background p-4 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${color}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <AppText variant="heading" className="font-roboto-serif text-accent leading-none">{value}</AppText>
              <AppText variant="body" className="text-accent">{title}</AppText>
            </div>
            <ArrowRight size={14} className="text-accent" />
          </div>
          <AppText variant="small" className="cursor-default">{desc}</AppText>
        </div>
      ))}
    </div>
  );
}