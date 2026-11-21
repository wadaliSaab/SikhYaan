import { ZodError } from "zod";
import { Prisma } from "../../src/generated/prisma/client";
import { AppError } from "./app-error";
import { errorResponse } from "./api-response";

export function handleError(error: unknown, label: string) {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.statusCode);
  }
 if (error instanceof ZodError) {
  const issue = error.issues[0];
  const field = issue.path.join(".");
  return errorResponse(
    "VALIDATION_ERROR",
    field ? `${field}: ${issue.message}` : issue.message,
    400,
  );
 }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return errorResponse("DUPLICATE_VALUE", "Already exists", 409);
    if (error.code === "P2025") return errorResponse("NOT_FOUND", "Not found", 404);
  }
  console.error(label, error);
  return errorResponse("INTERNAL_SERVER_ERROR", "Something went wrong", 500);
}