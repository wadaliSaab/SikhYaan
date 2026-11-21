import { NextRequest } from "next/server";
import { z } from "zod";

import {requireAuth, requireRoles, getOptionalUser, isAdmin,} from "@/src/lib/auth/authorization";
import {
  listDoubts,
  getDoubtOverview,
  createDoubt,
  toggleDoubtLike,
  toggleDoubtBookmark,
  setDoubtPinned,
  setDoubtResolved,
  deleteDoubt,
  permanentlyDeleteDoubt,
  type UploadedDoubtImage,
} from "@/server/services/doubt/doubt.service";

import {
  idSchema,
  paginationSchema,
  listDoubtsSchema,
  createDoubtSchema,
  doubtPinSchema,
  doubtResolvedSchema,
} from "@/schemas/doubt/doubt.schema";

import { successResponse } from "@/server/utils/api-response";
import { handleError } from "@/server/utils/handle-error";


// ---------- Helpers ----------

async function parseCreateDoubtForm(request: NextRequest) {
  const form = await request.formData();

  const fields = createDoubtSchema.parse({
    title: form.get("title") ?? undefined,
    body: form.get("body") ?? undefined,
    categoryId: form.get("categoryId") ?? undefined,
    referenceId: form.get("referenceId") || undefined,
  });

  const files = form
    .getAll("images")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const images: UploadedDoubtImage[] = await Promise.all(
    files.map(async (file) => ({
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    })),
  );

  return { ...fields, images };
}

// ---------- Controllers ----------


export async function listDoubtsController(request: NextRequest) {
  try {
    const { mine, saved, ...filters } = listDoubtsSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const user = await getOptionalUser(request);

    
    if ((mine || saved) && !user) await requireAuth(request);

    const result = await listDoubts(
      {
        ...filters,
        ...(mine && user ? { authorId: user.id } : {}),
        ...(saved && user ? { savedByUserId: user.id } : {}),
      },
      user?.id,
    );

    return successResponse(result, "Doubts fetched successfully", 200);
  } catch (error) {
    return handleError(error, "List doubts error:");
  }
}


export async function getDoubtOverviewController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const pageInput = paginationSchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );

    const user = await getOptionalUser(request);
    const result = await getDoubtOverview(doubtId, user?.id, pageInput);

    return successResponse(result, "Doubt fetched successfully", 200);
  } catch (error) {
    return handleError(error, "Get doubt overview error:");
  }
}


export async function createDoubtController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const input = await parseCreateDoubtForm(request);

    const doubt = await createDoubt(input, user.id);

    return successResponse(doubt, "Doubt created successfully", 201);
  } catch (error) {
    return handleError(error, "Create doubt error:");
  }
}


export async function toggleDoubtLikeController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const user = await requireAuth(request);

    const result = await toggleDoubtLike(doubtId, user.id);

    return successResponse(result, "Doubt like updated successfully", 200);
  } catch (error) {
    return handleError(error, "Toggle doubt like error:");
  }
}


export async function toggleDoubtBookmarkController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const user = await requireAuth(request);

    const result = await toggleDoubtBookmark(doubtId, user.id);

    return successResponse(result, "Doubt bookmark updated successfully", 200);
  } catch (error) {
    return handleError(error, "Toggle doubt bookmark error:");
  }
}

export async function setDoubtPinnedController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    await requireRoles(request, ["admin"]);
    const { isPinned } = doubtPinSchema.parse(await request.json());

    const result = await setDoubtPinned(doubtId, isPinned);

    return successResponse(result, "Doubt pin status updated successfully", 200);
  } catch (error) {
    return handleError(error, "Set doubt pinned error:");
  }
}


export async function setDoubtResolvedController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const user = await requireAuth(request);
    const { isResolved } = doubtResolvedSchema.parse(await request.json());

    const result = await setDoubtResolved(
      doubtId,
      isResolved,
      user.id,
      isAdmin(user),
    );

    return successResponse(
      result,
      "Doubt resolution status updated successfully",
      200,
    );
  } catch (error) {
    return handleError(error, "Set doubt resolved error:");
  }
}


export async function deleteDoubtController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const user = await requireAuth(request);

    const result = await deleteDoubt(doubtId, user.id, isAdmin(user));

    return successResponse(result, "Doubt deleted successfully", 200);
  } catch (error) {
    return handleError(error, "Delete doubt error:");
  }
}


export async function permanentlyDeleteDoubtController(
  request: NextRequest,
  doubtId: string,
) {
  try {
    idSchema.parse(doubtId);
    const user = await requireAuth(request);

    const result = await permanentlyDeleteDoubt(doubtId, user.id, isAdmin(user));

    return successResponse(result, "Doubt permanently deleted", 200);
  } catch (error) {
    return handleError(error, "Permanently delete doubt error:");
  }
}