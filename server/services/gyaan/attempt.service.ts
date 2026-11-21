import prisma from "@/src/lib/prisma";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { mediaUrl } from "../doubt/media.service";
import { Prisma } from "@/src/generated/prisma/client";



export type AnswerInput = {
  order: number;
  selectedOptionIndex?: number | null; 
  answerText?: string | null; 
};

type FinalStatus = "SUBMITTED" | "TIMED_OUT";

const FINISHED: FinalStatus[] = ["SUBMITTED", "TIMED_OUT"];
const GRACE_SECONDS = 5; 
const MAX_ANSWER_LENGTH = 500;

function requireSignedIn(userId: string) {
  if (!userId) throw new AppError("UNAUTHORIZED", "Login is required", 401);
}


const normalize = (v: string) => v.trim().toLowerCase();



async function imageUrlMap(mediaIds: (string | null)[]) {
  const ids = [...new Set(mediaIds.filter((id): id is string => !!id))];
  if (!ids.length) return new Map<string, string>();
  const media = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: { id: true, fileKey: true },
  });
  const entries = await Promise.all(
    media.map(async (m) => [m.id, await mediaUrl(m.fileKey)] as const),
  );
  return new Map(entries);
}


function cleanAnswer(
  row: { questionTypeSnapshot: string; optionsSnapshot: string[] },
  input: AnswerInput,
) {
  if (row.questionTypeSnapshot === "MCQ") {
    const idx = input.selectedOptionIndex ?? null;
    if (
      idx !== null &&
      (!Number.isInteger(idx) || idx < 0 || idx >= row.optionsSnapshot.length)
    )
      throw new AppError("INVALID_ANSWER", "Selected option is invalid", 400);
    return { selectedOptionIndex: idx, answerText: null as string | null };
  }

  const text = input.answerText?.trim() ?? "";
  if (text.length > MAX_ANSWER_LENGTH)
    throw new AppError(
      "INVALID_ANSWER",
      `Answer can be at most ${MAX_ANSWER_LENGTH} characters`,
      400,
    );
  return { selectedOptionIndex: null as number | null, answerText: text || null };
}


function evaluate(
  row: {
    questionTypeSnapshot: string;
    correctOptionIndexSnapshot: number | null;
    correctAnswerSnapshot: string | null;
    marksPossible: number;
  },
  a: { selectedOptionIndex: number | null; answerText: string | null },
) {
  const isMcq = row.questionTypeSnapshot === "MCQ";
  const answered = isMcq ? a.selectedOptionIndex !== null : !!a.answerText?.trim();
  if (!answered) return { answered: false, isCorrect: null, marksAwarded: 0 };

  const isCorrect = isMcq
    ? a.selectedOptionIndex === row.correctOptionIndexSnapshot
    : normalize(a.answerText ?? "") === normalize(row.correctAnswerSnapshot ?? "");

  return { answered: true, isCorrect, marksAwarded: isCorrect ? row.marksPossible : 0 };
}

async function findOwnedAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.gyaanAttempt.findFirst({
    where: { id: attemptId, userId },
    select: { id: true, status: true, expiresAt: true },
  });
  if (!attempt) throw new AppError("ATTEMPT_NOT_FOUND", "Attempt not found", 404);
  return attempt;
}
async function assertActive(attempt: { id: string; status: string; expiresAt: Date }) {
  if (attempt.status !== "IN_PROGRESS")
    throw new AppError("ATTEMPT_FINISHED", "This attempt is already finished", 409);
  if (attempt.expiresAt.getTime() <= Date.now()) {
    await finalizeAttempt(attempt.id, "TIMED_OUT");
    throw new AppError("ATTEMPT_FINISHED", "Time is over for this attempt", 409);
  }
}


async function finalizeAttempt(
  attemptId: string,
  status: FinalStatus,
  incoming: AnswerInput[] = [],
) {
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.gyaanAttempt.updateMany({
      where: { id: attemptId, status: "IN_PROGRESS" },
      data: { status },
    });
    if (!claimed.count) return; 

    const attempt = await tx.gyaanAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: {
        startedAt: true,
        expiresAt: true,
        totalMarks: true,
        answers: { orderBy: { order: "asc" } },
      },
    });

    const now = new Date();
    const endedAt = status === "TIMED_OUT" || now > attempt.expiresAt ? attempt.expiresAt : now;
    const byOrder = new Map(incoming.map((a) => [a.order, a]));

    let score = 0;
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    await Promise.all(
      attempt.answers.map((row) => {
        const inc = byOrder.get(row.order);
        const merged = inc
          ? cleanAnswer(row, inc)
          : { selectedOptionIndex: row.selectedOptionIndex, answerText: row.answerText };
        const result = evaluate(row, merged);

        score += result.marksAwarded;
        if (!result.answered) unanswered++;
        else if (result.isCorrect) correct++;
        else wrong++;

        return tx.gyaanAttemptAnswer.update({
          where: { id: row.id },
          data: {
            selectedOptionIndex: merged.selectedOptionIndex,
            answerText: merged.answerText,
            answeredAt: result.answered ? (row.answeredAt ?? now) : null,
            isCorrect: result.isCorrect,
            marksAwarded: result.marksAwarded,
          },
        });
      }),
    );

    await tx.gyaanAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        correctAnswers: correct,
        wrongAnswers: wrong,
        unansweredAnswers: unanswered,
        percentage: attempt.totalMarks
          ? Math.round((score / attempt.totalMarks) * 10000) / 100
          : 0,
        submittedAt: endedAt,
        timeTakenSeconds: Math.max(
          0,
          Math.round((endedAt.getTime() - attempt.startedAt.getTime()) / 1000),
        ),
      },
    });
  });
}


