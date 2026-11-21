
import {
  listNotificationsController,
  markReadController,
} from "@/server/controllers/settings/notification.controller";

export const GET = listNotificationsController;
export const POST = markReadController;