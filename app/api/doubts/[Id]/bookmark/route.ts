import { NextRequest } from "next/server";
import { toggleDoubtBookmarkController } from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const POST = async (request: NextRequest, { params }: Ctx) =>
  toggleDoubtBookmarkController(request, (await params).Id);