export async function startAttempt(testId: string, userId: string) {
  requireSignedIn(userId);

  const test = await prisma.gyaanTest.findFirst({
    where: { id: testId, status: "PUBLISHED" },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test) throw new AppError("TEST_NOT_FOUND", "Test not found", 404);
  if (!test.questions.length)
    throw new AppError("TEST_EMPTY", "This test has no questions", 400);

 
  const stale = await prisma.gyaanAttempt.findFirst({
    where: { userId, testId, status: "IN_PROGRESS", expiresAt: { lte: new Date() } },
    select: { id: true },
  });
  if (stale) await finalizeAttempt(stale.id, "TIMED_OUT");

  const now = new Date();
  return prisma.$transaction(async (tx) => {
  
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gyaan:${userId}:${testId}`}))`;

  const existing = await tx.gyaanAttempt.findFirst({
    where: { userId, testId, status: "IN_PROGRESS" },
    select: { id: true, expiresAt: true },
  });
  if (existing)
    return { attemptId: existing.id, expiresAt: existing.expiresAt, resumed: true };

  const attempt = await tx.gyaanAttempt.create({
    data: {
      userId,
      testId,
      testTitleSnapshot: test.title,
      categorySnapshot: test.category,
      difficultySnapshot: test.difficulty,
      durationMinutesSnapshot: test.durationMinutes,
      questionCount: test.questions.length,
      totalMarks: test.questions.reduce((sum, q) => sum + q.marks, 0),
      startedAt: now,
      expiresAt: new Date(now.getTime() + test.durationMinutes * 60_000), 
      answers: {
        create: test.questions.map((q) => ({
          questionId: q.id,
          order: q.order,
          questionTypeSnapshot: q.type,
          questionTextSnapshot: q.text,
          marksPossible: q.marks,
          optionsSnapshot: q.options,
          correctOptionIndexSnapshot: q.correctOptionIndex,
          correctAnswerSnapshot: q.correctAnswer,
          imageMediaIdSnapshot: q.imageMediaId,
        })),
      },
    },
    select: { id: true, expiresAt: true },
  });

  return { attemptId: attempt.id, expiresAt: attempt.expiresAt, resumed: false };
  });
}


export async function getAttemptForTaking(attemptId: string, userId: string) {
  requireSignedIn(userId);

  const attempt = await prisma.gyaanAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { answers: { orderBy: { order: "asc" } } },
  });
  if (!attempt) throw new AppError("ATTEMPT_NOT_FOUND", "Attempt not found", 404);
  await assertActive(attempt);

  const urls = await imageUrlMap(attempt.answers.map((a) => a.imageMediaIdSnapshot));

  return {
    id: attempt.id,
    testId: attempt.testId,
    title: attempt.testTitleSnapshot,
    category: attempt.categorySnapshot,
    durationMinutes: attempt.durationMinutesSnapshot,
    totalMarks: attempt.totalMarks,
    expiresAt: attempt.expiresAt,
   
    remainingSeconds: Math.max(0, Math.ceil((attempt.expiresAt.getTime() - Date.now()) / 1000)),
    questions: attempt.answers.map((a) => ({
      order: a.order,
      type: a.questionTypeSnapshot,
      text: a.questionTextSnapshot,
      marks: a.marksPossible,
      options: a.optionsSnapshot,
      imageUrl: a.imageMediaIdSnapshot ? (urls.get(a.imageMediaIdSnapshot) ?? null) : null,
      
      selectedOptionIndex: a.selectedOptionIndex,
      answerText: a.answerText,
    })),
  };
}



