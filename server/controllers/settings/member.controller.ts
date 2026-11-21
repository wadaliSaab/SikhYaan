import { NextRequest } from "next/server";
import { memberActionSchema } from "@/schemas/settings/schema";
import {
  listMembers,
  memberStats,
  suspendMember,
  restoreMember,
  removeMember,
} from "../../services/settings/member.service";
import { successResponse } from "../../utils/api-response";
import { handleError } from "../../utils/handle-error";
import { requireRole } from "@/src/lib/auth/authorization";
import { num, text, oneOf } from "../../utils/query";

export async function listMembersController(request: NextRequest) {
  try {
await requireRole(request, "admin");
    const q = request.nextUrl.searchParams;

    const [list, stats] = await Promise.all([
      listMembers({
        page: num(q.get("page")),
        limit: num(q.get("limit")),
        search: text(q.get("search")),
        role: oneOf(q.get("role"), ["admin", "contributor", "learner"] as const),
        status: oneOf(q.get("status"), ["active", "suspended"] as const),
      }),
      memberStats(),
    ]);

    return successResponse({ ...list, stats }, "Members loaded", 200);
  } catch (error) {
    return handleError(error, "List members error:");
  }
}


export async function memberActionController(request: NextRequest) {
  try {
    const admin = await requireRole(request, "admin");
    const { id, action } = memberActionSchema.parse(await request.json());

    if (action === "suspend")
      return successResponse(await suspendMember(id, admin.id), "Account suspended", 200);

    if (action === "restore")
      return successResponse(await restoreMember(id), "Account restored", 200);

    return successResponse(await removeMember(id, admin.id), "Account removed", 200);
  } catch (error) {
    return handleError(error, "Member action error:");
  }
}