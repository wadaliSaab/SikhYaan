import { NextRequest } from "next/server";
import {
  listMyRequestsController,
  markMyRequestsSeenController,
} from "@/server/controllers/settings/role-request.controller";


export async function GET(request: NextRequest) {
  return listMyRequestsController(request);
}


export async function POST(request: NextRequest) {
  return markMyRequestsSeenController(request);
}