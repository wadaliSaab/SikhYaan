import { NextRequest } from "next/server";
import { saveContentSchema } from "@/schemas/manage/content.schema";
import {
  saveContent,
  getContentByReference,
  getHomeSections,
  deleteContent,
} from "../../services/content/manager.service";

import { successResponse } from "../../utils/api-response";
import { AppError } from "../../utils/app-error";
import { handleError } from "../../utils/handle-error";
import { requireRole } from "@/src/lib/auth/authorization";

export async function saveContentController(request: NextRequest) {
  try {
    await requireRole(request, "admin");
    const data = saveContentSchema.parse(await request.json());
    const result = await saveContent(data);

    return successResponse(
      { id: result.id },
      result.created ? "Content created" : "Content updated",
      result.created ? 201 : 200
    );
  } catch (error) {
    return handleError(error, "Save content error:");
  }
}

export async function getContentController(request: NextRequest) {
  try {
    const referenceId = request.nextUrl.searchParams.get("ref");
    if (!referenceId) throw new AppError("REFERENCE_ID_REQUIRED", "Reference ID is required", 400);

    const result = await getContentByReference(referenceId);
    return successResponse(result, "Content loaded", 200);
  } catch (error) {
    return handleError(error, "Load content error:");
  }
}

export async function getHomeSectionsController() {
  try {
    return successResponse(await getHomeSections(), "Home sections loaded", 200);
  } catch (error) {
    return handleError(error, "Home sections error:");
  }
}

export async function deleteContentController(request: NextRequest) {
  try {
    await requireRole(request, "admin");
    const id = request.nextUrl.searchParams.get("id");
    if (!id) throw new AppError("ID_REQUIRED", "id is required", 400);

    await deleteContent(id);
    return successResponse({ id }, "Content deleted", 200);
  } catch (error) {
    return handleError(error, "Delete content error:");
  }
}