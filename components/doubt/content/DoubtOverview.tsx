"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, SendHorizonal, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import CommentCard from "@/components/ui/CommentCard";
import DoubtImagePreview from "./DoubtImagePreview";
import type { Doubt } from "./Doubts";
import {
  listReplies,
  createReply,
  toggleReplyLike,
  setReplyPinned,
  deleteReply,
} from "@/services/doubt/reply.service";
import { toUiReply, type UiReply } from "@/src/utils/doubt/mapper";

const ROOT_LIMIT = 20;
const THREAD_LIMIT = 50;

const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");


const merge = (current: UiReply[], incoming: UiReply[]) => {
  const map = new Map(current.map((r) => [r.id, r]));
  incoming.forEach((r) => map.set(r.id, r));
  return [...map.values()];
};

type Props = {
  doubt: Doubt | null;
  focus?: { replyId: string; parentId: string | null } | null;
  canCreateReply: boolean;
  canPin: boolean;
  canDelete: (authorId: string) => boolean;
  onBack: () => void;
  onDeleteDoubt: (id: string) => void;
  onTogglePinDoubt: (id: string) => void;
  onToggleLikeDoubt: (id: string) => void;
  onToggleBookmarkDoubt: (id: string) => void;
  onToggleResolvedDoubt: (id: string) => void;
  onReplyCountChange: (id: string, count: number) => void;
};

