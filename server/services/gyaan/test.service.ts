import { randomUUID } from "node:crypto";
import path from "node:path";
import prisma from "@/src/lib/prisma";
import { uploadFile, deleteFile } from "@/src/lib/b2";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { withUrl, withUrlOrNull } from "../doubt/media.service";
import { Prisma } from "@/src/generated/prisma/client";
import { notify, clip } from "../../utils/notify";



export type QuestionType = "MCQ" | "FILL" | "IMAGE";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type TestSort = "latest" | "popular";

export type UploadedQuestionImage = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
};

export type CreateQuestionInput = {
  type: QuestionType;
  text: string;
  marks?: number;
  options?: string[]; 
  correctOptionIndex?: number | null; 
  correctAnswer?: string | null;
  image?: UploadedQuestionImage | null;
};

export type TestDetailsInput = {
  title?: string;
  description?: string | null;
  category?: string;
  difficulty?: Difficulty;
  durationMinutes?: number;
};

export type CreateTestInput = TestDetailsInput & {
  questions: CreateQuestionInput[];
  publish?: boolean; 
};

type ListTestsInput = PaginationInput & {
  search?: string;
  category?: string;
  difficulty?: Difficulty;
  authorId?: string; 
  sort?: TestSort; 
};

const MAX_QUESTIONS = 100;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const DIFFICULTIES: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function requireSignedIn(userId: string) {
  if (!userId) throw new AppError("UNAUTHORIZED", "Login is required", 401);
}


const testInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      isOfficial: true,
      avatar: { select: { id: true, fileKey: true, fileName: true } },
    },
  },
  _count: { select: { questions: true, attempts: true } },
} satisfies Prisma.GyaanTestInclude;



async function formatTest<
  T extends {
    description: string | null;
    createdBy: { avatar: { fileKey: string } | null };
    _count: { questions: number; attempts: number };
  },
>(item: T, totalMarks = 0) {
  const { _count, ...test } = item;
  return {
    ...test,
    description: test.description ?? "",
    createdBy: {
      ...test.createdBy,
      avatar: await withUrlOrNull(test.createdBy.avatar),
    },
    questionCount: _count.questions,
    attemptCount: _count.attempts,
    totalMarks,
  };
}

async function totalMarksByTest(testIds: string[]) {
  if (!testIds.length) return new Map<string, number>();
  const rows = await prisma.gyaanQuestion.groupBy({
    by: ["testId"],
    where: { testId: { in: testIds } },
    _sum: { marks: true },
  });
  return new Map(rows.map((r) => [r.testId, r._sum.marks ?? 0]));
}



const invalid = (code: string, message: string) => new AppError(code, message, 400);

function cleanDetails(input: TestDetailsInput) {
  const out: {
    title?: string;
    description?: string | null;
    category?: string;
    difficulty?: Difficulty;
    durationMinutes?: number;
  } = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 5 || title.length > 200)
      throw invalid("INVALID_TITLE", "Title must be between 5 and 200 characters");
    out.title = title;
  }
  if (input.description !== undefined) {
    const description = input.description?.trim() ?? "";
    if (description.length > 1000)
      throw invalid("INVALID_DESCRIPTION", "Description can be at most 1000 characters");
    out.description = description || null;
  }
  if (input.category !== undefined) {
    const category = input.category.trim();
    if (category.length < 2 || category.length > 50)
      throw invalid("INVALID_CATEGORY", "Category must be between 2 and 50 characters");
    out.category = category;
  }
  if (input.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(input.difficulty))
      throw invalid("INVALID_DIFFICULTY", "Invalid difficulty");
    out.difficulty = input.difficulty;
  }
  if (input.durationMinutes !== undefined) {
    const d = input.durationMinutes;
    if (!Number.isInteger(d) || d < 1 || d > 600)
      throw invalid("INVALID_DURATION", "Time limit must be between 1 and 600 minutes");
    out.durationMinutes = d;
  }
  return out;
}

