"use client";

import { useRef, useState, type FormEvent,useEffect } from "react";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import { createTest, updateTest, getTestWithAnswers, type CreateTestData, type OwnerQuestion } from "@/services/gyaan/test.service";
import QuestionCard, { Field, fieldClass, newQuestion, type Question, type QuestionType } from "./QuestionCard";
import PreviewModal from "./PreviewModal";



const API_TYPE = { mcq: "MCQ", fill: "FILL", image: "IMAGE" } as const;
const toQuestion = (q: OwnerQuestion, id: number): Question => ({
  id,
  dbId: q.id,
  type: q.type.toLowerCase() as QuestionType,
  text: q.text,
  marks: q.marks,
  options: q.type === "MCQ" ? q.options : ["", "", "", ""],
  correct: q.correctOptionIndex,
  answer: q.correctAnswer ?? "",
  image: q.image ? { url: q.image.url } : null,
});
export default function CreateTest({ testId }: { testId?: string }) {
  const [loading, setLoading] = useState(!!testId);
  const [form, setForm] = useState({ title: "", category: "", duration: "30" });
  const [questions, setQuestions] = useState<Question[]>([newQuestion(1)]);
  const [showPreview, setShowPreview] = useState(false);
  const nextId = useRef(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {
  if (!testId) return;
  getTestWithAnswers(testId)
    .then((t) => {
      setForm({ title: t.title, category: t.category, duration: String(t.durationMinutes) });
      setQuestions(t.questions.map((q, i) => toQuestion(q, i + 1)));
      nextId.current = t.questions.length + 1;
    })
    .catch((e) => setError(e instanceof Error ? e.message : "Test load nahi hoya"))
    .finally(() => setLoading(false));
}, [testId]);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
  });
  
  const updateQuestion = (id: number, changes: Partial<Question>) =>
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);


  // createTest
  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  const missing = questions.findIndex((q) => q.type === "image" && !q.image);
if (missing !== -1) {
  setError(`Question ${missing + 1}: image is required`);
  return;
}
  setSaving(true);

  const data: CreateTestData = {
    title: form.title.trim(),
    category: form.category.trim(),
    durationMinutes: Number(form.duration),
   questions: questions.map((q) => ({
  id: q.dbId,
  type: API_TYPE[q.type],
  text: q.text,
  marks: q.marks,
  ...(q.type === "mcq"
    ? { options: q.options, correctOptionIndex: q.correct }
    : { correctAnswer: q.answer }),
  image: q.image?.file ?? null,
  keepImage: !!q.image && !q.image.file,
})),
  };

  try {
    if (testId) await updateTest(testId, data);
else await createTest(data);
window.history.back();
  } catch (err) {
    setError(err instanceof Error ? err.message : "Test nahi bana");
  } finally {
    setSaving(false);
  }
};
  if (loading) return <AppText variant="body" className="p-6">Loading…</AppText>;
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
          <div>
            <AppText as="h1" variant="heading" className="text-2xl text-accent">
             {testId ? "Edit test" : "Create a test"}
            </AppText>
            <AppText variant="caption" className="text-text-primary/65">
              Add details on the left, build questions on the right.
            </AppText>
          </div>
        </header>

       
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:grid lg:grid-cols-[22rem_1fr] lg:overflow-hidden"
        >
          {/* Left: details + actions */}
          <div className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto hide-scrollbar ">
              {error && <AppText variant="caption" className="w-full text-error">{error}</AppText>}
            <section className="order-1 space-y-5 rounded-2xl border border-border/50 bg-text-background p-4 shadow-sm sm:p-6">
              <AppText variant="title" className="text-lg text-accent">
                Test details
              </AppText>

              <Field label="Title *">
                <input
                  required
                  minLength={5}
maxLength={200}
                  placeholder="e.g. Sikhism quiz for kids"
                  className={fieldClass}
                  {...bind("title")}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Field label="Category *">
                  <input
                    required
                    placeholder="e.g. Sikhism"
                    minLength={2}
maxLength={50}
                    className={fieldClass}
                    {...bind("category")}
                  />
                </Field>
                <Field label="Time limit (minutes)">
                  <input
                    type="number"
                    min={1}
                    max={600}
                    required
                    className={fieldClass}
                    {...bind("duration")}
                  />
                </Field>
              </div>

              <div className="flex justify-between rounded-xl bg-background/70 px-4 py-3 text-sm">
                <span className="text-text-primary/70">{questions.length} questions</span>
                <span className="font-semibold text-accent">{totalMarks} marks</span>
              </div>
            </section>

            <div className="sticky z-10 bottom-0 order-3 flex gap-3 bg-background py-3 lg:static lg:p-0">
             
              <AppButton
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="min-h-11 flex-1  text-sm"
              >
                Preview
              </AppButton>
               <AppButton type="submit" variant="primary" disabled={saving} className="min-h-11 rounded-md flex-1">
    {saving ? "Saving…" : testId ? "Save changes" : "Create test"}
  </AppButton>
            </div>
          </div>

         
          <section className="order-2 flex flex-col gap-3 lg:min-h-0 lg:overflow-hidden">
            <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto hide-scrollbar lg:pr-1">
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  canRemove={questions.length > 1}
                  onChange={(changes) => updateQuestion(q.id, changes)}
                  onRemove={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                />
              ))}
            </div>

            <AppButton
              type="button"
              variant="outline"
              onClick={() => setQuestions((qs) => [...qs, newQuestion(nextId.current++)])}
              className="flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-accent hover:bg-text-background"
            >
              <FilePlus2 size={17} />
              Add question
            </AppButton>
          </section>
        </form>
         
      </div>

      {showPreview && (
        <PreviewModal form={form} questions={questions} onClose={() => setShowPreview(false)} />
      )}
    </main>
  );
}