export async function saveAnswer(attemptId: string, input: AnswerInput, userId: string) {
  requireSignedIn(userId);
  await assertActive(await findOwnedAttempt(attemptId, userId));

  const row = await prisma.gyaanAttemptAnswer.findUnique({
    where: { attemptId_order: { attemptId, order: input.order } },
    select: { id: true, questionTypeSnapshot: true, optionsSnapshot: true },
  });
  if (!row) throw new AppError("QUESTION_NOT_FOUND", "Question not found", 404);

  const clean = cleanAnswer(row, input);
  const hasAnswer = clean.selectedOptionIndex !== null || clean.answerText !== null;

  
  const saved = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "GyaanAttempt"
      WHERE id = ${attemptId}
        AND "userId" = ${userId}
        AND status = 'IN_PROGRESS'
        AND "expiresAt" > ${new Date()}
      FOR SHARE`;
    if (!locked.length) return false;

    await tx.gyaanAttemptAnswer.update({
      where: { id: row.id },
      data: { ...clean, answeredAt: hasAnswer ? new Date() : null },
    });
    return true;
  });

  if (!saved) {
    
    await assertActive(await findOwnedAttempt(attemptId, userId));
    throw new AppError("ATTEMPT_FINISHED", "This attempt is already finished", 409);
  }
  return { order: input.order, saved: true };
}



export async function submitAttempt(
  attemptId: string,
  userId: string,
  answers: AnswerInput[] = [],
) {
  requireSignedIn(userId);
  const attempt = await findOwnedAttempt(attemptId, userId);

  
  if (attempt.status !== "IN_PROGRESS") return getAttemptResult(attemptId, userId);

  const late = Date.now() > attempt.expiresAt.getTime() + GRACE_SECONDS * 1000;
  await finalizeAttempt(attemptId, late ? "TIMED_OUT" : "SUBMITTED", late ? [] : answers);
  return getAttemptResult(attemptId, userId);
}



export async function getAttemptResult(
  attemptId: string,
  userId: string,
  canManageAny = false,
): Promise<Awaited<ReturnType<typeof formatResult>>> {
  requireSignedIn(userId);

  const attempt = await prisma.gyaanAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: { orderBy: { order: "asc" } } },
  });
  if (!attempt) throw new AppError("ATTEMPT_NOT_FOUND", "Attempt not found", 404);
  if (attempt.userId !== userId && !canManageAny)
    throw new AppError("FORBIDDEN", "You can only view your own results", 403);

  if (attempt.status === "IN_PROGRESS") {
    if (attempt.expiresAt.getTime() > Date.now())
      throw new AppError("ATTEMPT_IN_PROGRESS", "This attempt is still running", 409);
    await finalizeAttempt(attempt.id, "TIMED_OUT");
    return getAttemptResult(attemptId, userId, canManageAny);
  }


  if (!FINISHED.includes(attempt.status as FinalStatus))
    throw new AppError("ATTEMPT_NOT_AVAILABLE", "No result is available for this attempt", 409);

  return formatResult(attempt);
}

async function formatResult(
  attempt: Prisma.GyaanAttemptGetPayload<{ include: { answers: true } }>,
) {
  const urls = await imageUrlMap(attempt.answers.map((a) => a.imageMediaIdSnapshot));

  return {
    id: attempt.id,
    testId: attempt.testId,
    title: attempt.testTitleSnapshot,
    category: attempt.categorySnapshot,
    difficulty: attempt.difficultySnapshot,
    durationMinutes: attempt.durationMinutesSnapshot,
    status: attempt.status,
    questionCount: attempt.questionCount,
    totalMarks: attempt.totalMarks,
    score: attempt.score,
    correctAnswers: attempt.correctAnswers,
    wrongAnswers: attempt.wrongAnswers,
    unansweredAnswers: attempt.unansweredAnswers,
    percentage: attempt.percentage,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeTakenSeconds: attempt.timeTakenSeconds,
    answers: attempt.answers.map((a) => ({
      order: a.order,
      type: a.questionTypeSnapshot,
      text: a.questionTextSnapshot,
      marks: a.marksPossible,
      options: a.optionsSnapshot,
      imageUrl: a.imageMediaIdSnapshot ? (urls.get(a.imageMediaIdSnapshot) ?? null) : null,
      correctOptionIndex: a.correctOptionIndexSnapshot,
      correctAnswer: a.correctAnswerSnapshot,
      selectedOptionIndex: a.selectedOptionIndex,
      answerText: a.answerText,
      isCorrect: a.isCorrect, 
      marksAwarded: a.marksAwarded,
    })),
  };
}



export async function listMyAttempts(
  userId: string,
  input: PaginationInput & { testId?: string } = {},
) {
  requireSignedIn(userId);
  const { page, limit, skip } = getPage(input);
  const where: Prisma.GyaanAttemptWhereInput = {
    userId,
    status: { in: FINISHED },
    ...(input.testId ? { testId: input.testId } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.gyaanAttempt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        testId: true,
        testTitleSnapshot: true,
        categorySnapshot: true,
        difficultySnapshot: true,
        durationMinutesSnapshot: true,
        questionCount: true,
        totalMarks: true,
        score: true,
        correctAnswers: true,
        wrongAnswers: true,
        unansweredAnswers: true,
        percentage: true,
        status: true,
        submittedAt: true,
        timeTakenSeconds: true,
      },
    }),
    prisma.gyaanAttempt.count({ where }),
  ]);

  return {
    items: items.map(
      ({ testTitleSnapshot, categorySnapshot, difficultySnapshot, durationMinutesSnapshot, ...rest }) => ({
        ...rest,
        title: testTitleSnapshot,
        category: categorySnapshot,
        difficulty: difficultySnapshot,
        durationMinutes: durationMinutesSnapshot,
      }),
    ),
    pagination: pagination(page, limit, total),
  };
}