function cleanQuestion(q: CreateQuestionInput, index: number , keepsImage = false) {
  const n = index + 1;
  const err = (message: string) => invalid("INVALID_QUESTION", `Question ${n}: ${message}`);

  const text = q.text?.trim() ?? "";
  if (text.length < 1 || text.length > 2000)
    throw err("text must be between 1 and 2000 characters");

  const marks = q.marks ?? 1;
  if (!Number.isInteger(marks) || marks < 1 || marks > 100)
    throw err("marks must be between 1 and 100");

  const image = q.image ?? null;
  if (image) {
    if (!IMAGE_EXTENSIONS[image.mimeType])
      throw err("only JPEG, PNG, and WebP images are allowed");
    if (
      !Number.isInteger(image.size) ||
      image.size <= 0 ||
      image.size > MAX_IMAGE_SIZE ||
      image.buffer.length !== image.size
    )
      throw err("image must be smaller than 5 MB");
  }

  if (q.type === "MCQ") {
    const options = (q.options ?? []).map((o) => o.trim());
    if (options.length < 2 || options.length > 6 || options.some((o) => !o))
      throw err("needs 2 to 6 non-empty options");
    const idx = q.correctOptionIndex;
    if (idx == null || !Number.isInteger(idx) || idx < 0 || idx >= options.length)
      throw err("select the correct option");
    return { type: q.type, text, marks, options, correctOptionIndex: idx, correctAnswer: null, image };
  }

  if (q.type === "FILL" || q.type === "IMAGE") {
    const answer = q.correctAnswer?.trim() ?? "";
    if (!answer || answer.length > 500) throw err("correct answer is required (max 500 characters)");
   if (q.type === "IMAGE" && !image && !keepsImage) throw err("image is required for image based questions");
    return { type: q.type, text, marks, options: [] as string[], correctOptionIndex: null, correctAnswer: answer, image };
  }

  throw err("invalid question type");
}



export async function createTest(input: CreateTestInput, userId: string) {
  

  const details = cleanDetails(input);
  const { title, category, durationMinutes } = details;
  if (!title || !category || !durationMinutes)
    throw invalid("INVALID_TEST", "Title, category and time limit are required");

  const inputQuestions = input.questions ?? [];
  if (inputQuestions.length < 1 || inputQuestions.length > MAX_QUESTIONS)
    throw invalid("INVALID_QUESTIONS", `A test needs 1 to ${MAX_QUESTIONS} questions`);
  const questions = inputQuestions.map((q, i) => cleanQuestion(q, i));

  const publish = input.publish ?? true;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  const uploadedKeys: string[] = [];
  let created;
  try {
   
    const uploads = await Promise.all(
      questions.map(async (q) => {
        if (!q.image) return null;
        const fileKey = `gyaan/${randomUUID()}${IMAGE_EXTENSIONS[q.image.mimeType]}`;
        await uploadFile(fileKey, q.image.buffer, q.image.mimeType);
        uploadedKeys.push(fileKey);
        return { image: q.image, fileKey };
      }),
    );

    created = await prisma.$transaction(async (tx) => {
      const mediaIds = await Promise.all(
        uploads.map(async (u) => {
          if (!u) return null;
          const media = await tx.media.create({
            data: {
              type: "IMAGE",
              fileKey: u.fileKey,
              fileName: path.basename(u.image.fileName),
              mimeType: u.image.mimeType,
              size: u.image.size,
            },
            select: { id: true },
          });
          return media.id;
        }),
      );

      return tx.gyaanTest.create({
        data: {
          title,
          category,
          durationMinutes,
          description: details.description ?? null,
          difficulty: details.difficulty ?? "BEGINNER",
          status: publish ? "PUBLISHED" : "DRAFT",
          publishedAt: publish ? new Date() : null,
          createdById: userId,
          questions: {
            create: questions.map((q, i) => ({
              createdById: userId,
              type: q.type,
              text: q.text,
              marks: q.marks,
              order: i + 1,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              correctAnswer: q.correctAnswer,
              ...(mediaIds[i] ? { imageMediaId: mediaIds[i] } : {}),
            })),
          },
        },
        include: testInclude,
      });
    });
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteFile(key)));
    throw error;
  }
    if (publish) {
    await notify({
      to: "everyone",
      type: "TEST_ADDED",
      title: "New test available",
      message: `"${clip(created.title)}" is now live. Try it and check your knowledge!`,
      testId: created.id,
    });
  }

  return formatTest(created, totalMarks);
}


