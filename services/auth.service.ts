import { apiClient } from "./api-client";
import type { MediaUrl } from "@/src/types/setting/types";

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role: "learner" | "contributor" | "admin";
};

type RegisterResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const Base_Url = "/api/platform";

export async function registerUser(data: RegisterData): Promise<RegisterResponse> {
  return apiClient<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

type LoginData = {
  email: string;
  password: string;
  role: "learner" | "contributor" | "admin";
};

type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isOfficial: boolean;
  };
};

export async function loginUser(data: LoginData): Promise<LoginResponse> {
  return apiClient<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logoutUser() {
  return apiClient<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);

  return apiClient<{ avatar: MediaUrl }>(`${Base_Url}/avatar`, {
    method: "POST",
    body: form,
  });
}

export function removeAvatar() {
  return apiClient<{ avatar: null }>(`${Base_Url}/avatar`, { method: "DELETE" });
}

export function deleteMyAccount(password: string) {
  return apiClient<{ deleted: boolean }>(`${Base_Url}/account`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}