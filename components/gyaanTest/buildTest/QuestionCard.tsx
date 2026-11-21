"use client";

import type { ReactNode } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import AppText from "@/components/ui/AppText";

export type QuestionType = "mcq" | "fill" | "image";

export type Question = {
  id: number;

  dbId?: string; 
  type: QuestionType;
  text: string;
  marks: number;
  options: string[];
  correct: number | null; 
  answer: string; 
  image: { file?: File; url: string } | null;
};

export const newQuestion = (id: number): Question => ({
  id,
  type: "mcq",
  text: "",
  marks: 1,
  options: ["", "", "", ""],
  correct: null,
  answer: "",
  image: null,
});

export const fieldClass =
  "w-full rounded-xl border border-border/60 bg-premium px-3 py-2.5 text-sm text-accent outline-none transition placeholder:text-text-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-accent">{label}</span>
      {children}
    </label>
  );
}

const TYPES: { id: QuestionType; label: string }[] = [
  { id: "mcq", label: "Multiple choice" },
  { id: "fill", label: "Fill in the blank" },
  { id: "image", label: "Image based" },
];

type Props = {
  question: Question;
  index: number;
  canRemove: boolean;
  onChange: (changes: Partial<Question>) => void;
  onRemove: () => void;
};

export default function QuestionCard({ question, index, canRemove, onChange, onRemove }: Props) {
  const { type, options, image } = question;

  const setOption = (i: number, value: string) =>
    onChange({ options: options.map((o, idx) => (idx === i ? value : o)) });

  const setImage = (file?: File) => {
    if (image) URL.revokeObjectURL(image.url);
    onChange({ image: file ? { file, url: URL.createObjectURL(file) } : null });
  };

  return (
    
    <article className="relative space-y-5 rounded-2xl border border-border/50 bg-text-background p-4 shadow-sm sm:p-6">
  
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-accent">
          {index + 1}
        </span>
        <AppText variant="title" className="flex-1 text-accent">
          Question {index + 1}
        </AppText>
        <button
          type="button"
          aria-label={`Remove question ${index + 1}`}
          disabled={!canRemove}
          onClick={onRemove}
          className="rounded-lg p-2 text-warning transition hover:bg-warning/10 disabled:opacity-30"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* Type + marks */}
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-accent">Question type</span>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ type: t.id, correct: null, answer: "" })}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                  type === t.id
                    ? "border-primary bg-primary/10 font-semibold text-accent"
                    : "border-border/60 text-text-primary/70 hover:bg-background"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Marks">
          <input
            type="number"
            min={1}
            max={100}
            required
            value={question.marks}
            onChange={(e) => onChange({ marks: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
            className={fieldClass}
          />
        </Field>
      </div>

      {/* Question text */}
      <Field label={type === "fill" ? "Question (write the blank as _____)" : "Question"}>
        <textarea
          required
          maxLength={2000}
          rows={2}
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={
            type === "fill" ? "Shri Guru _____  ji is First Sikh Guru ." : "Enter your question..."
          }
          className={fieldClass}
        />
      </Field>

      {/* Optional image */}
      {image ? (
        <div className="flex items-center gap-3 rounded-xl border border-border/50 p-2">
          <img src={image.url} alt="Attachment preview" className="size-14 rounded-lg object-cover" />
          <span className="min-w-0 flex-1 truncate text-sm text-text-primary/70">
            {image.file?.name ?? "Current image"}
          </span>
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => setImage()}
            className="rounded-lg p-2 text-warning hover:bg-warning/10"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
      
        <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-accent transition hover:bg-background/60">
          <ImagePlus size={17} />
          Add image (optional)
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setImage(e.target.files?.[0])}
          />
        </label>
      )}

      {/* Answer */}
      {type === "mcq" ? (
        <div className="space-y-2">
          <span className="text-sm font-medium text-accent">
            Options (select the correct one)
          </span>
          {options.map((option, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="radio"
                required
                name={`correct-${question.id}`}
                aria-label={`Option ${i + 1} is correct`}
                checked={question.correct === i}
                onChange={() => onChange({ correct: i })}
                className="size-4 shrink-0 accent-primary"
              />
              <input
                required
                value={option}
                
                onChange={(e) => setOption(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className={fieldClass}
              />
            </div>
          ))}
        </div>
      ) : (
        <Field label="Correct answer">
          <input
            required
            maxLength={500}
            value={question.answer}
            onChange={(e) => onChange({ answer: e.target.value })}
            placeholder="Enter the correct answer"
            className={fieldClass}
          />
        </Field>
      )}
    </article>
  );
}