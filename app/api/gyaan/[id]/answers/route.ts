import { NextRequest } from "next/server";
import { saveAnswerController  } from "@/server/controllers/gyaan/attempt.controller";
import { getTestWithAnswersController } from "@/server/controllers/gyaan/test.controller";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return saveAnswerController(request, id);
}

export async function GET( request: NextRequest,{params}:{params: Promise<{ id: string }>}){
  const {id} = await params;
  return getTestWithAnswersController(request,id);
}

