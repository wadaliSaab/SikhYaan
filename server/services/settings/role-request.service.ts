import prisma from "@/src/lib/prisma";
import { AppError } from "@/server/utils/app-error";
import { getPage, pagination, type PaginationInput } from "@/server/utils/pagination";
import { withUrlOrNull } from "@/server/services/doubt/media.service";
import { notify, clip } from "../../utils/notify";
import { getIO } from "@/server/socket/io";
import type { Prisma, RoleRequestStatus } from "@/src/generated/prisma/client";

const RANK: Record<string, number> = { learner: 1, contributor: 2, admin: 3 };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

const requestInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: { select: { name: true } },
      avatar: { select: { id: true, fileKey: true, fileName: true } },
    },
  },
  requestedRole: { select: { id: true, name: true } },
} satisfies Prisma.RoleRequestInclude;



type ListRequestsInput = PaginationInput & {
  search?: string;
  status?: RoleRequestStatus; 
};


export async function listRequests(input: ListRequestsInput = {}) {
  const { page, limit, skip } = getPage(input);
  const where: Prisma.RoleRequestWhereInput = { status: input.status ?? "PENDING" };

  const search = input.search?.trim();
  if (search)
    where.user = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    };

  const [items, total] = await prisma.$transaction([
    prisma.roleRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: requestInclude,
    }),
    prisma.roleRequest.count({ where }),
  ]);

  return {
    items: await Promise.all(
      items.map(async ({ user, ...rest }) => ({
        ...rest,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          currentRole: user.role.name,
          avatar: await withUrlOrNull(user.avatar),
        },
      })),
    ),
    pagination: pagination(page, limit, total),
  };
}

export function countPendingRequests() {
  return prisma.roleRequest.count({ where: { status: "PENDING" } });
}



export async function decideRoleRequest(
  requestId: string,
  approve: boolean,
  adminId: string,
  note?: string,
) {
  const request = await prisma.$transaction(async (tx) => {
    const found = await tx.roleRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        requestedRoleId: true,
        requestedRole: { select: { name: true } },
        user: { select: { role: { select: { name: true } } } },
      },
    });
    if (!found) throw new AppError("REQUEST_NOT_FOUND", "Request not found", 404);
    if (found.userId === adminId)
      throw new AppError("FORBIDDEN", "You cannot decide your own request", 403);

    
    const updated = await tx.roleRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: approve ? "APPROVED" : "REJECTED",
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote: note?.trim() || null,
      },
    });
    if (!updated.count)
      throw new AppError("REQUEST_ALREADY_DECIDED", "This request was already decided", 409);

 
    const wanted = RANK[found.requestedRole.name.toLowerCase()] ?? 0;
    const current = RANK[found.user.role.name.toLowerCase()] ?? 0;
    if (approve && wanted > current)
      await tx.user.update({ where: { id: found.userId }, data: { roleId: found.requestedRoleId } });

 
    await tx.notification.updateMany({
      where: { roleRequestId: requestId, type: "ROLE_REQUEST" },
      data: { read: true },
    });

    return found;
  });

  const role = cap(request.requestedRole.name);
  const reason = note?.trim() ? ` Note: ${clip(note.trim(), 120)}` : "";

  await notify({
    to: { users: [request.userId] },
    type: approve ? "ROLE_APPROVED" : "ROLE_DECLINED",
    title: approve ? "Request approved" : "Request update",
    message: approve
      ? `Your ${role} role request has been approved. Login as ${role} to continue.`
      : `Your ${role} role request was not approved.${reason}`,
    roleRequestId: requestId,
  });


  try {
    getIO().to("role:admin").emit("counts:changed");
  } catch {
    
  }

  return { id: requestId, status: approve ? "APPROVED" : "REJECTED" };
}



export async function listMyRequests(userId: string) {
  const items = await prisma.roleRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      reviewNote: true,
      createdAt: true,
      reviewedAt: true,
      requestedRole: { select: { name: true } },
    },
  });

  return { items: items.map(({ requestedRole, ...r }) => ({ ...r, role: requestedRole.name })) };
}

const RESULT_TYPES = ["ROLE_APPROVED", "ROLE_DECLINED"] as const;


export function countMyUnseenResults(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false, type: { in: [...RESULT_TYPES] } },
  });
}


export async function markMyRequestsSeen(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false, type: { in: [...RESULT_TYPES] } },
    data: { read: true },
  });
  return { marked: result.count };
}