import { NextRequest } from "next/server";
import { setReplyPinnedController } from "@/server/controllers/doubt/reply.controller";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (request: NextRequest, { params }: Ctx) =>
  setReplyPinnedController(request, (await params).id);