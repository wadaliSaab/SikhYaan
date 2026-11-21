import { apiClient } from "../api-client";
import { qs } from "../query";
import type { MediaUrl, Paginated } from "@/src/types/setting/types";
import type { UserRole as RoleName } from "@/src/types/auth";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";


export type RoleRequestCard = {
  id: string;
  status: RequestStatus;
  reviewNote: string | null;
  createdAt: string;
  requestedRole: { id: string; name: RoleName };
  user: {
    id: string;
    name: string;
    email: string;
    currentRole: RoleName;
    avatar: MediaUrl;
  };
};


export type MyRequest = {
  id: string;
  status: RequestStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  role: RoleName;
};

export type RequestParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: RequestStatus; 
};

const Base_Url = "/api/platform/role/requests";


export function getRoleRequests(params: RequestParams = {}) {
  return apiClient<Paginated<RoleRequestCard>>(`${Base_Url}${qs(params)}`);
}

export function decideRequest(id: string, approve: boolean, note?: string) {
  return apiClient<{ id: string; status: RequestStatus }>(`${Base_Url}`, {
    method: "POST",
    body: JSON.stringify({ id, approve, note }),
  });
}

/* Learner / contributor */

export function getMyRequests() {
  return apiClient<{ items: MyRequest[] }>(`${Base_Url}/mine`);
}

export function markMyRequestsSeen() {
  return apiClient<{ marked: number }>(`${Base_Url}/mine`, { method: "POST" });
}