"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Timer, XCircle } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import { fieldClass } from "@/components/gyaanTest/buildTest/QuestionCard";
import {
  getAttempt,
  getAttemptResult,
  saveAnswer,
  submitAttempt,
  type AnswerData,
  type AttemptForTaking,
  type AttemptResult,
  type ResultAnswer,
  type TakingQuestion,
} from "@/services/gyaan/test.service";

type Answer = number | string;
type Answers = Record<number, Answer>; 
type Q = TakingQuestion &
  Partial<Pick<ResultAnswer, "correctOptionIndex" | "correctAnswer" | "isCorrect" | "marksAwarded">>;

const isAnswered = (a: Answer | null | undefined) => a != null && String(a).trim() !== "";

const toData = (order: number, a: Answer): AnswerData =>
  typeof a === "number" ? { order, selectedOptionIndex: a } : { order, answerText: a };

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const formatTime = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export default function TakeTest({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<AttemptForTaking | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

 
  useEffect(() => {
    getAttempt(attemptId)
      .then((a) => {
        const saved: Answers = {};
        a.questions.forEach((q) => {
          const v = q.type === "MCQ" ? q.selectedOptionIndex : q.answerText;
          if (v != null) saved[q.order] = v; 
        });
        setAnswers(saved);
        setTimeLeft(a.remainingSeconds);
        setAttempt(a);
      })
      .catch(() =>
        getAttemptResult(attemptId)
          .then(setResult)
          .catch((e) => setError(message(e))),
      );
  }, [attemptId]);

  const running = !!attempt && !result;

  /* ─── Timer ─── */
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

 
  useEffect(() => {
    if (running && timeLeft === 0) finish();
   
  }, [running, timeLeft]);

  /* ─── Answers ─── */
  const setAnswer = (order: number, value: Answer) =>
    setAnswers((prev) => ({ ...prev, [order]: value }));

  const persist = (order: number, value: Answer) =>
    saveAnswer(attemptId, toData(order, value)).catch((e) => setError(message(e)));

  /* ─── Submit ─── */
  async function finish() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const data = Object.entries(answers).map(([order, a]) => toData(Number(order), a));
      setResult(await submitAttempt(attemptId, data));
    } catch (e) {
      setError(message(e));
    } finally {
      setSubmitting(false);
    }
  }

  const questions: Q[] = result?.answers ?? attempt?.questions ?? [];
  const submitted = !!result;
  const title = result?.title ?? attempt?.title ?? "";
  const category = result?.category ?? attempt?.category ?? "";
  const totalMarks = result?.totalMarks ?? attempt?.totalMarks ?? 0;
  const answeredCount = questions.filter((q) => isAnswered(answers[q.order])).length;
  const lowTime = !submitted && timeLeft <= 60;

  const handleSubmit = () => {
    const left = questions.length - answeredCount;
    if (left > 0 && !window.confirm(`${left} question(s) unanswered. Submit anyway?`)) return;
    finish();
  };

  const goTo = (order: number) =>
    document.getElementById(`question-${order}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  if (!attempt && !result) {
    return (
      <main className="flex h-full w-full items-center justify-center">
        <AppText variant="body" className={error ? "text-error" : "text-text-primary/65"}>
          {error || "Loading…"}
        </AppText>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 w-full flex-col bg-background">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 p-4">
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3">
          <AppButton
            type="button"
            variant="icon"
            aria-label="Go back"
            onClick={() => window.history.back()}
            className="flex size-10 shrink-0 items-center justify-center rounded-full"
          >
            <ArrowLeft size={20} />
          </AppButton>
          <div className="min-w-0 flex-1">
            <AppText as="h1" variant="heading" className="truncate text-2xl text-accent">
              {title}
            </AppText>
            <AppText variant="caption" className="text-text-primary/65">
              {category} · {questions.length} questions · {totalMarks} marks
            </AppText>
          </div>
          <div
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tabular-nums ${
              lowTime
                ? "border-warning bg-warning/10 text-warning"
                : "border-border/60 bg-text-background text-accent"
            }`}
          >
            <Timer size={17} />
            {result ? (result.status === "TIMED_OUT" ? "Time up" : "Submitted") : formatTime(timeLeft)}
          </div>
        </header>

        {error && (
          <AppText variant="caption" className="shrink-0 text-error">
            {error}
          </AppText>
        )}

        
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:grid lg:grid-cols-[22rem_1fr] lg:overflow-hidden">
        
          <div className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto">
            <section className="order-1 space-y-5 rounded-2xl border border-border/50 bg-text-background p-4 shadow-sm sm:p-6">
              <AppText variant="title" className="text-lg text-accent">
                {result ? "Your result" : "Test summary"}
              </AppText>

              {result ? (
                <>
                  <div className="rounded-xl bg-background/70 px-4 py-5 text-center">
                    <p className="text-4xl font-bold text-accent">
                      {result.score}
                      <span className="text-xl font-semibold text-text-primary/60"> / {totalMarks}</span>
                    </p>
                    <p className="mt-1 text-sm text-text-primary/70">
                      marks scored · {Math.round(result.percentage)}%
                    </p>
                  </div>

                  <dl className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-2.5">
                      <dt className="flex items-center gap-2 text-success">
                        <CheckCircle2 size={16} /> Correct
                      </dt>
                      <dd className="font-semibold text-success">{result.correctAnswers}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-warning/10 px-4 py-2.5">
                      <dt className="flex items-center gap-2 text-warning">
                        <XCircle size={16} /> Wrong
                      </dt>
                      <dd className="font-semibold text-warning">{result.wrongAnswers}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-background/70 px-4 py-2.5">
                      <dt className="text-text-primary/70">Unanswered</dt>
                      <dd className="font-semibold text-text-primary/80">{result.unansweredAnswers}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-background/70 px-4 py-2.5">
                      <dt className="text-text-primary/70">Total marks</dt>
                      <dd className="font-semibold text-accent">{totalMarks}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <div className="flex justify-between rounded-xl bg-background/70 px-4 py-3 text-sm">
                  <span className="text-text-primary/70">
                    {answeredCount} / {questions.length} answered
                  </span>
                  <span className="font-semibold text-accent">{totalMarks} marks</span>
                </div>
              )}

              {/* Question navigator */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-accent">Questions</span>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, i) => {
                    const tone = submitted
                      ? q.isCorrect
                        ? "border-success bg-success/15 text-success"
                        : q.isCorrect === false
                          ? "border-warning bg-warning/15 text-warning"
                          : "border-border/60 text-text-primary/60"
                      : isAnswered(answers[q.order])
                        ? "border-primary bg-primary/15 text-accent"
                        : "border-border/60 text-text-primary/60";
                    return (
                      <button
                        key={q.order}
                        type="button"
                        onClick={() => goTo(q.order)}
                        aria-label={`Go to question ${i + 1}`}
                        className={`flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition hover:opacity-80 ${tone}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {!submitted && (
              <div className="sticky bottom-0 z-10 order-3 flex gap-3 bg-background py-3 lg:static lg:p-0">
                <AppButton
                  type="button"
                  variant="primary"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="min-h-11 flex-1"
                >
                  {submitting ? "Submitting…" : "Submit test"}
                </AppButton>
              </div>
            )}
          </div>

          {/* Right: scrollable questions */}
          <section className="order-2 space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
            {questions.map((q, i) => {
              const a: Answer | null | undefined = submitted
                ? q.type === "MCQ"
                  ? q.selectedOptionIndex
                  : q.answerText
                : answers[q.order];
              const answered = isAnswered(a);
              const correct = q.isCorrect === true;

              return (
                <article
                  key={q.order}
                  id={`question-${q.order}`}
                  className={`space-y-4 rounded-2xl border bg-text-background p-4 shadow-sm sm:p-6 ${
                    submitted
                      ? correct
                        ? "border-success/60"
                        : answered
                          ? "border-warning/60"
                          : "border-border/50"
                      : "border-border/50"
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-accent">
                      {i + 1}
                    </span>
                    <AppText variant="label" className="flex-1 pt-1 text-accent">
                      {q.text}
                    </AppText>
                    {submitted ? (
                      <span
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          correct ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                        }`}
                      >
                        {correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {q.marksAwarded ?? 0}/{q.marks}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-background px-3 py-1 text-xs font-medium text-text-primary/70">
                        {q.marks} {q.marks === 1 ? "mark" : "marks"}
                      </span>
                    )}
                  </div>

                  {q.imageUrl && (
                    <img
                      src={q.imageUrl}
                      alt={`Question ${i + 1} illustration`}
                      className="max-h-64 rounded-xl object-contain"
                    />
                  )}

                  {/* Answer area */}
                  {q.type === "MCQ" ? (
                    <div className="space-y-2">
                      {q.options.map((option, idx) => {
                        const selected = a === idx;
                        const isRight = idx === q.correctOptionIndex;

                        let tone = "border-border/60 hover:bg-background";
                        if (submitted) {
                          if (isRight) tone = "border-success bg-success/10 text-success";
                          else if (selected) tone = "border-warning bg-warning/10 text-warning";
                          else tone = "border-border/40 text-text-primary/60";
                        } else if (selected) {
                          tone = "border-primary bg-primary/10 font-semibold text-accent";
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={submitted}
                            onClick={() => {
                              setAnswer(q.order, idx);
                              persist(q.order, idx);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${tone}`}
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{option}</span>
                            {submitted && isRight && <CheckCircle2 size={18} />}
                            {submitted && selected && !isRight && <XCircle size={18} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={typeof a === "string" ? a : ""}
                        disabled={submitted}
                        onChange={(e) => setAnswer(q.order, e.target.value)}
                        onBlur={(e) => persist(q.order, e.target.value)}
                        placeholder="Type your answer"
                        className={`${fieldClass} ${
                          submitted
                            ? correct
                              ? "border-success bg-success/10"
                              : "border-warning bg-warning/10"
                            : ""
                        }`}
                      />
                      {submitted && !correct && (
                        <p className="text-sm text-success">Correct answer: {q.correctAnswer}</p>
                      )}
                    </div>
                  )}

                  {submitted && !answered && (
                    <p className="text-sm text-text-primary/60">Not answered</p>
                  )}
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}