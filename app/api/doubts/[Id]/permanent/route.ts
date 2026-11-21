import { NextRequest } from "next/server";
import { permanentlyDeleteDoubtController } from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const DELETE = async (request: NextRequest, { params }: Ctx) =>
  permanentlyDeleteDoubtController(request, (await params).Id);