import { NextRequest } from "next/server";
import { deleteReplyController } from "@/server/controllers/doubt/reply.controller";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = async (request: NextRequest, { params }: Ctx) =>
  deleteReplyController(request, (await params).id);