
"use client";

import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  ListChecks,
} from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";

export type GyaanTest = {
  id: string;
  title: string;
  description: string;
  category: string;
  questions: number;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  status?: "available" | "created" | "completed";
  score?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  timeTakenMinutes?: number;
};

type TestCardProps = {
  test: GyaanTest;
  actionLabel: string;
  onAction: (test: GyaanTest) => void;
  showResult?: boolean;
   highlighted?: boolean;
};

const difficultyStyles: Record<GyaanTest["difficulty"], string> = {
  Beginner: "bg-success/10 text-success",
  Intermediate: "bg-primary/10 text-accent-light",
  Advanced: "bg-warning/10 text-warning",
};

export default function TestCard({
  test,
  actionLabel,
  onAction,
  highlighted = false,
  showResult = false,
}: TestCardProps) {
  return (
        <article
      id={`test-${test.id}`}
      className={`group min-w-75 flex h-full flex-col rounded-2xl border bg-text-background p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_10px_28px_rgba(3,30,68,0.08)] sm:p-5 ${
        highlighted ? "border-primary ring-2 ring-primary/40" : "border-border/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/7 text-accent">
          <BookOpen size={21} strokeWidth={1.8} />
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${difficultyStyles[test.difficulty]}`}
        >
          {test.difficulty}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <AppText
          as="h3"
          variant="title"
          className="line-clamp-2 text-base leading-snug text-accent sm:text-lg"
        >
          {test.title}
        </AppText>

        <AppText
          variant="body"
          className="mt-2 line-clamp-2 leading-relaxed text-text-primary/75"
        >
          {test.description}
        </AppText>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-text-secondary">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <ListChecks size={15} />
            {test.questions} questions
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs">
            <Clock3 size={15} />
            {test.durationMinutes} min
          </span>
        </div>

        {showResult && typeof test.score === "number" && (
          <div className="mt-4 rounded-xl border border-border/40 bg-premium p-3">
            <div className="flex items-center justify-between gap-2">
              <AppText variant="caption" className="text-text-primary/70">
                Your score
              </AppText>
              <AppText
                variant="subtitle"
                className="font-bold text-accent"
              >
                {test.score}%
              </AppText>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, test.score))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <AppButton
        type="button"
        variant="outline"
        onClick={() => onAction(test)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-premium py-2.5 text-sm font-semibold transition hover:border-primary hover:bg-primary/5"
      >
        {actionLabel}
        <ArrowUpRight size={16} />
      </AppButton>
    </article>
  );
}
