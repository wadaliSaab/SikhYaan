import { NextRequest } from "next/server";
import { getCurrentUser } from "./session";
import { AppError } from "@/server/utils/app-error";

export async function requireAuth(request: NextRequest) {
  const sessionToken = request.cookies.get("session")?.value;

  if (!sessionToken) {
    throw new AppError(
      "UNAUTHORIZED",
      "You must be logged in",
      401
    );
  }

  const user = await getCurrentUser(sessionToken);

  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "Your session is invalid or expired",
      401
    );
  }

  return user;
}

export async function requireRole(
  request: NextRequest,
  roleName: string
) {
  const user = await requireAuth(request);

  if (user.role.name !== roleName) {
    throw new AppError(
      "FORBIDDEN",
      "You don't have permission to perform this action",
      403
    );
  }

  return user;
}

export async function requireRoles(
  request: NextRequest,
  roles: string[]
) {
  const user = await requireAuth(request);

  if (!roles.includes(user.role.name)) {
    throw new AppError(
      "FORBIDDEN",
      "You don't have permission to perform this action",
      403
    );
  }

  return user;
}


export async function getOptionalUser(request: NextRequest) {
  try {
    return await requireAuth(request);
  } catch (error) {
    if (error instanceof AppError && error.code === "UNAUTHORIZED") return null;
throw error;
  }
}
 

export function isAdmin(user: { role: { name: string } }) {
  return user.role.name === "admin";
}

