import { NextRequest } from "next/server";
import { z } from "zod";
import {
  replyIdSchema,
  listRepliesSchema,
  createReplySchema,
  replyPinSchema,
} from "@/schemas/doubt/reply.schema";

import {
  requireAuth,
  requireRoles,
  getOptionalUser,
  isAdmin,
} from "@/src/lib/auth/authorization";
import {
  listReplies,
  createReply,
  toggleReplyLike,
  setReplyPinned,
  deleteReply,
} from "../../services/doubt/reply.service";

import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";

// ---------- Schemas ----------


// ---------- Controllers ----------


export async function listRepliesController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    replyIdSchema.parse(doubtId);
    const input = listRepliesSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const user = await getOptionalUser(request);
    const replies = await listReplies(doubtId, input, user?.id);

    return successResponse(replies, "Replies fetched successfully", 200);
  } catch (error) {
    return handleError(error, "List replies error:");
  }
}


export async function createReplyController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const input = createReplySchema.parse(await request.json());

       const { reply } = await createReply(input, user.id);

    return successResponse(reply, "Reply created successfully", 201);
  } catch (error) {
    return handleError(error, "Create reply error:");
  }
}


export async function toggleReplyLikeController(
  request: NextRequest,
  replyId: string,
) {
  try {
    replyIdSchema.parse(replyId);
    const user = await requireAuth(request);

    const result = await toggleReplyLike(replyId, user.id);

    return successResponse(result, "Reply like updated successfully", 200);
  } catch (error) {
    return handleError(error, "Toggle reply like error:");
  }
}


export async function setReplyPinnedController(
  request: NextRequest,
  replyId: string,
) {
  try {
    replyIdSchema.parse(replyId);
    await requireRoles(request, ["admin"]);
    const { isPinned } = replyPinSchema.parse(await request.json());

    const result = await setReplyPinned(replyId, isPinned);

    return successResponse(result, "Reply pin status updated successfully", 200);
  } catch (error) {
    return handleError(error, "Set reply pinned error:");
  }
}


export async function deleteReplyController(
  request: NextRequest,
  replyId: string,
) {
  try {
    replyIdSchema.parse(replyId);
    const user = await requireAuth(request);

    const result = await deleteReply(replyId, user.id, isAdmin(user));

    return successResponse(result, "Reply deleted successfully", 200);
  } catch (error) {
    return handleError(error, "Delete reply error:");
  }
}