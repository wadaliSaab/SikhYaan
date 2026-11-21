import type { NotificationItem } from "@/services/settings/notification.sevice";
import type { UserRole } from "@/src/types/auth";


export const ROUTES = {
  content: (referenceId: string) => `/${referenceId}`,


  doubt: (doubtId: string, replyId?: string | null, parentId?: string | null) => {
    const q = new URLSearchParams({ d: doubtId });
    if (replyId) q.set("r", replyId);
    if (parentId) q.set("p", parentId);
    return `/doubt?${q}`;
  },

  
  test: (testId: string) => `/gyaan/test?id=${encodeURIComponent(testId)}`,
};

export type NotificationAction =
  | { type: "route"; href: string }
  | { type: "tab"; tab: "members" | "requests" } 
  | null;

export function notificationAction(n: NotificationItem, role: UserRole): NotificationAction {
  const t = n.target;

  if (t.roleRequestId)
    return { type: "tab", tab: role === "admin" ? "members" : "requests" };

  if (t.contentReferenceId)
    return { type: "route", href: ROUTES.content(t.contentReferenceId) };

  if (t.doubtId)
    return { type: "route", href: ROUTES.doubt(t.doubtId, t.replyId, t.replyParentId) };

  if (t.testId) return { type: "route", href: ROUTES.test(t.testId) };

  return null; 
}