import { NextRequest } from "next/server";

import { requireAuth, getOptionalUser, isAdmin } from "@/src/lib/auth/authorization";
import {
  createTest,
  listTests,
  listCategories,
  getTestOverview,
  getTestWithAnswers,
  updateTestDetails,
  setTestPublished,
  deleteTest,
  updateTest,
  permanentlyDeleteTest,
  type CreateQuestionInput,
  type UploadedQuestionImage,
} from "@/server/services/gyaan/test.service";

import {
  idSchema,
  createTestSchema,
  updateTestDetailsSchema,
  testPublishSchema,
  listTestsSchema,
} from "@/schemas/gyaan/test.schema";

import { AppError } from "@/server/utils/app-error";
import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";

// ---------- Helpers ----------

async function toUploadedImage(value: FormDataEntryValue | null): Promise<UploadedQuestionImage | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  return {
    buffer: Buffer.from(await value.arrayBuffer()),
    fileName: value.name,
    mimeType: value.type,
    size: value.size,
  };
}


async function parseCreateTestForm(request: NextRequest) {
  const form = await request.formData();

  let rawQuestions: unknown;
  try {
    rawQuestions = JSON.parse(String(form.get("questions") ?? "[]"));
  } catch {
    throw new AppError("INVALID_QUESTIONS", "Questions must be valid JSON", 400);
  }

  const durationRaw = form.get("durationMinutes");
  const publishRaw = form.get("publish");

  const fields = createTestSchema.parse({
    title: form.get("title") ?? undefined,
    description: form.get("description") ?? undefined,
    category: form.get("category") ?? undefined,
    difficulty: form.get("difficulty") || undefined,
    durationMinutes: durationRaw === null || durationRaw === "" ? undefined : Number(durationRaw),
    publish: publishRaw === null ? undefined : publishRaw === "true",
    questions: rawQuestions,
  });

  const questions: CreateQuestionInput[] = await Promise.all(
    fields.questions.map(async (q, index) => ({
      ...q,
      image: await toUploadedImage(form.get(`image_${index}`)),
    })),
  );

  return { ...fields, questions };
}

// ---------- Controllers ----------

export async function listTestsController(request: NextRequest) {
  try {
    const { mine, ...filters } = listTestsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const user = await getOptionalUser(request);


    if (mine && !user) await requireAuth(request);

    const result = await listTests(
      { ...filters, ...(mine && user ? { authorId: user.id } : {}) },
      user?.id,
    );

    return successResponse(result, "Tests fetched successfully", 200);
  } catch (error) {
    return handleError(error, "List tests error:");
  }
}


export async function listCategoriesController() {
  try {
    const result = await listCategories();
    return successResponse(result, "Categories fetched successfully", 200);
  } catch (error) {
    return handleError(error, "List test categories error:");
  }
}


export async function getTestOverviewController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await getOptionalUser(request);

    const result = await getTestOverview(testId, user?.id);

    return successResponse(result, "Test fetched successfully", 200);
  } catch (error) {
    return handleError(error, "Get test overview error:");
  }
}


export async function getTestWithAnswersController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);

    const result = await getTestWithAnswers(testId, user.id, isAdmin(user));

    return successResponse(result, "Test fetched successfully", 200);
  } catch (error) {
    return handleError(error, "Get test with answers error:");
  }
}

export async function createTestController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const input = await parseCreateTestForm(request);

    const test = await createTest(input, user.id);

    return successResponse(test, "Test created successfully", 201);
  } catch (error) {
    return handleError(error, "Create test error:");
  }
}


export async function updateTestDetailsController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);
    const input = updateTestDetailsSchema.parse(await request.json());

    const result = await updateTestDetails(testId, input, user.id, isAdmin(user));

    return successResponse(result, "Test updated successfully", 200);
  } catch (error) {
    return handleError(error, "Update test details error:");
  }
}

export async function setTestPublishedController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);
    const { isPublished } = testPublishSchema.parse(await request.json());

    const result = await setTestPublished(testId, isPublished, user.id, isAdmin(user));

    return successResponse(result, "Test publish status updated successfully", 200);
  } catch (error) {
    return handleError(error, "Set test published error:");
  }
}


export async function deleteTestController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);

    const result = await deleteTest(testId, user.id, isAdmin(user));

    return successResponse(result, "Test deleted successfully", 200);
  } catch (error) {
    return handleError(error, "Delete test error:");
  }
}

export async function permanentlyDeleteTestController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);

    const result = await permanentlyDeleteTest(testId, user.id, isAdmin(user));

    return successResponse(result, "Test permanently deleted", 200);
  } catch (error) {
    return handleError(error, "Permanently delete test error:");
  }
}


export async function updateTestController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);
    const { publish, ...input } = await parseCreateTestForm(request);

    const result = await updateTest(testId, input, user.id, isAdmin(user));

    return successResponse(result, "Test updated successfully", 200);
  } catch (error) {
    return handleError(error, "Update test error:");
  }
}