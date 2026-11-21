import { randomUUID } from "node:crypto";
import path from "node:path";
import prisma from "@/src/lib/prisma";
import { uploadFile, deleteFile } from "@/src/lib/b2";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { withUrl, withUrlOrNull } from "./media.service";
import { findReplies } from "./reply.service";
import { Prisma } from "@/src/generated/prisma/client";
import { notify, clip } from "../../utils/notify";




type DoubtSort = "recent" | "helpful" | "unanswered";
type ListDoubtsInput = PaginationInput & {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  authorId?: string; 
  savedByUserId?: string; 
  sort?: DoubtSort;
};
export type UploadedDoubtImage = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
};
export type CreateDoubtInput = {
  title: string;
  body: string;
  categoryId: string;
  referenceId?: string;
  images?: UploadedDoubtImage[];
};

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function requireSignedIn(userId: string) {
  if (!userId) throw new AppError("UNAUTHORIZED", "Login is required", 401);
}



const doubtInclude = (userId?: string) =>
  ({
    author: {
      select: {
        id: true,
        name: true,
        isOfficial: true,
        avatar: { select: { id: true, fileKey: true, fileName: true } },
      },
    },
    category: { select: { id: true, name: true, slug: true } },
    referencedContent: { select: { id: true, referenceId: true, title: true } },
    images: {
      orderBy: { sortOrder: "asc" as const },
      include: {
        media: {
          select: {
            id: true,
            type: true,
            fileKey: true,
            fileName: true,
            mimeType: true,
            size: true,
          },
        },
      },
    },
    _count: { select: { likes: true, replies: true } },
    ...(userId
      ? {
          likes: { where: { userId }, select: { userId: true } },
          bookmarks: { where: { userId }, select: { userId: true } },
        }
      : {}),
  }) satisfies Prisma.DoubtInclude;





async function formatDoubt<
  T extends {
    author: { avatar: { fileKey: string } | null };
    images: { media: { fileKey: string } }[];
    _count: { likes: number; replies: number };
    likes?: { userId: string }[];
    bookmarks?: { userId: string }[];
  }, > (item: T, userId?: string) {
  const { _count, likes, bookmarks, ...doubt } = item;
  const [avatar, images] = await Promise.all([
    withUrlOrNull(doubt.author.avatar),
    Promise.all(
      doubt.images.map(async (image) => ({
        ...image,
        media: await withUrl(image.media),
      })),
    ),
  ]);
  return {
    ...doubt,
    author: { ...doubt.author, avatar },
    images,
    likeCount: _count.likes,
    replyCount: _count.replies,
    liked: userId ? (likes?.length ?? 0) > 0 : false,
    bookmarked: userId ? (bookmarks?.length ?? 0) > 0 : false,
  };
}

// all Doubts ,Sorting , MyQuestions
export async function listDoubts(
  input: ListDoubtsInput = {},
  currentUserId?: string,
) {
  const { page, limit, skip } = getPage(input);
  const where: Prisma.DoubtWhereInput = { isActive: true };

  if (input.categoryId) where.categoryId = input.categoryId;
  if (input.categorySlug)
    where.category = { slug: input.categorySlug, isActive: true };
  if (input.authorId) where.authorId = input.authorId;
  if (input.savedByUserId)
    where.bookmarks = { some: { userId: input.savedByUserId } };
  if (input.sort === "unanswered") where.replies = { none: {} };

  const search = input.search?.trim();
  if (search)
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
    ];

  const orderBy: Prisma.DoubtOrderByWithRelationInput[] =
    input.sort === "helpful"
      ? [
          { isPinned: "desc" },
          { likes: { _count: "desc" } },
          { createdAt: "desc" },
        ]
      : [{ isPinned: "desc" }, { createdAt: "desc" }];

  const [items, total] = await prisma.$transaction([
    prisma.doubt.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: doubtInclude(currentUserId),
    }),
    prisma.doubt.count({ where }),
  ]);
  return {
    items: await Promise.
all(
      items.map((item) => formatDoubt(item, currentUserId)),
    ),
    pagination: pagination(page, limit, total),
  };
}

