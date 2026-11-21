import prisma from "@/src/lib/prisma";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import {
  countPendingRequests,
  countMyUnseenResults,
} from "../settings/role-request.service";
import type { NotificationType, Prisma } from "@/src/generated/prisma/client";

const BROADCAST_DAYS = 30;


const FILTERS = {
  content: ["CONTENT_ADDED", "CONTENT_UPDATED"],
  test: ["TEST_ADDED"],
  doubt: ["DOUBT_REPLY", "REPLY_TO_REPLY", "DOUBT_RESOLVED", "DOUBT_PINNED", "NEW_DOUBT"],
  request: ["ROLE_REQUEST", "ROLE_APPROVED", "ROLE_DECLINED"],
  system: ["SYSTEM"],
} as const satisfies Record<string, NotificationType[]>;

export type NotificationFilter = "all" | keyof typeof FILTERS;


const REQUEST_TYPES: NotificationType[] = ["ROLE_REQUEST", "ROLE_APPROVED", "ROLE_DECLINED"];

type Viewer = { id: string; createdAt: Date; role: string };

async function getViewer(userId: string): Promise<Viewer> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, createdAt: true, role: { select: { name: true } } },
  });
  if (!user) throw new AppError("UNAUTHORIZED", "Login is required", 401);
  return { id: user.id, createdAt: user.createdAt, role: user.role.name };
}


function broadcastSince(viewer: Viewer | null) {
  const limit = new Date(Date.now() - BROADCAST_DAYS * 24 * 60 * 60 * 1000);
  return viewer && viewer.createdAt > limit ? viewer.createdAt : limit;
}

function visibleWhere(viewer: Viewer | null): Prisma.NotificationWhereInput {
  const broadcast = { userId: null, createdAt: { gte: broadcastSince(viewer) } };
  return viewer ? { OR: [{ userId: viewer.id }, broadcast] } : broadcast;
}

/* ───────── List ───────── */

type ListInput = PaginationInput & {
  filter?: NotificationFilter;
  search?: string;
  unreadOnly?: boolean;
};


export async function listNotifications(userId: string | null, input: ListInput = {}) {
  const viewer = userId ? await getViewer(userId) : null;
  const { page, limit, skip } = getPage(input);

  const and: Prisma.NotificationWhereInput[] = [visibleWhere(viewer)];

  if (input.filter && input.filter !== "all")
    and.push({ type: { in: [...FILTERS[input.filter]] } });

  const search = input.search?.trim();
  if (search)
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ],
    });

  if (input.unreadOnly && viewer)
    and.push({
      OR: [
        { userId: viewer.id, read: false },
        { userId: null, reads: { none: { userId: viewer.id } } },
      ],
    });

  const where: Prisma.NotificationWhereInput = { AND: and };

  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
     include: {
        contentItem: { select: { referenceId: true } },
        reply: { select: { parentReplyId: true } },
        reads: { where: { userId: viewer?.id ?? "" }, select: { userId: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      broadcast: n.userId === null,
      isRead: !viewer ? false : n.userId ? n.read : n.reads.length > 0,
     
           target: {
        contentReferenceId: n.contentItem?.referenceId ?? null,
        doubtId: n.doubtId,
        replyId: n.replyId,
        replyParentId: n.reply?.parentReplyId ?? null,
        testId: n.testId,
        roleRequestId: n.roleRequestId,
      },
    })),
    pagination: pagination(page, limit, total),
  };
}



export async function getCounts(userId: string) {
  const viewer = await getViewer(userId);
  const isAdmin = viewer.role.toLowerCase() === "admin";

  const [personal, broadcast, members, myRequests] = await Promise.all([
    prisma.notification.count({
      where: { userId, read: false, type: { notIn: REQUEST_TYPES } },
    }),
    prisma.notification.count({
      where: {
        userId: null,
        createdAt: { gte: broadcastSince(viewer) },
        reads: { none: { userId } },
      },
    }),
    isAdmin ? countPendingRequests() : 0,
    isAdmin ? 0 : countMyUnseenResults(userId),
  ]);

  const notifications = personal + broadcast;
  return {
    notifications,
    members,
    myRequests,
    total: notifications + members + myRequests, 
  };
}



export async function markRead(userId: string, notificationId: string) {
  const viewer = await getViewer(userId);

  const n = await prisma.notification.findFirst({
    where: { AND: [{ id: notificationId }, visibleWhere(viewer)] },
    select: { id: true, userId: true },
  });
  if (!n) throw new AppError("NOTIFICATION_NOT_FOUND", "Notification not found", 404);

  if (n.userId) {
    await prisma.notification.update({ where: { id: n.id }, data: { read: true } });
  } else {
    await prisma.notificationRead.createMany({
      data: [{ userId, notificationId: n.id }],
      skipDuplicates: true,
    });
  }
  return { id: n.id, isRead: true };
}

/**
 * scope "general": Notifications section kholan te (request wali nahi chhedni)
 * scope "all": "Mark all as read" button
 */
export async function markAllRead(userId: string, scope: "general" | "all" = "all") {
  const viewer = await getViewer(userId);

  await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
      ...(scope === "general" ? { type: { notIn: REQUEST_TYPES } } : {}),
    },
    data: { read: true },
  });

  const unread = await prisma.notification.findMany({
    where: {
      userId: null,
      createdAt: { gte: broadcastSince(viewer) },
      reads: { none: { userId } },
    },
    select: { id: true },
  });

  if (unread.length)
    await prisma.notificationRead.createMany({
      data: unread.map((n) => ({ userId, notificationId: n.id })),
      skipDuplicates: true,
    });

  return { ok: true };
}