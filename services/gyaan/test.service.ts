import { apiClient } from "../api-client";


const TESTS = "/api/gyaan/tests";
const ATTEMPTS = "/api/gyaan/attempts";
const ATTEMPT = "/api/gyaan";

/* ───────── Types ───────── */
export type QuestionType = "MCQ" | "FILL" | "IMAGE";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type TestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type Media = { id: string; url: string; fileName: string };
type Author = { id: string; name: string; isOfficial: boolean; avatar: Media | null };

export type Page<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number };
};

/* Tests */
export type Test = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  durationMinutes: number;
  status: TestStatus;
  publishedAt: string | null;
  createdAt: string;
  createdBy: Author;
  questionCount: number;
  attemptCount: number;
  totalMarks: number;
};

export type TestCategory = { category: string; count: number };

export type OwnerQuestion = {
  id: string;
  order: number;
  type: QuestionType;
  text: string;
  marks: number;
  options: string[];
  correctOptionIndex: number | null;
  correctAnswer: string | null;
  image: Media | null;
};

export type TestWithAnswers = Test & { questions: OwnerQuestion[] };

export type ListTestsParams = {
  search?: string;
  category?: string;
  difficulty?: Difficulty;
  sort?: "latest" | "popular";
  mine?: boolean;
  page?: number;
  limit?: number;
};

export type QuestionData = {
    id?: string;        
  keepImage?: boolean; 
  type: QuestionType;
  text: string;
  marks?: number;
  options?: string[]; 
  correctOptionIndex?: number | null; 
  correctAnswer?: string | null; 
  image?: File | null;
};

export type CreateTestData = {
  title: string;
  description?: string;
  category: string;
  difficulty?: Difficulty;
  durationMinutes: number;
  publish?: boolean;
  questions: QuestionData[];
};




export type AnswerData = {
  order: number;
  selectedOptionIndex?: number | null; 
  answerText?: string | null; 
};

export type StartedAttempt = { attemptId: string; expiresAt: string; resumed: boolean };

export type TakingQuestion = {
  order: number;
  type: QuestionType;
  text: string;
  marks: number;
  options: string[];
  imageUrl: string | null;
  selectedOptionIndex: number | null; 
  answerText: string | null;
};

export type AttemptForTaking = {
  id: string;
  testId: string;
  title: string;
  category: string;
  durationMinutes: number;
  totalMarks: number;
  expiresAt: string;
  remainingSeconds: number;
  questions: TakingQuestion[];
};

export type ResultAnswer = TakingQuestion & {
  correctOptionIndex: number | null;
  correctAnswer: string | null;
  isCorrect: boolean | null; 
  marksAwarded: number;
};

export type AttemptSummary = {
  id: string;
  testId: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  durationMinutes: number;
  status: "SUBMITTED" | "TIMED_OUT";
  questionCount: number;
  totalMarks: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredAnswers: number;
  percentage: number;
  submittedAt: string;
  timeTakenSeconds: number;
};

export type AttemptResult = AttemptSummary & {
  startedAt: string;
  answers: ResultAnswer[];
};

/* ───────── Helpers ───────── */
const query = (params: Record<string, string | number | boolean | undefined>) => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const text = q.toString();
  return text ? `?${text}` : "";
};

const send = (method: string, data?: unknown) => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

/* ───────── Tests ───────── */
export const listTests = (params: ListTestsParams = {}) =>
  apiClient<Page<Test>>(`${TESTS}${query(params)}`);

export const listTestCategories = () => apiClient<TestCategory[]>(`${TESTS}/categories`);

export const getTest = (id: string) => apiClient<Test>(`${TESTS}/${id}`);

export const getTestWithAnswers = (id: string) =>
  apiClient<TestWithAnswers>(`${ATTEMPT}/${id}/answers`);





function testForm(data: CreateTestData) {
  const form = new FormData();
  form.append("title", data.title);
  form.append("category", data.category);
  form.append("durationMinutes", String(data.durationMinutes));
  if (data.description) form.append("description", data.description);
  if (data.difficulty) form.append("difficulty", data.difficulty);
  if (data.publish !== undefined) form.append("publish", String(data.publish));

  form.append("questions", JSON.stringify(data.questions.map(({ image, ...q }) => q)));
  data.questions.forEach((q, i) => {
    if (q.image) form.append(`image_${i}`, q.image);
  });
  return form;
}

export const createTest = (data: CreateTestData) =>
  apiClient<Test>(TESTS, { method: "POST", body: testForm(data) });

export const updateTest = (id: string, data: CreateTestData) =>
  apiClient<{ id: string; updated: boolean }>(`${TESTS}/${id}`, { method: "PUT", body: testForm(data) });



export const setTestPublished = (id: string, isPublished: boolean) =>
  apiClient<{ id: string; status: TestStatus; publishedAt: string | null }>(
    `${TESTS}/${id}/publish`,
    send("PATCH", { isPublished }),
  );

export const deleteTest = (id: string) =>
  apiClient<{ id: string; deleted: boolean }>(`${TESTS}/${id}`, send("DELETE"));

export const permanentlyDeleteTest = (id: string) =>
  apiClient<{ id: string; deleted: boolean }>(`${TESTS}/${id}/permanent`, send("DELETE"));





/* ───────── Attempts ───────── */
export const startAttempt = (testId: string) =>
  apiClient<StartedAttempt>(`${ATTEMPT}/${testId}/attempt`, send("POST"));

export const getAttempt = (id: string) => apiClient<AttemptForTaking>(`${ATTEMPT}/${id}/attempt`);

export const saveAnswer = (attemptId: string, answer: AnswerData) =>
  apiClient<{ order: number; saved: boolean }>(`${ATTEMPT}/${attemptId}/answers`, send("PUT", answer));


export const submitAttempt = (attemptId: string, answers?: AnswerData[]) =>
  apiClient<AttemptResult>(`${ATTEMPT}/${attemptId}/submit`, send("POST", answers && { answers }));

export const getAttemptResult = (id: string) =>
  apiClient<AttemptResult>(`${ATTEMPT}/${id}/result`);

export const listMyAttempts = (params: { testId?: string; page?: number; limit?: number } = {}) =>
  apiClient<Page<AttemptSummary>>(`${ATTEMPTS}${query(params)}`);