// doubt overview
export async function getDoubtOverview(
  doubtId: string,
  currentUserId?: string,
  pageInput: PaginationInput = {},
) {
  const doubt = await prisma.doubt.findFirst({
    where: { id: doubtId, isActive: true },
    include: doubtInclude(currentUserId),
  });
  if (!doubt) throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);

  return {
    doubt: await formatDoubt(doubt, currentUserId),
    directReplies: await findReplies(doubtId, null, pageInput, currentUserId),
  };
}

// 3. Create doubt
export async function createDoubt(input: CreateDoubtInput, userId: string) {
  requireSignedIn(userId);

  const title = input.title.trim();
  const body = input.body.trim();
  const images = input.images ?? [];

  if (title.length < 5 || title.length > 200)
    throw new AppError(
      "INVALID_TITLE",
      "Title must be between 5 and 200 characters",
      400,
    );
  if (body.length < 1 || body.length > 10000)
    throw new AppError(
      "INVALID_BODY",
      "Doubt body must be between 1 and 10000 characters",
      400,
    );
  if (images.length > MAX_IMAGES)
    throw new AppError(
      "TOO_MANY_IMAGES",
      `A doubt can have at most ${MAX_IMAGES} images`,
      400,
    );
  for (const image of images) {
    if (!IMAGE_EXTENSIONS[image.mimeType])
      throw new AppError(
        "INVALID_IMAGE_TYPE",
        "Only JPEG, PNG, and WebP images are allowed",
        400,
      );
    if (
      !Number.isInteger(image.size) ||
      image.size <= 0 ||
      image.size > MAX_IMAGE_SIZE ||
      image.buffer.length !== image.size
    )
      throw new AppError(
        "INVALID_IMAGE_SIZE",
        "Each image must be smaller than 5 MB",
        400,
      );
  }

  const category = await prisma.doubtCategory.findFirst({
    where: { id: input.categoryId, isActive: true },
    select: { id: true },
  });
  if (!category)
    throw new AppError("CATEGORY_NOT_FOUND", "Category not found", 404);

  let referencedContentItemId: string | undefined;
  const referenceId = input.referenceId?.trim();
  if (referenceId) {
    const content = await prisma.contentItem.findFirst({
      where: { referenceId, isActive: true },
      select: { id: true },
    });
    if (!content)
      throw new AppError(
        "CONTENT_REFERENCE_NOT_FOUND",
        "Referenced content was not found or is inactive",
        400,
      );
    referencedContentItemId = content.id;
  }

  const uploadedKeys: string[] = [];
  let created;
  try {
    const uploaded = await Promise.all(
      images.map(async (image) => {
        const fileKey = `doubts/${randomUUID()}${IMAGE_EXTENSIONS[image.mimeType]}`;
        await uploadFile(fileKey, image.buffer, image.mimeType);
        uploadedKeys.push(fileKey);
        return { ...image, fileKey };
      }),
    );

    created = await prisma.$transaction(async (tx) => {
      const media = await Promise.all(
        uploaded.map((image) =>
          tx.media.create({
            data: {
              type: "IMAGE",
              fileKey: image.fileKey,
              fileName: path.basename(image.fileName),
              mimeType: image.mimeType,
              size: image.size,
            },
            select: { id: true },
          }),
        ),
      );
      return tx.doubt.create({
        data: {
          title,
          body,
          authorId: userId,
          categoryId: category.id,
          ...(referencedContentItemId ? { referencedContentItemId } : {}),
          images: {
            create: media.map((item, index) => ({
              mediaId: item.id,
              sortOrder: index,
            })),
          },
        },
        include: doubtInclude(userId),
      });
    });

  } catch (error) {
    
    await Promise.allSettled(uploadedKeys.map((key) => deleteFile(key)));
    throw error;
  }

    await notify({
    to: "admins",
    skipUserId: userId,
    type: "NEW_DOUBT",
    title: "New doubt",
    message: `${created.author.name} asked: "${clip(created.title)}"`,
    doubtId: created.id,
  });

  return formatDoubt(created, userId);
 
}


