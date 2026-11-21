import { apiClient } from "../api-client";
import { qs } from "../query";
import type { MediaUrl, Paginated } from "@/src/types/setting/types";
import type { UserRole as RoleName } from "@/src/types/auth";

export type Member = {
  id: string;
  name: string;
  email: string;
  isOfficial: boolean;
  createdAt: string;
  role: RoleName;
  suspended: boolean;
  avatar: MediaUrl;
};

export type MemberStats = Partial<Record<RoleName, number>>;

export type MemberParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: RoleName;
  status?: "active" | "suspended";
};

const BASE = "/api/platform/members";

export function getMembers(params: MemberParams = {}) {
  return apiClient<Paginated<Member> & { stats: MemberStats }>(`${BASE}${qs(params)}`);
}

const act = (id: string, action: "suspend" | "restore" | "remove") =>
  apiClient<{ id: string }>(BASE, {
    method: "POST",
    body: JSON.stringify({ id, action }),
  });

export const suspendMember = (id: string) => act(id, "suspend");
export const restoreMember = (id: string) => act(id, "restore");
export const removeMember = (id: string) => act(id, "remove");