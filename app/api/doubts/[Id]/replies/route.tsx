import { NextRequest } from "next/server";
import { listRepliesController } from "@/server/controllers/doubt/reply.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const GET = async (request: NextRequest, { params }: Ctx) =>
  listRepliesController(request, (await params).Id);