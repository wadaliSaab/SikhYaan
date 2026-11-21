import { NextRequest } from "next/server";
import { getCountsController } from "@/server/controllers/settings/notification.controller";

export const GET = getCountsController;