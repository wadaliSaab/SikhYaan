import React from "react";
import { twMerge } from "tailwind-merge";
import { ArrowRight, FileText, ImageIcon, Languages, PencilLine } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";

type SurfaceColor = "amber" | "sky" | "emerald" | "purple" | "rose";

const colorMap: Record<
  SurfaceColor,
  { card: string; iconBg: string; iconText: string; cta: string }
> = {
  amber: {
    card: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    cta: "bg-amber-100 text-amber-800 hover:bg-amber-200",
  },
  sky: {
    card: "bg-sky-50 border-sky-200",
    iconBg: "bg-sky-100",
    iconText: "text-sky-700",
    cta: "bg-sky-100 text-sky-800 hover:bg-sky-200",
  },
  emerald: {
    card: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    cta: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  },
  purple: {
    card: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
    iconText: "text-purple-700",
    cta: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  },
  rose: {
    card: "bg-rose-50 border-rose-200",
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
    cta: "bg-rose-100 text-rose-800 hover:bg-rose-200",
  },
};

export type SurfaceCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  ctaLabel: string;
  color: SurfaceColor;
  onClick?: () => void;
  className?: string;
};


export function SurfaceCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  color,
  onClick,
  className,
}: SurfaceCardProps) {
  const c = colorMap[color];

  return (
    <div className={twMerge("flex flex-col gap-3 rounded-2xl border p-4", c.card, className)}>
      <span
        className={twMerge(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          c.iconBg,
          c.iconText
        )}
      >
        <Icon className="w-5 h-5" />
      </span>

      <div className="flex flex-col gap-1">
        <AppText as="h3" variant="subHeading">
          {title}
        </AppText>
        <AppText variant="caption" className="text-text-secondary font-normal">
          {description}
        </AppText>
      </div>

      <AppButton
        variant="primary"
        onClick={onClick}
        className={twMerge("bg-transparent! mt-auto flex items-center gap-1.5 justify-start! w-fit", c.cta)}
      >
        <AppText as="span" variant="label" className="no-underline! text-inherit!">
          {ctaLabel}
        </AppText>
        <ArrowRight className="w-3.5 h-3.5" />
      </AppButton>
    </div>
  );
}

const cardsData: Omit<SurfaceCardProps, "onClick">[] = [
  {
    icon: FileText,
    title: "Add Text Content",
    description: "Provide information, explain concepts, write articles or correct existing content.",
    ctaLabel: "Contribute Text",
    color: "amber",
  },
  {
    icon: ImageIcon,
    title: "Add Images",
    description: "Share relevant images, photos, infographics or historical pictures.",
    ctaLabel: "Contribute Images",
    color: "sky",
  },
  {
    icon: Languages,
    title: "Add Translations",
    description: "Help translate content in Punjabi, Hindi, English or other languages.",
    ctaLabel: "Contribute Translation",
    color: "emerald",
  },
  {
    icon: PencilLine,
    title: "Improve Existing",
    description: "Suggest corrections, add more details or improve accuracy.",
    ctaLabel: "Suggest Changes",
    color: "purple",
  },
];

type ContributeCardsProps = {
  onSelect?: (title: string) => void;
  className?: string;
};

export default function ContributeCards({ onSelect, className }: ContributeCardsProps) {
  return (
    <div className={twMerge("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full", className)}>
      {cardsData.map((card) => (
        <SurfaceCard key={card.title} {...card} onClick={() => onSelect?.(card.title)} />
      ))}
    </div>
  );
}