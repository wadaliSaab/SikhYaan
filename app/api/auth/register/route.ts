import { NextRequest } from "next/server";
import { registerController } from "@/server/controllers/auth.controller";

export async function POST(request: NextRequest) {
  return registerController(request);
}