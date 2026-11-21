import crypto from "crypto";
import prisma from "../prisma";





export async function getCurrentUser(sessionToken: string) {
  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const session = await prisma.session.findUnique({
    where: {
      sessionTokenHash,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}