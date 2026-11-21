import { NextRequest } from "next/server";
import {
  listRequestsController,
  decideRequestController,
} from "@/server/controllers/settings/role-request.controller";


export async function GET(request: NextRequest) {
  return listRequestsController(request);
}


export async function POST(request: NextRequest) {
  return decideRequestController(request);
}