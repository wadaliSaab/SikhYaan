import { NextRequest } from "next/server";
import { cleanupOrphanMedia } from "../services/content/media.service";
import { successResponse, errorResponse } from "../utils/api-response";
import { handleError } from "../utils/handle-error";

export async function cleanupMediaController(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
  return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
}
  
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
  }

  try {
    const result = await cleanupOrphanMedia();
    return successResponse(result, "Cleanup done", 200);
  } catch (error) {
    return handleError(error, "Cleanup error:");
  }
}