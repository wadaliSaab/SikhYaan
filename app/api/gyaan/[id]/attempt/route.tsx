import { NextRequest } from "next/server";
import { startAttemptController , getAttemptForTakingController } from "@/server/controllers/gyaan/attempt.controller";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return startAttemptController(request, id);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getAttemptForTakingController(request, id);
}

