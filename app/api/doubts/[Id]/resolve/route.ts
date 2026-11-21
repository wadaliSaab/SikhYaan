import { NextRequest } from "next/server";
import { setDoubtResolvedController } from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const PATCH = async (request: NextRequest, { params }: Ctx) =>
  setDoubtResolvedController(request, (await params).Id);