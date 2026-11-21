import { apiClient } from "../api-client";


const DOUBTS = "/api/doubts";
const CATEGORIES = "/api/doubts/categories";

/* ───────── Types ───────── */
type Media = { id: string; url: string; fileName: string };
type Author = { id: string; name: string; isOfficial: boolean; avatar: Media | null };

export type Page<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number };
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { doubts: number };
};

export type Doubt = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: string;
  author: Author;
  category: { id: string; name: string; slug: string };
  referencedContent: { id: string; referenceId: string; title: string } | null;
  images: { mediaId: string; sortOrder: number; media: Media }[];
  likeCount: number;
  replyCount: number;
  liked: boolean;
  bookmarked: boolean;
};

export type Reply = {
  id: string;
  doubtId: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  parentReplyId: string | null;
  author: Author;
  replyTo: { id: string; author: { id: string; name: string } } | null;
  likeCount: number;
  childReplyCount: number;
  liked: boolean;
};

export type ListDoubtsParams = {
  search?: string;
  categorySlug?: string;
  sort?: "recent" | "helpful" | "unanswered";
  mine?: boolean;
  saved?: boolean;
  page?: number;
  limit?: number;
};

export type CreateDoubtData = {
  title: string;
  body: string;
  categoryId: string;
  referenceId?: string;
  images?: File[];
};

/* ───────── Helpers ───────── */
const query = (params: Record<string, string | number | boolean | undefined>) => {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const text = q.toString();
  return text ? `?${text}` : "";
};

const send = (method: string, data?: unknown) => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});

/* ───────── Doubts ───────── */
export const listDoubts = (params: ListDoubtsParams = {}) =>
  apiClient<Page<Doubt>>(`${DOUBTS}${query(params)}`);

export const getDoubt = (id: string, params: { page?: number; limit?: number } = {}) =>
  apiClient<{ doubt: Doubt; directReplies: Page<Reply> }>(`${DOUBTS}/${id}${query(params)}`);

export function createDoubt(data: CreateDoubtData) {
  const form = new FormData();
  form.append("title", data.title);
  form.append("body", data.body);
  form.append("categoryId", data.categoryId);
  if (data.referenceId) form.append("referenceId", data.referenceId);
  data.images?.forEach((file) => form.append("images", file));

  return apiClient<Doubt>(DOUBTS, { method: "POST", body: form });
}

export const toggleDoubtLike = (id: string) =>
  apiClient<{ doubtId: string; liked: boolean; likeCount: number }>(`${DOUBTS}/${id}/like`, send("POST"));

export const toggleDoubtBookmark = (id: string) =>
  apiClient<{ doubtId: string; bookmarked: boolean }>(`${DOUBTS}/${id}/bookmark`, send("POST"));

export const setDoubtPinned = (id: string, isPinned: boolean) =>
  apiClient<{ doubtId: string; isPinned: boolean }>(`${DOUBTS}/${id}/pin`, send("PATCH", { isPinned }));

export const setDoubtResolved = (id: string, isResolved: boolean) =>
  apiClient<{ id: string; isResolved: boolean }>(`${DOUBTS}/${id}/resolve`, send("PATCH", { isResolved }));

export const deleteDoubt = (id: string) =>
  apiClient<{ id: string; deleted: boolean }>(`${DOUBTS}/${id}`, send("DELETE"));

export const permanentlyDeleteDoubt = (id: string) =>
  apiClient<{ id: string; deleted: boolean }>(`${DOUBTS}/${id}/permanent`, send("DELETE"));



/* ───────── Categories ───────── */
export const getCategories = () => apiClient<Category[]>(CATEGORIES);

export const createCategory = (name: string) =>
  apiClient<Category>(CATEGORIES, send("POST", { name }));