export async function listTests(input: ListTestsInput = {}, currentUserId?: string) {
  const { page, limit, skip } = getPage(input);
  const where: Prisma.GyaanTestWhereInput = {};


  if (input.authorId && input.authorId === currentUserId) {
    where.createdById = input.authorId;
    where.status = { in: ["DRAFT", "PUBLISHED"] };
  } else {
    where.status = "PUBLISHED";
    if (input.authorId) where.createdById = input.authorId;
  }

  const category = input.category?.trim();
  if (category) where.category = { equals: category, mode: "insensitive" };
  if (input.difficulty) where.difficulty = input.difficulty;

  const search = input.search?.trim();
  if (search)
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];

  const orderBy: Prisma.GyaanTestOrderByWithRelationInput[] =
    input.sort === "popular"
      ? [{ attempts: { _count: "desc" } }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [items, total] = await prisma.$transaction([
    prisma.gyaanTest.findMany({ where, skip, take: limit, orderBy, include: testInclude }),
    prisma.gyaanTest.count({ where }),
  ]);

  const marks = await totalMarksByTest(items.map((t) => t.id));
  return {
    items: await Promise.all(items.map((t) => formatTest(t, marks.get(t.id) ?? 0))),
    pagination: pagination(page, limit, total),
  };
}



export async function listCategories() {
  const rows = await prisma.gyaanTest.groupBy({
    by: ["category"],
    where: { status: "PUBLISHED" },
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ category: r.category, count: r._count._all }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}



export async function getTestOverview(testId: string, currentUserId?: string) {
  const test = await prisma.gyaanTest.findFirst({
    where: { id: testId, status: { not: "ARCHIVED" } },
    include: testInclude,
  });
  if (!test || (test.status !== "PUBLISHED" && test.createdById !== currentUserId))
    throw new AppError("TEST_NOT_FOUND", "Test not found", 404);

  const marks = await totalMarksByTest([test.id]);
  return formatTest(test, marks.get(test.id) ?? 0);
}



async function getManageableTest(
  testId: string,
  userId: string,
  canManageAny: boolean,
  forbiddenMessage: string,
) {
  const test = await prisma.gyaanTest.findFirst({
    where: { id: testId, status: { not: "ARCHIVED" } },
    select: { id: true, createdById: true, publishedAt: true , title: true },
  });
  if (!test) throw new AppError("TEST_NOT_FOUND", "Test not found", 404);
  if (test.createdById !== userId && !canManageAny)
    throw new AppError("FORBIDDEN", forbiddenMessage, 403);
  return test;
}



export async function getTestWithAnswers(testId: string, userId: string, canManageAny = false) {
  requireSignedIn(userId);
  await getManageableTest(
    testId,
    userId,
    canManageAny,
    "Only the creator or an authorized moderator can view the answers",
  );

  const test = await prisma.gyaanTest.findUniqueOrThrow({
    where: { id: testId },
    include: {
      ...testInclude,
      questions: {
        orderBy: { order: "asc" },
        include: { image: { select: { id: true, fileKey: true, fileName: true } } },
      },
    },
  });

  const { questions, ...rest } = test;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return {
    ...(await formatTest(rest, totalMarks)),
    questions: await Promise.all(
      questions.map(async (q) => ({
        id: q.id,
        order: q.order,
        type: q.type,
        text: q.text,
        marks: q.marks,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        correctAnswer: q.correctAnswer,
        image: q.image ? await withUrl(q.image) : null,
      })),
    ),
  };
}



export async function updateTestDetails(
  testId: string,
  input: TestDetailsInput,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  await getManageableTest(
    testId,
    userId,
    canManageAny,
    "You can only edit your own tests unless you have moderation permission",
  );

  const data = cleanDetails(input);
  if (!Object.keys(data).length) throw invalid("NOTHING_TO_UPDATE", "Nothing to update");

  const updated = await prisma.gyaanTest.update({
    where: { id: testId },
    data,
    include: testInclude,
  });
  const marks = await totalMarksByTest([testId]);
  return formatTest(updated, marks.get(testId) ?? 0);
}



export async function setTestPublished(
  testId: string,
  isPublished: boolean,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  const test = await getManageableTest(
    testId,
    userId,
    canManageAny,
    "You can only publish your own tests unless you have moderation permission",
  );

  if (isPublished) {
    const count = await prisma.gyaanQuestion.count({ where: { testId } });
    if (!count) throw invalid("TEST_EMPTY", "Add at least one question before publishing");
  }

   const updated = await prisma.gyaanTest.update({
    where: { id: testId },
    data: {
      status: isPublished ? "PUBLISHED" : "DRAFT",
      ...(isPublished ? { publishedAt: test.publishedAt ?? new Date() } : {}),
    },
    select: { id: true, status: true, publishedAt: true },
  });

  
  if (isPublished && !test.publishedAt) {
    await notify({
      to: "everyone",
      type: "TEST_ADDED",
      title: "New test available",
      message: `"${clip(test.title)}" is now live. Try it and check your knowledge!`,
      testId,
    });
  }

  return updated;
}



export async function deleteTest(testId: string, userId: string, canManageAny = false) {
  requireSignedIn(userId);
  await getManageableTest(
    testId,
    userId,
    canManageAny,
    "You can only delete your own tests unless you have moderation permission",
  );
  await prisma.gyaanTest.update({
    where: { id: testId },
    data: { status: "ARCHIVED" },
  });
  return { id: testId, deleted: true };
}



export async function permanentlyDeleteTest(
  testId: string,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);

  const test = await prisma.gyaanTest.findUnique({
    where: { id: testId },
    select: { id: true, createdById: true, _count: { select: { attempts: true } } },
  });
  if (!test) throw new AppError("TEST_NOT_FOUND", "Test not found", 404);
  if (test.createdById !== userId && !canManageAny)
    throw new AppError(
      "FORBIDDEN",
      "You can only delete your own tests unless you have moderation permission",
      403,
    );
  if (test._count.attempts > 0)
    throw new AppError(
      "TEST_HAS_ATTEMPTS",
      "This test already has attempts, so it can only be archived",
      409,
    );

  try {
    await prisma.gyaanTest.delete({ where: { id: testId } }); 
  } catch (error) {
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003")
      throw new AppError(
        "TEST_HAS_ATTEMPTS",
        "This test already has attempts, so it can only be archived",
        409,
      );
    throw error;
  }
  return { id: testId, deleted: true, permanent: true };
}



