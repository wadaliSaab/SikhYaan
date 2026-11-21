import { NextRequest } from "next/server";
import { getAttemptResultController } from "@/server/controllers/gyaan/attempt.controller";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getAttemptResultController(request, id);
}