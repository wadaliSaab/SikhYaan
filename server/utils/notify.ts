import type { NotificationType } from "@/src/generated/prisma/client";
import  prisma  from "@/src/lib/prisma";
import { getIO } from "@/server/socket/io";       

const ADMIN_ROLE = "admin";

type To = "everyone" | "admins" | { users: string[] };

type NotifyInput = {
  to: To;
  type: NotificationType;
  title: string;
  message: string;

  doubtId?: string;
  replyId?: string;
  contentItemId?: string;
  testId?: string;
  roleRequestId?: string;


  skipUserId?: string;
};

async function adminIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { name: { equals: ADMIN_ROLE, mode: "insensitive" } },
    },
    select: { id: true },
  });

  return admins.map((a) => a.id);
}


export async function notify(input: NotifyInput): Promise<void> {
  try {
    const { to, skipUserId, ...data } = input;

   
    if (to === "everyone") {
      await prisma.notification.create({ data: { ...data, userId: null } });
      emit(null, data.type);
      return;
    }

  
    const ids = to === "admins" ? await adminIds() : to.users;
    const userIds = [...new Set(ids)].filter((id) => id !== skipUserId);

    if (userIds.length === 0) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ ...data, userId })),
    });

    emit(userIds, data.type);
  } catch (error) {
    console.error("[notify] failed:", error);
  }
}


function emit(userIds: string[] | null, type: NotificationType) {
  try {
    const io = getIO();

    if (userIds) {
      io.to(userIds.map((id) => `user:${id}`)).emit("notification:new", { type });
    } else {
      io.emit("notification:new", { type });
    }
  } catch {
    
  }
}

export const clip = (s: string, n = 60) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;