import { NextRequest } from "next/server";
import { referenceIdSchema } from "@/schemas/manage/reference.schema";
import { generateReferenceId } from "../../services/content/reference.service";
import { successResponse } from "../../utils/api-response";
import { handleError } from "../../utils/handle-error";

export async function referenceIdController(request: NextRequest) {
  try {
    const data = referenceIdSchema.parse(await request.json());

    const referenceId = await generateReferenceId(data);

    return successResponse(
      { referenceId },
      "Reference ID generated",
      200
    );
  } catch (error) {
    return handleError(error, "Reference ID error:");
  }
}