
import { NextRequest } from "next/server";

import {getDoubtCategoriesController,
createDoubtCategoryController,
} from "@/server/controllers/doubt/categories.controller"

export async function GET() {
  return getDoubtCategoriesController();
}

export async function POST(request: NextRequest) {
  return createDoubtCategoryController(request);
}
