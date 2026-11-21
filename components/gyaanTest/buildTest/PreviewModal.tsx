"use client";

import { X } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import type { Question } from "./QuestionCard";

type Props = {
  form: { title: string; category: string; duration: string };
  questions: Question[];
  onClose: () => void;
};

export default function PreviewModal({ form, questions, onClose }: Props) {
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-text-background p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <AppText as="h2" variant="title" className="text-xl text-accent">
            {form.title || "Test preview"}
          </AppText>
          <AppButton
            type="button"
            variant="icon"
            aria-label="Close preview"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-background"
          >
            <X size={19} />
          </AppButton>
        </div>

        <p className="mt-2 text-sm text-text-primary/70">
          {[form.category || "No category", `${form.duration} min`, `${totalMarks} marks`].join(" · ")}
        </p>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border/50 p-3">
              <AppText variant="label" className="text-accent">
                Q{i + 1}. {q.text || "Untitled question"}
              </AppText>

              {q.image && (
                <img src={q.image.url} alt="" className="mt-3 max-h-44 rounded-lg object-contain" />
              )}

              {q.type === "mcq" ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((o, idx) => (
                    <li
                      key={idx}
                      className={idx === q.correct ? "font-semibold text-success" : "text-text-primary/70"}
                    >
                      {String.fromCharCode(65 + idx)}. {o || "—"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-success">Answer: {q.answer || "Not entered"}</p>
              )}

              <p className="mt-2 text-xs text-text-primary/60">{q.marks} marks</p>
            </div>
          ))}
        </div>

        <AppButton type="button" variant="primary" onClick={onClose} className="mt-5 w-full py-2">
          Back to editing
        </AppButton>
      </section>
    </div>
  );
}