export type UpdateQuestionInput = CreateQuestionInput & { id?: string; keepImage?: boolean };

export async function updateTest(
  testId: string,
  input: TestDetailsInput & { questions: UpdateQuestionInput[] },
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  await getManageableTest(
    testId,
    userId,
    canManageAny,
    "You can only edit your own tests unless you have moderation permission",
  );

  const details = cleanDetails(input);
  const list = input.questions ?? [];
  if (list.length < 1 || list.length > MAX_QUESTIONS)
    throw invalid("INVALID_QUESTIONS", `A test needs 1 to ${MAX_QUESTIONS} questions`);

  const questions = list.map((q, i) => ({
    ...cleanQuestion(q, i, !!q.keepImage),
    id: q.id,
    keepImage: !!q.keepImage,
  }));

  const uploadedKeys: string[] = [];
  try {
    const uploads = await Promise.all(
      questions.map(async (q) => {
        if (!q.image) return null;
        const fileKey = `gyaan/${randomUUID()}${IMAGE_EXTENSIONS[q.image.mimeType]}`;
        await uploadFile(fileKey, q.image.buffer, q.image.mimeType);
        uploadedKeys.push(fileKey);
        return { image: q.image, fileKey };
      }),
    );

    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.gyaanQuestion.findMany({ where: { testId }, select: { id: true } });
        const existingIds = new Set(existing.map((e) => e.id));
        const kept = new Set(questions.flatMap((q) => (q.id && existingIds.has(q.id) ? [q.id] : [])));

     
        const removed = [...existingIds].filter((id) => !kept.has(id));
        if (removed.length) await tx.gyaanQuestion.deleteMany({ where: { id: { in: removed }, testId } });

        if (Object.keys(details).length) await tx.gyaanTest.update({ where: { id: testId }, data: details });

        for (const [i, q] of questions.entries()) {
          const upload = uploads[i];
          const media = upload
            ? await tx.media.create({
                data: {
                  type: "IMAGE",
                  fileKey: upload.fileKey,
                  fileName: path.basename(upload.image.fileName),
                  mimeType: upload.image.mimeType,
                  size: upload.image.size,
                },
                select: { id: true },
              })
            : null;

          const data = {
            type: q.type,
            text: q.text,
            marks: q.marks,
            order: i + 1,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            correctAnswer: q.correctAnswer,
          };
         
          const image = media ? { imageMediaId: media.id } : q.keepImage ? {} : { imageMediaId: null };

          if (q.id && existingIds.has(q.id)) {
            await tx.gyaanQuestion.update({ where: { id: q.id }, data: { ...data, ...image } });
          } else {
            await tx.gyaanQuestion.create({ data: { ...data, ...image, testId, createdById: userId } });
          }
        }
      },
      { timeout: 20_000 },
    );
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteFile(key)));
    throw error;
  }

  return { id: testId, updated: true };
}