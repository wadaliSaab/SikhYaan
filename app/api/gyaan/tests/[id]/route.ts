
import { NextRequest } from "next/server";
import { updateTestController } from "@/server/controllers/gyaan/test.controller";

type Ctx = {
  params: Promise<{ id: string }>;
};
export async function PUT(request: NextRequest, { params }: Ctx) {
  return updateTestController(request, (await params).id);
}