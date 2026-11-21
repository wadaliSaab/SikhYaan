import type { LucideIcon } from "lucide-react";

export type Tone = "gold" | "slate" | "red" | "green";

const TONES: Record<Tone, string> = {
  gold: "bg-primary/20 text-primary",
  slate: "bg-accent/10 text-accent",
  red: "bg-error/15 text-error",
  green: "bg-success/15 text-success",
};


export default function IconCircle({ icon: Icon, tone }: { icon: LucideIcon; tone: Tone }) {
  return (
    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
      <Icon className="h-6 w-6" />
    </span>
  );
}