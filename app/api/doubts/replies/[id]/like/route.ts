import { NextRequest } from "next/server";
import { toggleReplyLikeController } from "@/server/controllers/doubt/reply.controller";

type Ctx = { params: Promise<{ id: string }> };

export const POST = async (request: NextRequest, { params }: Ctx) =>
  toggleReplyLikeController(request, (await params).id);