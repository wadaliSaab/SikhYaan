import { ArrowRight } from "lucide-react";
import AppText from "@/components/ui/AppText";



type CardProps = {
  icon?: React.ReactNode;
  title: string;
  value?: string | number;
  description?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  unread?: boolean;
  children?: React.ReactNode;
};

export default function Card({
  icon,
  title,
  value,
  description,
  onClick,
  actions,
  unread,
  children,
}: CardProps) {
  const hasValue = value !== undefined;
  const desc = description && (
    <AppText variant="caption" className="font-normal text-text-secondary wrap-anywhere">
      {description}
    </AppText>
  );

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border/15 bg-text-background p-4 shadow-sm ${
        onClick ? "cursor-pointer transition hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="min-w-0 flex-1">
          {hasValue && (
            <AppText variant="heading" className="font-roboto-serif leading-none text-accent">
              {value}
            </AppText>
          )}
          <div className="flex items-center gap-2">
            <AppText
              variant="body"
              className={`wrap-anywhere ${
                hasValue ? "mt-1 text-base font-normal text-accent" : "text-accent"
              }`}
            >
              {title}
            </AppText>
            {unread && (
              <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          {!hasValue && desc}
        </div>
        {onClick ? <ArrowRight className="h-4 w-4 shrink-0 text-accent" /> : actions}
      </div>
      {hasValue && description && <div className="mt-3">{desc}</div>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}