import path from "node:path";
import { uploadFile, deleteFile } from "@/src/lib/b2";
import { withUrlOrNull } from "@/server/services/doubt/media.service";
import { anonymizeAccount, assertNotLastAdmin } from "./settings/member.service";
import type { AuthUser } from "@/src/types/auth";
import argon2 from "argon2";
import { AppError } from "../utils/app-error";
import crypto from "crypto";
import prisma from "../../src/lib/prisma";
import { notify } from "../utils/notify";

type Role = "learner" | "contributor" | "admin";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};


const RANK: Record<string, number> = { learner: 1, contributor: 2, admin: 3 };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();


function notifyRoleRequested(requestId: string, userId: string, userName: string, role: string) {
  return notify({
    to: "admins",
    skipUserId: userId,
    type: "ROLE_REQUEST",
    title: "Role request",
    message: `${userName} has requested the ${cap(role)} role.`,
    roleRequestId: requestId,
  });
}


async function findOrCreateRole(
  tx: Pick<typeof prisma, "role">,
  name: string,
  description: string
) {
  return tx.role.upsert({
    where: { name },
    update: {},
    create: { name, description },
  });
}

export async function registerUser(input: RegisterInput) {
  const { name, email, password, role } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });


  if (existingUser) {
    return requestRoleForExistingUser(existingUser, input);
  }

 
  const passwordHash = await argon2.hash(password);

  const result = await prisma.$transaction(async (tx) => {
    const learnerRole = await findOrCreateRole(tx, "learner", "Access learning content");

    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        roleId: learnerRole.id,
      },
    });

    let requestId: string | null = null;

    if (role === "contributor" || role === "admin") {
      const requestedRole = await findOrCreateRole(tx, role, `${role} access`);

      const request = await tx.roleRequest.create({
        data: {
          userId: user.id,
          requestedRoleId: requestedRole.id,
        },
        select: { id: true },
      });
      requestId = request.id;
    }

    return { user, requestId };
  });


  if (result.requestId) {
    await notifyRoleRequested(result.requestId, result.user.id, result.user.name, role);
  }

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    role,
    requestSent: !!result.requestId,
  };
}


async function requestRoleForExistingUser(
  user: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    role: { name: string };
  },
  input: RegisterInput
) {
  const { name, password, role } = input;

 
  const sameName = user.name.trim().toLowerCase() === name.trim().toLowerCase();
  const samePassword = await argon2.verify(user.passwordHash, password).catch(() => false);

  if (!sameName || !samePassword) {
    throw new AppError("EMAIL_ALREADY_EXISTS", "Email already exists", 409);
  }

  
  if (!user.isActive) {
    throw new AppError("ACCOUNT_INACTIVE", "Your account is inactive", 403);
  }

  if ((RANK[role] ?? 0) <= (RANK[user.role.name] ?? 0)) {
    throw new AppError(
      "ROLE_ALREADY_HELD",
      "You already have this role or a higher one. Please login.",
      409
    );
  }

  const pending = await prisma.roleRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    throw new AppError(
      "REQUEST_ALREADY_PENDING",
      "You already have a pending role request",
      409
    );
  }

  const request = await prisma.$transaction(async (tx) => {
    const requestedRole = await findOrCreateRole(tx, role, `${role} access`);

    return tx.roleRequest.create({
      data: { userId: user.id, requestedRoleId: requestedRole.id },
      select: { id: true },
    });
  });

  await notifyRoleRequested(request.id, user.id, user.name, role);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    requestSent: true,
    existingAccount: true,
  };
}


export async function loginUser(data: {
  email: string;
  password: string;
  role: "learner" | "contributor" | "admin";
}) {
  const { email, password, role } = data;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "ACCOUNT_INACTIVE",
      "Your account is inactive",
      403
    );
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    password
  );

  if (!passwordValid) {
    throw new AppError(
      "INVALID_CREDENTIALS",
      "Invalid email or password",
      401
    );
  }

  if (user.role.name !== role) {
    throw new AppError(
      "ROLE_ACCESS_DENIED",
      `You don't have access to login as ${role}`,
      403
    );
  }

const sessionToken = crypto.randomBytes(32).toString("hex");

const sessionTokenHash = crypto
  .createHash("sha256")
  .update(sessionToken)
  .digest("hex");

const expiresAt = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
);

await prisma.session.create({
  data: {
    userId: user.id,
    sessionTokenHash,
    expiresAt,
  },
});

 return {
  sessionToken,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name,
    isOfficial: user.isOfficial,
  },
};
}



export async function logoutUser(sessionToken: string) {
  const sessionTokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  await prisma.session.deleteMany({ where: { sessionTokenHash } });
  return { ok: true };
}

/* ───────── Avatar ───────── */

export type UploadedAvatar = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; 
const AVATAR_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const avatarSelect = { id: true, fileKey: true, fileName: true } as const;

export async function updateAvatar(userId: string, image: UploadedAvatar) {
  const ext = AVATAR_EXT[image.mimeType];
  if (!ext)
    throw new AppError("INVALID_IMAGE_TYPE", "Only JPEG, PNG, and WebP images are allowed", 400);

  if (
    !Number.isInteger(image.size) ||
    image.size <= 0 ||
    image.size > MAX_AVATAR_SIZE ||
    image.buffer.length !== image.size
  )
    throw new AppError("INVALID_IMAGE_SIZE", "Avatar must be smaller than 2 MB", 400);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: { select: avatarSelect } },
  });
  if (!user) throw new AppError("UNAUTHORIZED", "Login is required", 401);
  const old = user.avatar;


  const fileKey = `avatars/${crypto.randomUUID()}${ext}`;
  await uploadFile(fileKey, image.buffer, image.mimeType);


  let media;
  try {
    media = await prisma.$transaction(async (tx) => {
      const created = await tx.media.create({
        data: {
          type: "IMAGE",
          fileKey,
          fileName: path.basename(image.fileName),
          mimeType: image.mimeType,
          size: image.size,
        },
        select: avatarSelect,
      });
      await tx.user.update({ where: { id: userId }, data: { avatarMediaId: created.id } });
      if (old) await tx.media.delete({ where: { id: old.id } });
      return created;
    });
  } catch (error) {
    await deleteFile(fileKey).catch(() => {}); 
    throw error;
  }

 
  if (old) await deleteFile(old.fileKey).catch(() => {});

  return { avatar: await withUrlOrNull(media) };
}

export async function removeAvatar(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: { select: avatarSelect } },
  });
  const old = user?.avatar;
  if (!old) return { avatar: null };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { avatarMediaId: null } });
    await tx.media.delete({ where: { id: old.id } });
  });
  await deleteFile(old.fileKey).catch(() => {});

  return { avatar: null };
}



export async function deleteMyAccount(userId: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, deletedAt: true },
  });
  if (!user || user.deletedAt)
    throw new AppError("UNAUTHORIZED", "Login is required", 401);

  const valid = await argon2.verify(user.passwordHash, password).catch(() => false);
  if (!valid) throw new AppError("INVALID_PASSWORD", "Password is incorrect", 401);

  await assertNotLastAdmin(userId);
  await anonymizeAccount(userId);

  return { deleted: true };
}





export async function getAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: { select: { name: true } },
      avatar: { select: avatarSelect },
    },
  });
  if (!user) return null;

  const avatar = await withUrlOrNull(user.avatar);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as AuthUser["role"],
    createdAt: user.createdAt.toISOString(),
    avatarUrl: avatar?.url ?? null,
  };
}