export default function DoubtOverview({
  doubt,
  focus,
  canCreateReply,
  canPin,
  canDelete,
  onBack,
  onDeleteDoubt,
  onTogglePinDoubt,
  onToggleLikeDoubt,
  onToggleBookmarkDoubt,
  onToggleResolvedDoubt,
  onReplyCountChange,
}: Props) {
  const doubtId = doubt?.id;

  const [replies, setReplies] = useState<UiReply[]>([]);
  const [rootPage, setRootPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string | null; name: string } | null>(null);
  const [newestFirst, setNewestFirst] = useState(false); 
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [threadsReady, setThreadsReady] = useState<Set<string>>(() => new Set());
  const requested = useRef<Set<string>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const [pendingFocus, setPendingFocus] = useState(focus ?? null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const busy = useRef<Set<string>>(new Set()); 

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    el.style.overflowY = el.scrollHeight > 140 ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeTextarea();
  }, [draft]);

  /* ───── Replies load ───── */

  const loadRoots = useCallback(
    async (page: number) => {
      if (!doubtId) return;
      setLoading(true);
      setError("");
      try {
        const res = await listReplies(doubtId, { page, limit: ROOT_LIMIT });
        setReplies((current) => merge(current, res.items.map(toUiReply)));
        setRootPage(page);
        setHasMore(res.pagination.page * res.pagination.limit < res.pagination.total);
      } catch (e) {
        setError(message(e));
      } finally {
        setLoading(false);
      }
    },
    [doubtId],
  );

  const loadThread = useCallback(
    async (rootId: string) => {
      if (!doubtId || requested.current.has(rootId)) return;
      requested.current.add(rootId);
      try {
        const res = await listReplies(doubtId, { parentReplyId: rootId, limit: THREAD_LIMIT });
        setReplies((current) => merge(current, res.items.map(toUiReply)));
      } catch (e) {
        setError(message(e));
      } finally {
        setThreadsReady((current) => new Set(current).add(rootId));
      }
    },
    [doubtId],
  );

  useEffect(() => {
    loadRoots(1);
  }, [loadRoots]);



  useEffect(() => {
    if (!pendingFocus || loading) return;
    const { replyId, parentId } = pendingFocus;

   
    if (parentId && !threadsReady.has(parentId)) {
      setExpanded((current) => new Set(current).add(parentId));
      loadThread(parentId);
      return;
    }

    const el = document.getElementById(`reply-${replyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlight(replyId);
      setPendingFocus(null);
      return;
    }

       if (hasMore) {
      loadRoots(rootPage + 1);
    } else {
      setError("This reply is no longer available."); 
      setPendingFocus(null);
    }
    
  }, [pendingFocus, loading, replies, threadsReady, hasMore, rootPage, loadRoots, loadThread]);

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(null), 2500);
    return () => clearTimeout(t);
  }, [highlight]);


  if (!doubt) {
    return (
      <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden  ">
        <header className="flex items-center gap-2 border-b border-border p-3">
          <AppButton
            type="button"
            variant="icon"
            onClick={onBack}
            className="rounded-lg p-2 text-text-secondary hover:bg-text-background md:hidden"
            aria-label="Back to doubts"
          >
            <ChevronLeft size={18} />
          </AppButton>
          <AppText className="font-semibold text-text-primary">Doubt</AppText>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <AppText className="font-semibold text-text-primary">Select a doubt</AppText>
          <AppText className="mt-2 text-sm text-text-secondary">
            Choose a question from the list to view its replies and images.
          </AppText>
          <AppButton
            type="button"
            variant="outline"
            onClick={onBack}
            className="mt-4 md:hidden"
          >
            Back to doubts
          </AppButton>
        </div>
      </aside>
    );
  }

  const d = doubt;
  const images = d.images ?? [];

 

  const patch = (id: string, changes: Partial<UiReply>) =>
    setReplies((current) => current.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  const postReply = async () => {
    const text = draft.trim();
    if (!text || !canCreateReply || posting) return;

    setPosting(true);
    setError("");
    try {
      const created = toUiReply(
        await createReply({
          doubtId: d.id,
          body: text,
          replyToId: replyingTo?.id ?? undefined,
        }),
      );
      const parentId = created.parentReplyId;

      setReplies((current) => {
        const next = merge(current, [created]);
        return parentId
          ? next.map((r) =>
              r.id === parentId ? { ...r, childReplyCount: r.childReplyCount + 1 } : r,
            )
          : next;
      });
      onReplyCountChange(d.id, d.replyCount + 1);

      if (parentId) {
        setExpanded((current) => new Set(current).add(parentId));
        loadThread(parentId); 
      }

      setDraft("");
      setReplyingTo(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setPosting(false);
    }
  };

  const removeReply = async (id: string) => {
    const target = replies.find((r) => r.id === id);
    if (!target || !confirm("Delete this reply?")) return;

    try {
      await deleteReply(id);

  
      const removed = target.parentReplyId ? 1 : 1 + target.childReplyCount;

      setReplies((current) =>
        current
          .filter((r) => r.id !== id && r.parentReplyId !== id)
          .map((r) =>
            r.id === target.parentReplyId
              ? { ...r, childReplyCount: Math.max(0, r.childReplyCount - 1) }
              : r,
          ),
      );
      onReplyCountChange(d.id, Math.max(0, d.replyCount - removed));
      if (replyingTo?.id === id) setReplyingTo(null);
    } catch (e) {
      setError(message(e));
    }
  };

  const toggleLike = async (id: string) => {
  const target = replies.find((r) => r.id === id);
  const key = `like:${id}`;
  if (!canCreateReply || !target || busy.current.has(key)) return;

  busy.current.add(key);
  const prev = { liked: target.liked, likeCount: target.likeCount };


  patch(id, { liked: !prev.liked, likeCount: prev.likeCount + (prev.liked ? -1 : 1) });

  try {
    
    const res = await toggleReplyLike(id);
    patch(id, { liked: res.liked, likeCount: res.likeCount });
  } catch (e) {
   
    patch(id, prev);
    setError(message(e));
  } finally {
    busy.current.delete(key);
  }
};

  const togglePin = async (id: string) => {
  const target = replies.find((r) => r.id === id);
  const key = `pin:${id}`;
  if (!canPin || !target || busy.current.has(key)) return;

  busy.current.add(key);
  const prev = target.isPinned;

  patch(id, { isPinned: !prev });

  try {
    const res = await setReplyPinned(id, !prev);
    patch(id, { isPinned: res.isPinned });
  } catch (e) {
    patch(id, { isPinned: prev });
    setError(message(e));
  } finally {
    busy.current.delete(key);
  }
};

  const toggleThread = (rootId: string) => {
    if (expanded.has(rootId)) {
      setExpanded((current) => {
        const updated = new Set(current);
        updated.delete(rootId);
        return updated;
      });
    } else {
      setExpanded((current) => new Set(current).add(rootId));
      loadThread(rootId);
    }
  };

  const sortReplies = (items: UiReply[]) =>
    [...items].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
      return newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
    });

  const rootReplies = sortReplies(replies.filter((reply) => reply.parentReplyId === null));
  const ring = (id: string) => (highlight === id ? "ring-2 ring-primary" : undefined);

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
        <AppButton
          type="button"
          variant="icon"
          onClick={onBack}
          className="rounded-lg p-2 text-accent hover:bg-text-background md:hidden"
          aria-label="Back to doubts"
        >
          <ChevronLeft size={18} />
        </AppButton>

        <div className="min-w-0 flex-1">
          <AppText className="font-semibold text-text-primary">Doubt</AppText>
          <AppText variant="small" className="text-text-secondary">
            Question and discussion
          </AppText>
        </div>
      </header>

      <div className="hide-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
        <CommentCard
          size="big"
          avatarUrl={d.avatarUrl}
          name={d.name}
          time={d.time}
          category={d.category}
          title={d.title}
          body={d.body}
          referenceId={d.referenceId}
          likeCount={d.likeCount}
          replyCount={d.replyCount}
          liked={d.liked}
          bookmarked={d.bookmarked}
          isPinned={d.isPinned}
          isResolved={d.isResolved}
          canPin={canPin}
          canDelete={canDelete(d.authorId)}
          canResolve={canDelete(d.authorId)}
          onLike={canCreateReply ? () => onToggleLikeDoubt(d.id) : undefined}
          onBookmark={canCreateReply ? () => onToggleBookmarkDoubt(d.id) : undefined}
          onPin={() => onTogglePinDoubt(d.id)}
          onDelete={() => onDeleteDoubt(d.id)}
          onResolve={() => onToggleResolvedDoubt(d.id)}
          onReply={() => setReplyingTo({ id: null, name: d.name })}
        />

        {/* photos of Doubt */}
        {images.length > 0 && (
          <section className="min-w-0   p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <AppText className="text-sm font-semibold text-text-primary">Photos</AppText>
              <AppText variant="small" className="text-text-secondary">
                {images.length} {images.length === 1 ? "photo" : "photos"}
              </AppText>
            </div>

            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setPreviewIndex(index)}
                  aria-label={`Preview photo ${index + 1}`}
                  className="h-40 w-[78%] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-background sm:h-48 sm:w-[65%]"
                >
                  <img
                    src={image}
                    alt={`Doubt photo ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Replies Count and Sort */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AppText className="font-semibold text-text-primary">
              Replies ({d.replyCount})
            </AppText>

            <AppButton
              type="button"
              variant="link"
              onClick={() => setNewestFirst((current) => !current)}
              className="px-2 py-1 text-xs text-text-secondary"
            >
              {newestFirst ? "Newest first" : "Oldest first"}
            </AppButton>
          </div>

          {error && <AppText className="text-xs text-error">{error}</AppText>}

          {/* replies */}
          {!loading && rootReplies.length === 0 ? (
            <AppText className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-text-secondary">
              No replies yet. Start the discussion.
            </AppText>
          ) : (
            <div className="space-y-3">
              {rootReplies.map((reply) => {
                const childReplies = sortReplies(
                  replies.filter((item) => item.parentReplyId === reply.id),
                );
                const isOpen = expanded.has(reply.id);

                return (
                  <div key={reply.id} id={`reply-${reply.id}`} className="min-w-0 space-y-2">
                    <CommentCard
                      isThread
                      className={ring(reply.id)}
                      avatarUrl={reply.avatarUrl}
                      name={reply.name}
                      time={reply.time}
                      body={reply.body}
                      likeCount={reply.likeCount}
                      liked={reply.liked}
                      isPinned={reply.isPinned}
                      canPin={canPin}
                      canDelete={canDelete(reply.authorId)}
                      onLike={canCreateReply ? () => toggleLike(reply.id) : undefined}
                      onReply={() => setReplyingTo({ id: reply.id, name: reply.name })}
                      onPin={() => togglePin(reply.id)}
                      onDelete={() => removeReply(reply.id)}
                    />

                    {reply.childReplyCount > 0 && (
                      <AppButton
                        type="button"
                        variant="link"
                        onClick={() => toggleThread(reply.id)}
                        className="ml-3 rounded-lg px-2 py-1 text-xs font-semibold text-primary"
                      >
                        {isOpen ? "Hide replies" : "Show replies"} ({reply.childReplyCount})
                      </AppButton>
                    )}

                    {isOpen && childReplies.length > 0 && (
                      <div className="ml-3 space-y-3 border-l-2 border-accent/25 pl-3 sm:ml-5 sm:pl-4">
                        {childReplies.map((child) => (
                          <div
                            key={child.id}
                            id={`reply-${child.id}`}
                            className="min-w-0 space-y-1.5"
                          >
                            {child.replyToName && (
                              <AppText className="wrap-break-word px-1 text-xs text-text-secondary">
                                Replying to{" "}
                                <span className="font-semibold text-primary">
                                  {child.replyToName}
                                </span>
                              </AppText>
                            )}

                            <CommentCard
                              isThread
                              className={ring(child.id)}
                              avatarUrl={child.avatarUrl}
                              name={child.name}
                              time={child.time}
                              body={child.body}
                              likeCount={child.likeCount}
                              liked={child.liked}
                              isPinned={child.isPinned}
                              canPin={canPin}
                              canDelete={canDelete(child.authorId)}
                              onLike={canCreateReply ? () => toggleLike(child.id) : undefined}
                              onReply={() => setReplyingTo({ id: child.id, name: child.name })}
                              onPin={() => togglePin(child.id)}
                              onDelete={() => removeReply(child.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <AppText className="text-center text-xs text-text-secondary">Loading…</AppText>
              )}

              {hasMore && !loading && (
                <AppButton
                  type="button"
                  variant="outline"
                  onClick={() => loadRoots(rootPage + 1)}
                  className="mx-auto"
                >
                  Load more replies
                </AppButton>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Reply Input Area */}
      {canCreateReply && (
        <div className="shrink-0  p-3 sm:p-4">
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-border bg-background/10 px-3 py-2">
              <AppText className="min-w-0 wrap-break-word text-xs text-text-secondary">
                Replying to{" "}
                <span className="font-semibold text-primary">{replyingTo.name}</span>
              </AppText>

              <AppButton
                type="button"
                variant="icon"
                aria-label="Cancel reply"
                onClick={() => setReplyingTo(null)}
                className="shrink-0 rounded-md p-1 text-text-secondary hover:text-primary"
              >
                <X size={15} />
              </AppButton>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  postReply();
                }
              }}
              rows={1}
              placeholder={replyingTo ? "Write your reply..." : "Write a reply..."}
              className="hide-scrollbar max-h-35 min-h-10 min-w-0 flex-1 resize-none overflow-hidden rounded-md golden-border2 px-3 py-2 text-sm leading-5 text-text-primary outline-none placeholder:text-text-secondary"
            />

            <AppButton
              type="button"
              variant="icon"
              onClick={postReply}
              disabled={!draft.trim() || posting}
              className="shrink-0 p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendHorizonal className="h-6 w-6" />
            </AppButton>
          </div>

          <AppText variant="small" className="mt-1.5 text-text-secondary">
            Enter to send · Shift + Enter for a new line
          </AppText>
        </div>
      )}

      <DoubtImagePreview
        images={images}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </aside>
  );
}