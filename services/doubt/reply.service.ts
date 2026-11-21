
import { apiClient } from "../api-client";

const DOUBTS = "/api/doubts";
const REPLIES = "/api/doubts/replies";
const CATEGORIES = "/api/doubts/categories";


export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { doubts: number };
};
type Media = { id: string; url: string; fileName: string };
type Author = { id: string; name: string; isOfficial: boolean; avatar: Media | null };

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

export type Page<T> = {
  items: T[];
  pagination: { page: number; limit: number; total: number };
};

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


/* ───────── Replies ───────── */
export const listReplies = (
  doubtId: string,
  params: { parentReplyId?: string; page?: number; limit?: number } = {},
) => apiClient<Page<Reply>>(`${DOUBTS}/${doubtId}/replies${query(params)}`);

export const createReply = (data: { doubtId: string; body: string; replyToId?: string }) =>
  apiClient<Reply>(REPLIES, send("POST", data));

export const toggleReplyLike = (id: string) =>
  apiClient<{ replyId: string; liked: boolean; likeCount: number }>(`${REPLIES}/${id}/like`, send("POST"));

export const setReplyPinned = (id: string, isPinned: boolean) =>
  apiClient<{ replyId: string; isPinned: boolean }>(`${REPLIES}/${id}/pin`, send("PATCH", { isPinned }));

export const deleteReply = (id: string) =>
  apiClient<{ id: string; deleted: boolean }>(`${REPLIES}/${id}`, send("DELETE"));

/* ───────── Categories ───────── */
export const getCategories = () => apiClient<Category[]>(CATEGORIES);

export const createCategory = (name: string) =>
  apiClient<Category>(CATEGORIES, send("POST", { name }));