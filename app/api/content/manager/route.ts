import {
  getContentController,
  saveContentController,
  deleteContentController,
} from "@/server/controllers/content/manager.controller";
export const GET = getContentController;       
export const POST = saveContentController;
export const DELETE = deleteContentController; 