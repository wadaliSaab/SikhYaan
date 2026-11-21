import { NextRequest } from "next/server";
import { setDoubtPinnedController } from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const PATCH = async (request: NextRequest, { params }: Ctx) =>
  setDoubtPinnedController(request, (await params).Id);