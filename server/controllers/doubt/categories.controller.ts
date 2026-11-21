
import { NextRequest } from "next/server";
import { z } from "zod";
import {requireRoles} from "@/src/lib/auth/authorization";
import {getDoubtCategories,createDoubtCategory} from "../../services/doubt/category.service";
import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";
import {createDoubtCategorySchema,} from "@/schemas/doubt/category.schema";



export async function getDoubtCategoriesController() {
  try {
    const categories = await getDoubtCategories();

    return successResponse(
      categories,
      "Doubt categories fetched successfully",
      200
    );
  } catch (error) {
    return handleError(error, "Get doubt categories error:");
  }
}




export async function createDoubtCategoryController(
  request: NextRequest
) {
  try {
    await requireRoles(request, ["admin", "contributor"]);

    const body: unknown = await request.json();
    const input = createDoubtCategorySchema.parse(body);

    const category = await createDoubtCategory(input);

    return successResponse(
      category,
      "Doubt category created successfully",
      201
    );
  } catch (error) {
    return handleError(error, "Create doubt category error:");
  }
}
