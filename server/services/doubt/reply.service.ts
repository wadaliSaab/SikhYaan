import prisma from "@/src/lib/prisma";
import { notify, clip } from "../../utils/notify";
import { AppError } from "@/server/utils/app-error";
import { withUrlOrNull } from "./media.service";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { Prisma } from "@/src/generated/prisma/client";

export type CreateReplyInput = {
  doubtId: string;
  body: string;
  replyToId?: string | null; 
};

const MAX_BODY_LENGTH = 5000;

function requireSignedIn(userId: string) {
  if (!userId) throw new AppError("UNAUTHORIZED", "Login is required", 401);
}

const replyInclude = (userId?: string) =>
  ({
    author: {
      select: {
        id: true,
        name: true,
        isOfficial: true,
        avatar: { select: { id: true, fileKey: true, fileName: true } },
      },
    },
    
    replyTo: {
      select: { id: true, author: { select: { id: true, name: true } } },
    },
    _count: { select: { likes: true, childReplies: true } },
    ...(userId
      ? { likes: { where: { userId }, select: { userId: true } } }
      : {}),
  }) satisfies Prisma.ReplyInclude;

export async function formatReply<
  T extends {
    author: { avatar: { fileKey: string } | null };
    _count: { likes: number; childReplies: number };
    likes?: { userId: string }[];
  },
>(item: T, userId?: string) {
  const { _count, likes, ...reply } = item;
  return {
    ...reply,
    author: {
      ...reply.author,
      avatar: await withUrlOrNull(reply.author.avatar),
    },
    likeCount: _count.likes,
    childReplyCount: _count.childReplies,
    liked: userId ? (likes?.length ?? 0) > 0 : false,
  };
}


export async function findReplies(
  doubtId: string,
  parentReplyId: string | null,
  pageInput: PaginationInput,
  currentUserId?: string,
) {
  const { page, limit, skip } = getPage(pageInput);
  const where: Prisma.ReplyWhereInput = { doubtId, parentReplyId };
  const [items, total] = await prisma.$transaction([
    prisma.reply.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
      include: replyInclude(currentUserId),
    }),
    prisma.reply.count({ where }),
  ]);
  return {
    items: await Promise.all(
      items.map((item) => formatReply(item, currentUserId)),
    ),
    pagination: pagination(page, limit, total),
  };
}


export async function listReplies(
  doubtId: string,
  input: PaginationInput & { parentReplyId?: string | null } = {},
  currentUserId?: string,
) {
  const doubt = await prisma.doubt.findFirst({
    where: { id: doubtId, isActive: true },
    select: { id: true },
  });
  if (!doubt) throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);

  const parentReplyId = input.parentReplyId ?? null;
  if (parentReplyId) {
    const parent = await prisma.reply.findFirst({
      where: { id: parentReplyId, doubtId, parentReplyId: null },
      select: { id: true },
    });
    if (!parent) throw new AppError("REPLY_NOT_FOUND", "Reply not found", 404);
  }
  return findReplies(doubtId, parentReplyId, input, currentUserId);
}


export async function createReply(
  input: CreateReplyInput,
  userId: string,
) {
  requireSignedIn(userId);

  const body = input.body.trim();

  if (body.length < 1 || body.length > MAX_BODY_LENGTH) {
    throw new AppError(
      "INVALID_BODY",
      `Reply must be between 1 and ${MAX_BODY_LENGTH} characters`,
      400,
    );
  }

  const doubt = await prisma.doubt.findFirst({
    where: { id: input.doubtId, isActive: true },
    select: { id: true, authorId: true, title: true },
  });

  if (!doubt) {
    throw new AppError("DOUBT_NOT_FOUND", "Doubt not found", 404);
  }

  let parentReplyId: string | null = null;
  let replyToId: string | null = null;
  let recipientId = doubt.authorId;

  if (input.replyToId) {
    const target = await prisma.reply.findFirst({
      where: {
        id: input.replyToId,
        doubtId: doubt.id,
      },
      select: {
        id: true,
        authorId: true,
        parentReplyId: true,
      },
    });

    if (!target) {
      throw new AppError("REPLY_NOT_FOUND", "Reply not found", 404);
    }

    parentReplyId = target.parentReplyId ?? target.id;
    replyToId = target.id;
    recipientId = target.authorId;
  }

  const created = await prisma.$transaction(async (tx) => {
    const reply = await tx.reply.create({
      data: {
        doubtId: doubt.id,
        authorId: userId,
        body,
        parentReplyId,
        replyToId,
      },
      include: replyInclude(userId),
    });

    return await formatReply(reply, userId);
  });

  
  try {
    await notify({
      to: { users: [recipientId] },
      skipUserId: userId,
      type: replyToId ? "REPLY_TO_REPLY" : "DOUBT_REPLY",
      title: replyToId
        ? "New reply to your comment"
        : "New reply to your doubt",
      message: replyToId
        ? `${created.author.name} replied to your comment on "${clip(doubt.title)}".`
        : `${created.author.name} replied to your doubt "${clip(doubt.title)}".`,
      doubtId: doubt.id,
      replyId: created.id,
    });
  } catch (error) {
   
    console.error("Reply notification failed:", error);
  }

  return { reply: created };
}


export async function toggleReplyLike(replyId: string, userId: string) {
  requireSignedIn(userId);
  const reply = await prisma.reply.findFirst({
    where: { id: replyId, doubt: { isActive: true } },
    select: { id: true },
  });
  if (!reply) throw new AppError("REPLY_NOT_FOUND", "Reply not found", 404);

  const key = { userId_replyId: { userId, replyId } };
  const existing = await prisma.replyLike.findUnique({
    where: key,
    select: { userId: true },
  });
  if (existing) await prisma.replyLike.delete({ where: key });
  else await prisma.replyLike.create({ data: { userId, replyId } });

  const likeCount = await prisma.replyLike.count({ where: { replyId } });
  return { replyId, liked: !existing, likeCount };
}

export async function setReplyPinned(replyId: string, isPinned: boolean) {
  const result = await prisma.reply.updateMany({
    where: { id: replyId, doubt: { isActive: true } },
    data: { isPinned },
  });
  if (!result.count)
    throw new AppError("REPLY_NOT_FOUND", "Reply not found", 404);
  return { replyId, isPinned };
}



export async function deleteReply(
  replyId: string,
  userId: string,
  canManageAny = false,
) {
  requireSignedIn(userId);
  const reply = await prisma.reply.findFirst({
    where: { id: replyId, doubt: { isActive: true } },
    select: { id: true, authorId: true },
  });
  if (!reply) throw new AppError("REPLY_NOT_FOUND", "Reply not found", 404);
  if (reply.authorId !== userId && !canManageAny)
    throw new AppError(
      "FORBIDDEN",
      "You can only delete your own replies unless you have moderation permission",
      403,
    );

  await prisma.reply.delete({ where: { id: replyId } });
  return { id: replyId, deleted: true };
}