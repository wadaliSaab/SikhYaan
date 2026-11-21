import crypto from "node:crypto";
import argon2 from "argon2";
import prisma from "@/src/lib/prisma";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { withUrlOrNull } from "@/server/services/doubt/media.service";
import { deleteFile } from "@/src/lib/b2";
import { getIO } from "@/server/socket/io";
import type { Prisma } from "@/src/generated/prisma/client";

const ADMIN_ROLE = "admin";


export async function assertNotLastAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });
  if (user?.role.name.toLowerCase() !== ADMIN_ROLE) return;

  const others = await prisma.user.count({
    where: {
      id: { not: userId },
      isActive: true,
      deletedAt: null,
      role: { name: { equals: ADMIN_ROLE, mode: "insensitive" } },
    },
  });
  if (others === 0)
    throw new AppError("LAST_ADMIN", "At least one active admin must remain", 409);
}


export function kickUser(userId: string) {
  try {
    getIO().in(`user:${userId}`).disconnectSockets(true);
  } catch {
   
  }
}


export async function anonymizeAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: { select: { id: true, fileKey: true } } },
  });
  const avatar = user?.avatar ?? null;

 
  const unusable = await argon2.hash(crypto.randomBytes(32).toString("hex"));

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId } });
    await tx.doubtLike.deleteMany({ where: { userId } });
    await tx.replyLike.deleteMany({ where: { userId } });
    await tx.doubtBookmark.deleteMany({ where: { userId } });
    await tx.notificationRead.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.roleRequest.deleteMany({ where: { userId } });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Deleted user",
        email: `deleted-${userId}@deleted.invalid`, 
        passwordHash: unusable,
        isActive: false,
        isOfficial: false,
        avatarMediaId: null,
        deletedAt: new Date(),
      },
    });

    if (avatar) await tx.media.delete({ where: { id: avatar.id } });
  });

  if (avatar) await deleteFile(avatar.fileKey).catch(() => {});
  kickUser(userId);
}

/* ───────── Members list (admin) ───────── */

type ListMembersInput = PaginationInput & {
  search?: string;
  role?: string; 
  status?: "active" | "suspended";
};

export async function listMembers(input: ListMembersInput = {}) {
  const { page, limit, skip } = getPage(input);
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (input.role) where.role = { name: { equals: input.role, mode: "insensitive" } };
  if (input.status) where.isActive = input.status === "active";

  const search = input.search?.trim();
  if (search)
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isOfficial: true,
        createdAt: true,
        role: { select: { name: true } },
        avatar: { select: { id: true, fileKey: true, fileName: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: await Promise.all(
      items.map(async ({ role, avatar, isActive, ...user }) => ({
        ...user,
        role: role.name,
        suspended: !isActive,
        avatar: await withUrlOrNull(avatar),
      })),
    ),
    pagination: pagination(page, limit, total),
  };
}


export async function memberStats() {
  const roles = await prisma.role.findMany({
    select: { name: true, _count: { select: { users: { where: { deletedAt: null } } } } },
  });
  return Object.fromEntries(roles.map((r) => [r.name.toLowerCase(), r._count.users]));
}

/* ───────── Suspend / Restore / Remove (admin) ───────── */

async function getTarget(targetId: string) {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, isActive: true, deletedAt: true },
  });
  if (!target || target.deletedAt)
    throw new AppError("USER_NOT_FOUND", "User not found", 404);
  return target;
}

export async function suspendMember(targetId: string, adminId: string) {
  if (targetId === adminId)
    throw new AppError("FORBIDDEN", "You cannot suspend your own account", 403);

  const target = await getTarget(targetId);
  if (!target.isActive)
    throw new AppError("ALREADY_SUSPENDED", "Account is already suspended", 409);

  await assertNotLastAdmin(targetId);

  await prisma.$transaction([
    prisma.user.update({ where: { id: targetId }, data: { isActive: false } }),
    prisma.session.deleteMany({ where: { userId: targetId } }),
  ]);
  kickUser(targetId);

  return { id: targetId, suspended: true };
}

export async function restoreMember(targetId: string) {
  const target = await getTarget(targetId);
  if (target.isActive)
    throw new AppError("NOT_SUSPENDED", "Account is not suspended", 409);

  await prisma.user.update({ where: { id: targetId }, data: { isActive: true } });
  return { id: targetId, suspended: false };
}

export async function removeMember(targetId: string, adminId: string) {
  if (targetId === adminId)
    throw new AppError("FORBIDDEN", "Use \"Delete my account\" to remove yourself", 403);

  await getTarget(targetId);
  await assertNotLastAdmin(targetId);
  await anonymizeAccount(targetId);

  return { id: targetId, removed: true };
}