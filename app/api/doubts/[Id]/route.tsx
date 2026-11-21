import { NextRequest } from "next/server";
import {
  getDoubtOverviewController,
  deleteDoubtController,
} from "@/server/controllers/doubt/doubt.controller";

type Ctx = { params: Promise<{ Id: string }> };

export const GET = async (request: NextRequest, { params }: Ctx) =>
  getDoubtOverviewController(request, (await params).Id);

export const DELETE = async (request: NextRequest, { params }: Ctx) =>
  deleteDoubtController(request, (await params).Id);