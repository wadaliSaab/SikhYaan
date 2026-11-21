import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/schemas/auth.schema";
import { loginUser } from "../services/auth.service";
import { registerSchema } from "@/schemas/auth.schema";
import { registerUser , updateAvatar, removeAvatar, deleteMyAccount , logoutUser  } from "../services/auth.service";
import { successResponse, errorResponse } from "../utils/api-response";
import { AppError } from "../utils/app-error";

import { deleteAccountSchema } from "@/schemas/settings/schema";


import { handleError } from "../utils/handle-error";

import { requireAuth } from "@/src/lib/auth/authorization";


export async function registerController(request: NextRequest) {
  try {
    const body = await request.json();

    const data = registerSchema.parse(body);

    const result = await registerUser(data);

const existing = "existingAccount" in result;

return successResponse(
  result,
  existing
    ? "Role request sent. Login as your current role until it is approved."
    : "Registration successful",
  existing ? 200 : 201
);

    
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(
        error.code,
        error.message,
        error.statusCode
      );
    }

    if (error instanceof ZodError) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid registration data",
        400
      );
    }

    console.error("Registration error:", error);

    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "Something went wrong",
      500
    );
  }
}





export async function loginController(request: NextRequest) {
  try {
    const body = await request.json();

    const data = loginSchema.parse(body);

    const result = await loginUser(data);

    const response = successResponse(
      {
        user: result.user,
      },
      "Login successful",
      200
    );

    response.cookies.set("session", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(
        error.code,
        error.message,
        error.statusCode
      );
    }

    if (error instanceof ZodError) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid login data",
        400
      );
    }

    console.error("Login error:", error);

    return errorResponse(
      "INTERNAL_SERVER_ERROR",
      "Something went wrong",
      500
    );
  }
}


export async function logoutController(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  try {
    if (token) await logoutUser(token);
  } catch (error) {
    console.error("Logout error:", error);
  }


  const response = successResponse({ ok: true }, "Logged out", 200);
  response.cookies.delete("session");
  return response;
}



export async function updateAvatarController(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const file = (await request.formData()).get("file");
    if (!(file instanceof File))
      throw new AppError("FILE_REQUIRED", "Image file is required", 400);

    const result = await updateAvatar(user.id, {
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return successResponse(result, "Avatar updated", 200);
  } catch (error) {
    return handleError(error, "Update avatar error:");
  }
}

export async function removeAvatarController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await removeAvatar(user.id), "Avatar removed", 200);
  } catch (error) {
    return handleError(error, "Remove avatar error:");
  }
}

export async function deleteAccountController(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { password } = deleteAccountSchema.parse(await request.json());

    const result = await deleteMyAccount(user.id, password);

    const response = successResponse(result, "Account deleted", 200);
    response.cookies.delete("session");
    return response;
  } catch (error) {
    return handleError(error, "Delete account error:");
  }
}