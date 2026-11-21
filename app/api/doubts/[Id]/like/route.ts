import { NextRequest } from "next/server";
import { toggleDoubtLikeController } from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const POST = async (request: NextRequest, { params }: Ctx) =>
  toggleDoubtLikeController(request, (await params).Id);