import { NextRequest } from "next/server";
import { markReadSchema } from "@/schemas/settings/schema";
import {
  listNotifications,
  getCounts,
  markRead,
  markAllRead,
} from "../../services/settings/notification.service";
import { successResponse } from "../../utils/api-response";
import { handleError } from "../../utils/handle-error";
import { getOptionalUser,  requireAuth } from "@/src/lib/auth/authorization";
import { num, text, oneOf } from "../../utils/query";

const FILTERS = ["all", "content", "test", "doubt", "request", "system"] as const;


export async function listNotificationsController(request: NextRequest) {
  try {
    const user = await getOptionalUser(request);
    const q = request.nextUrl.searchParams;

    const result = await listNotifications(user?.id ?? null, {
      page: num(q.get("page")),
      limit: num(q.get("limit")),
      filter: oneOf(q.get("filter"), FILTERS),
      search: text(q.get("search")),
      unreadOnly: q.get("unread") === "1",
    });

    return successResponse(result, "Notifications loaded", 200);
  } catch (error) {
    return handleError(error, "List notifications error:");
  }
}

export async function getCountsController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await getCounts(user.id), "Counts loaded", 200);
  } catch (error) {
    return handleError(error, "Counts error:");
  }
}


export async function markReadController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { id, scope } = markReadSchema.parse(await request.json());

    const result = id
      ? await markRead(user.id, id)
      : await markAllRead(user.id, scope ?? "all");

    return successResponse(result, "Marked as read", 200);
  } catch (error) {
    return handleError(error, "Mark read error:");
  }
}