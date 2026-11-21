import type { Doubt as ApiDoubt, Reply as ApiReply } from "@/services/doubt/doubt.service";
import type { Doubt } from "@/components/doubt/content/Doubts";

const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units: [number, string][] = [
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];

  for (const [size, label] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ago`;
  }
  return "Just now";
};

export const toUiDoubt = (doubt: ApiDoubt): Doubt => ({
  id: doubt.id,
  authorId: doubt.author.id,
  avatarUrl: doubt.author.avatar?.url ?? "",
  name: doubt.author.name,
  time: timeAgo(doubt.createdAt),
  category: doubt.category.name,
  title: doubt.title,
  body: doubt.body,
  images: [...doubt.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((image) => image.media.url),
  referenceId: doubt.referencedContent?.referenceId,
  likeCount: doubt.likeCount,
  replyCount: doubt.replyCount,
  liked: doubt.liked,
  bookmarked: doubt.bookmarked,
  isPinned: doubt.isPinned,
  isResolved: doubt.isResolved,
});

export type UiReply = {
  id: string;
  authorId: string;
  avatarUrl: string;
  name: string;
  time: string;
  body: string;
  likeCount: number;
  liked: boolean;
  parentReplyId: string | null;
  replyToId: string | null;
  replyToName: string | null; 
  isPinned: boolean;
  createdAt: number;
  childReplyCount: number;
};

export const toUiReply = (reply: ApiReply): UiReply => ({
  id: reply.id,
  authorId: reply.author.id,
  avatarUrl: reply.author.avatar?.url ?? "",
  name: reply.author.name,
  time: timeAgo(reply.createdAt),
  body: reply.body,
  likeCount: reply.likeCount,
  liked: reply.liked,
  parentReplyId: reply.parentReplyId,
  replyToId: reply.replyTo?.id ?? null,
  replyToName: reply.replyTo?.author.name ?? null,
  isPinned: reply.isPinned,
  createdAt: new Date(reply.createdAt).getTime(),
  childReplyCount: reply.childReplyCount,
});