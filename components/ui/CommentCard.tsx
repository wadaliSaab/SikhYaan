"use client";
import { useEffect, useRef, useState } from "react";


import { Bookmark, CheckCircle2, Heart, Link2, MessageCircle, Pin, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  avatarUrl?: string;
  name: string;
  time: string;
  category?: string;
  title?: string;
  body: string;
  image?: string;
  images?: string[];
  referenceId?: string;
  likeCount?: number;
  replyCount?: number;
  liked?: boolean;
  bookmarked?: boolean;
  isSelected?: boolean;
  isPinned?: boolean;
  canPin?: boolean;
  isResolved?: boolean;
  canResolve?: boolean;
  onResolve?: () => void;
  canDelete?: boolean;
  size?: "big" | "simple";
  isThread?: boolean;
  className?: string;
  onClick?: () => void;
  onLike?: () => void;
  onReply?: () => void;
  onBookmark?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
};

export default function CommentCard({
  avatarUrl,
  name,
  time,
  category,
  title,
  body,
  image,
  images = [],
  referenceId,
  likeCount = 0,
  replyCount = 0,
  isSelected = false,
  liked = false,
  bookmarked = false,
  isPinned = false,
  isResolved = false,
  canResolve = false,
  canPin = false,
  canDelete = false,
  size = "simple",
  isThread = false,
  className,
  onClick,
  onLike,
  onReply,
  onBookmark,
  onResolve,
  onPin,
  onDelete,
}: Props) {
  const allImages = images.length ? images : image ? [image] : [];
  const isBig = size === "big";
  const bodyRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const iconButton = "rounded-lg p-2 cursor-pointer hover:bg-background";

  useEffect(() => {
    if (expanded) return;
    const el = bodyRef.current;
    if (!el) return;

    const check = () => setIsClamped(el.scrollHeight > el.clientHeight + 1);

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [body, expanded]);

  return (
    <article
      onClick={onClick}
      className={twMerge(
        "min-w-0 rounded-xl border-x  shadow-xs shadow-primary/40 border-primary/40 bg-text-background/50 p-3 sm:p-4",
        isSelected && "border-border bg-text-background/90 shadow-border",
        onClick && "cursor-pointer ",
        isBig && "p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-primary">
            {name.trim().charAt(0).toUpperCase() || "U"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <AppText className="wrap-break-word text-sm font-semibold text-text-primary">
              {name}
            </AppText>
            <AppText variant="small" className="text-text-secondary">
              {time}
            </AppText>

            {category && (
              <span className=" font-semibold border-b border-accent/60  px-2  text-2xs text-accent/70">
                {category}
              </span>
            )}

            {isPinned && (
              <span className="inline-flex cursor-pointer  items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-2xs text-accent">
                <Pin size={11} fill="currentColor" />
                Pinned
              </span>
            )}
                        {isResolved && (
              <span className="inline-flex items-center cursor-pointer gap-1 rounded-full bg-success/15 px-2 py-0.5 text-2xs text-success">
                <CheckCircle2 size={11} />
                Resolved
              </span>
            )}
          </div>

          {title && (
            <AppText
              className={` 
                mt-2 wrap-break-word font-semibold line-clamp-2 text-accent
                ${isBig ? "text-base sm:text-lg" : "text-sm"}
              `}
            >
              {title}
            </AppText>
          )}

          <div
            ref={bodyRef}
            className={`mt-1  ${!expanded && "line-clamp-5"}`}
          >
            <AppText
              className={` 
                whitespace-pre-wrap wrap-break-word text-text-primary/70 text-sm
                ${isBig ? "leading-6" : "leading-5"}
              `}
            >
              {body}
            </AppText>
          </div>

          {isClamped && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((current) => !current);
              }}
              className="mt-1 text-2xs font-semibold text-text-secondary cursor-pointer  hover:underline"
            >
              {expanded ? "See less" : "See more..."}
            </button>
          )}

          {referenceId && (
            <a
              href={`/${encodeURIComponent(referenceId)}`}
              onClick={(event) => event.stopPropagation()}
              className="mt-3 inline-flex max-w-full items-center gap-2   hover:text-accent py-1.5 text-xs font-semibold text-primary "
              title={`Open reference ${referenceId}`}
            >
              <Link2 size={14} className="shrink-0" />
              <span className="break-all underline underline-offset-4">
                {referenceId}
              </span>
            </a>
          )}

          {/* doubt attachedments */}
          {allImages.length > 0 && (
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto  pb-1">
              {allImages.map((src, index) => (
                <button
                  key={`${src}-${index}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClick?.();
                  }}
                  aria-label={`View photo ${index + 1}`}
                  className="h-20 w-20 shrink-0 snap-start cursor-pointer overflow-hidden rounded-lg border border-border bg-background sm:h-24 sm:w-24"
                >
                  <img
                    src={src}
                    alt={`Doubt attachment ${index + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}

          {/* doubt interactions */}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {onLike && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onLike();
                  }}
                  aria-label={liked ? "Unlike" : "Like"}
                  className={twMerge(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                    liked ? "text-primary" : "text-text-secondary",
                  )}
                >
                  <Heart size={15} fill={liked ? "currentColor" : "none"} />
                  {likeCount}
                </AppButton>
              )}

              {onReply && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReply();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:text-primary"
                >
                  <MessageCircle size={15} />
                  {isThread ? "Reply" : `${replyCount} replies`}
                </AppButton>
              )}

              {!isThread && onBookmark && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onBookmark();
                  }}
                  aria-label={bookmarked ? "Remove from Saved" : "Save doubt"}
                  className={twMerge(
                    "inline-flex items-center cursor-pointer gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                    bookmarked ? "text-primary" : "text-text-secondary",
                  )}
                >
                  <Bookmark
                    size={15}
                    fill={bookmarked ? "currentColor" : "none"}
                  />
                  {bookmarked ? "Saved" : "Save"}
                </AppButton>
              )}
                            {!isThread && canResolve && onResolve && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onResolve();
                  }}
                  aria-label={isResolved ? "Mark as unresolved" : "Mark as resolved"}
                  className={twMerge(
                    "inline-flex items-center cursor-pointer gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                    isResolved ? "text-success" : "text-text-secondary",
                  )}
                >
                  <CheckCircle2 size={15} />
                  {isResolved ? "Resolved" : "Mark resolved"}
                </AppButton>
              )}
            </div>

            <div className="flex items-center gap-1">
              {canPin && onPin && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPin();
                  }}
                  aria-label={isPinned ? "Unpin" : "Pin"}
                  className={twMerge(
                    iconButton,
                    isPinned ? "text-primary" : "text-text-secondary",
                  )}
                >
                  <Pin size={15} fill={isPinned ? "currentColor" : "none"} />
                </AppButton>
              )}

              {canDelete && onDelete && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  aria-label="Delete"
                  className={twMerge(
                    iconButton,
                    "text-text-secondary cursor-pointer hover:bg-red-500/10 hover:text-red-500",
                  )}
                >
                  <Trash2 size={15} />
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
