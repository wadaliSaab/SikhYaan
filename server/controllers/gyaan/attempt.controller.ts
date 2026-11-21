import { NextRequest } from "next/server";

import { requireAuth, isAdmin } from "@/src/lib/auth/authorization";
import {
  startAttempt,
  getAttemptForTaking,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  listMyAttempts,
} from "@/server/services/gyaan/attempt.service";

import {
  idSchema,
  saveAnswerSchema,
  submitAttemptSchema,
  listMyAttemptsSchema,
} from "@/schemas/gyaan/attempt.schema";

import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";

// ---------- Controllers ----------


export async function startAttemptController(request: NextRequest, testId: string) {
  try {
    idSchema.parse(testId);
    const user = await requireAuth(request);

    const result = await startAttempt(testId, user.id);

    return successResponse(
      result,
      result.resumed ? "Attempt resumed successfully" : "Attempt started successfully",
      result.resumed ? 200 : 201,
    );
  } catch (error) {
    return handleError(error, "Start attempt error:");
  }
}


export async function getAttemptForTakingController(request: NextRequest, attemptId: string) {
  try {
    idSchema.parse(attemptId);
    const user = await requireAuth(request);

    const result = await getAttemptForTaking(attemptId, user.id);

    return successResponse(result, "Attempt fetched successfully", 200);
  } catch (error) {
    return handleError(error, "Get attempt error:");
  }
}


export async function saveAnswerController(request: NextRequest, attemptId: string) {
  try {
    idSchema.parse(attemptId);
    const user = await requireAuth(request);
    const input = saveAnswerSchema.parse(await request.json());

    const result = await saveAnswer(attemptId, input, user.id);

    return successResponse(result, "Answer saved successfully", 200);
  } catch (error) {
    return handleError(error, "Save answer error:");
  }
}


export async function submitAttemptController(request: NextRequest, attemptId: string) {
  try {
    idSchema.parse(attemptId);
    const user = await requireAuth(request);

   
    const body = await request.json().catch(() => ({}));
    const { answers } = submitAttemptSchema.parse(body);

    const result = await submitAttempt(attemptId, user.id, answers ?? []);

    return successResponse(result, "Attempt submitted successfully", 200);
  } catch (error) {
    return handleError(error, "Submit attempt error:");
  }
}


export async function getAttemptResultController(request: NextRequest, attemptId: string) {
  try {
    idSchema.parse(attemptId);
    const user = await requireAuth(request);

    const result = await getAttemptResult(attemptId, user.id, isAdmin(user));

    return successResponse(result, "Result fetched successfully", 200);
  } catch (error) {
    return handleError(error, "Get attempt result error:");
  }
}


export async function listMyAttemptsController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const query = listMyAttemptsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const result = await listMyAttempts(user.id, query);

    return successResponse(result, "Attempts fetched successfully", 200);
  } catch (error) {
    return handleError(error, "List attempts error:");
  }
}