async function assertDoubtExists(doubtId: string) {
  const doubt = await prisma.doubt.findFirst({
    where: { id: doubtId, isActive: true },
    select: { id: true },
  });
  if (!doubt) throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);
}

// 4. Like/unlike toggle.
export async function toggleDoubtLike(doubtId: string, userId: string) {
  requireSignedIn(userId);
  await assertDoubtExists(doubtId);

  const key = { userId_doubtId: { userId, doubtId } };
  const existing = await prisma.doubtLike.findUnique({
    where: key,
    select: { userId: true },
  });
  if (existing) await prisma.doubtLike.delete({ where: key });
  else await prisma.doubtLike.create({ data: { userId, doubtId } });

  const likeCount = await prisma.doubtLike.count({ where: { doubtId } });
  return { doubtId, liked: !existing, likeCount };
}

// 5. Save/unsave toggle.
export async function toggleDoubtBookmark(doubtId: string, userId: string) {
  requireSignedIn(userId);
  await assertDoubtExists(doubtId);

  const key = { userId_doubtId: { userId, doubtId } };
  const existing = await prisma.doubtBookmark.findUnique({
    where: key,
    select: { userId: true },
  });
  if (existing) await prisma.doubtBookmark.delete({ where: key });
  else await prisma.doubtBookmark.create({ data: { userId, doubtId } });

  return { doubtId, bookmarked: !existing };
}


export async function setDoubtPinned(doubtId: string, isPinned: boolean) {
  const result = await prisma.doubt.updateMany({
    where: { id: doubtId, isActive: true },
    data: { isPinned },
  });
  if (!result.count)
    throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);
  return { doubtId, isPinned };
}


async function getManageableDoubt(
  doubtId: string,
  userId: string,
  canManageAny: boolean,
  forbiddenMessage: string,
) {
  const doubt = await prisma.doubt.findFirst({
    where: { id: doubtId, isActive: true },
    select: { id: true, authorId: true ,title: true  },
  });
  if (!doubt) throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);
  if (doubt.authorId !== userId && !canManageAny)
    throw new AppError("FORBIDDEN", forbiddenMessage, 403);
  return doubt;
}

// 7. Resolve/unresolve.
export async function setDoubtResolved(
  doubtId: string,
  isResolved: boolean,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  const doubt = await getManageableDoubt(
    doubtId,
    userId,
    canManageAny,
    "Only the author or an authorized moderator can resolve this doubt",
  );

  const updated = await prisma.doubt.update({
    where: { id: doubtId },
    data: { isResolved },
    select: { id: true, isResolved: true },
  });

  if (isResolved) {
    await notify({
      to: { users: [doubt.authorId] },
      skipUserId: userId, 
      type: "DOUBT_RESOLVED",
      title: "Doubt resolved",
      message: `Your doubt "${clip(doubt.title)}" was marked as resolved.`,
      doubtId,
    });
  }

  return updated;
}
// 8. delete.
export async function deleteDoubt(
  doubtId: string,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  await getManageableDoubt(
    doubtId,
    userId,
    canManageAny,
    "You can only delete your own doubts unless you have moderation permission",
  );
  await prisma.doubt.update({
    where: { id: doubtId },
    data: { isActive: false },
  });
  return { id: doubtId, deleted: true };
}



export async function permanentlyDeleteDoubt(
  doubtId: string,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
 
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    select: { id: true, authorId: true },
  });
  if (!doubt) throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);
  if (doubt.authorId !== userId && !canManageAny)
    throw new AppError(
      "FORBIDDEN",
      "You can only delete your own doubts unless you have moderation permission",
      403,
    );
 
  await prisma.doubt.delete({ where: { id: doubtId } });
  return { id: doubtId, deleted: true, permanent: true };
}