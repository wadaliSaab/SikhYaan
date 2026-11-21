import { NextRequest } from "next/server";
import { loginController } from "@/server/controllers/auth.controller";

export async function POST(request: NextRequest) {
  return loginController(request);
}