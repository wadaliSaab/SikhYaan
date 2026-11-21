import { NextRequest } from "next/server";
import { decideRequestSchema } from "@/schemas/settings/schema";
import {
  listRequests,
  decideRoleRequest,
  listMyRequests,
  markMyRequestsSeen,
} from "../../services/settings/role-request.service";
import { successResponse } from "../../utils/api-response";
import { handleError } from "../../utils/handle-error";
import {  requireRole, requireAuth  } from "@/src/lib/auth/authorization";
import { num, text, oneOf } from "../../utils/query";


export async function listRequestsController(request: NextRequest) {
  try {
    await requireRole(request, "admin");
    const q = request.nextUrl.searchParams;

    const result = await listRequests({
      page: num(q.get("page")),
      limit: num(q.get("limit")),
      search: text(q.get("search")),
      status: oneOf(q.get("status"), ["PENDING", "APPROVED", "REJECTED"] as const),
    });

    return successResponse(result, "Requests loaded", 200);
  } catch (error) {
    return handleError(error, "List requests error:");
  }
}


export async function decideRequestController(request: NextRequest) {
  try {
   const admin = await requireRole(request, "admin");
    const { id, approve, note } = decideRequestSchema.parse(await request.json());

    const result = await decideRoleRequest(id, approve, admin.id, note);
    return successResponse(result, approve ? "Request approved" : "Request declined", 200);
  } catch (error) {
    return handleError(error, "Decide request error:");
  }
}


export async function listMyRequestsController(request: NextRequest) {
  try {
   const user = await requireAuth(request);
    return successResponse(await listMyRequests(user.id), "Requests loaded", 200);
  } catch (error) {
    return handleError(error, "My requests error:");
  }
}


export async function markMyRequestsSeenController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await markMyRequestsSeen(user.id), "Marked as seen", 200);
  } catch (error) {
    return handleError(error, "Mark seen error:");
  }
}