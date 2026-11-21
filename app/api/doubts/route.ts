import { NextRequest } from "next/server";

import {
  listDoubtsController,
  createDoubtController,
} from "@/server/controllers/doubt/doubt.controller";

export async function GET(request: NextRequest) {
  return listDoubtsController(request);
}

export async function POST(request: NextRequest) {
  return createDoubtController(request);
}