import { apiClient } from "../api-client";
import { qs } from "../query";
import type { Paginated } from "@/src/types/setting/types";

export type NotificationType =
  | "CONTENT_ADDED"
  | "CONTENT_UPDATED"
  | "TEST_ADDED"
  | "DOUBT_REPLY"
  | "REPLY_TO_REPLY"
  | "DOUBT_RESOLVED"
  | "DOUBT_PINNED"
  | "NEW_DOUBT"
  | "ROLE_REQUEST"
  | "ROLE_APPROVED"
  | "ROLE_DECLINED"
  | "SYSTEM";

export type NotificationFilter = "all" | "content" | "test" | "doubt" | "request" | "system";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  broadcast: boolean; 
  isRead: boolean;
  target: {
    contentReferenceId: string | null;
    doubtId: string | null;
    replyId: string | null;
    replyParentId: string | null;
    testId: string | null;
    roleRequestId: string | null;
  };
};

export type Counts = {
  notifications: number;
  members: number; 
  myRequests: number; 
  total: number; 
};

export type NotificationParams = {
  page?: number;
  limit?: number;
  filter?: NotificationFilter;
  search?: string;
  unread?: boolean;
};

const BASE = "/api/platform/notifications";


export function getNotifications(params: NotificationParams = {}) {
  return apiClient<Paginated<NotificationItem>>(`${BASE}${qs(params)}`);
}

export function getCounts() {
  return apiClient<Counts>(`${BASE}/counts`);
}

export function markNotificationRead(id: string) {
  return apiClient<{ id: string; isRead: boolean }>(`${BASE}`, {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}


export function markAllNotificationsRead(scope: "general" | "all" = "all") {
  return apiClient<{ ok: boolean }>(`${BASE}`, {
    method: "POST",
    body: JSON.stringify({ scope }),
  });
}