import { NextRequest } from "next/server";
import { uploadUrlSchema, confirmUploadSchema } from "@/schemas/media.schema";
import { createUploadUrl, confirmUpload } from "../../services/content/media.service";
import { successResponse } from "../../utils/api-response";
import { handleError } from "../../utils/handle-error";

export async function uploadUrlController(request: NextRequest) {
  try {
    const data = uploadUrlSchema.parse(await request.json());
    const result = await createUploadUrl(data);
    return successResponse(result, "Upload URL created", 200);
  } catch (error) {
    return handleError(error, "Upload URL error:");
  }
}

export async function confirmUploadController(request: NextRequest) {
  try {
    const data = confirmUploadSchema.parse(await request.json());
    const result = await confirmUpload(data);
    return successResponse(result, "File uploaded", 201);
  } catch (error) {
    return handleError(error, "Confirm upload error:");
  }
}