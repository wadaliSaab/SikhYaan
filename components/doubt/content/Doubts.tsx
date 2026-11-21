"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ImagePlus, Link2, Loader2, Search, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import CommentCard from "@/components/ui/CommentCard";

export type Doubt = {
  id: string;
  authorId: string;
  avatarUrl: string;
  name: string;
  time: string;
  category: string;
  title: string;
  body: string;
  images: string[];
  referenceId?: string;
  likeCount: number;
  replyCount: number;
  liked?: boolean;
  bookmarked?: boolean;
  isPinned?: boolean;
  isResolved?: boolean;
};
export type NewDoubt = {
  title: string;
  body: string;
  category: string;
  referenceId?: string;
  images: File[];
};



type Props = {
  doubts: Doubt[];
  categories: string[];
  loading: boolean;
  activeFilter: string;
  selectedDoubtId?: string;
  currentUserId: string;
  currentUserName: string;
  canCreate: boolean;
  canPin: boolean;
  canDelete: (authorId: string) => boolean;
  onCreateDoubt: (doubt: NewDoubt) => Promise<void>;
  onSelectDoubt: (doubt: Doubt) => void;
  onDeleteDoubt: (id: string) => void;
  onTogglePinDoubt: (id: string) => void;
  onToggleLikeDoubt: (id: string) => void;
  onToggleBookmarkDoubt: (id: string) => void;
  onToggleResolvedDoubt: (id: string) => void;
};

export default function Doubts({
  doubts,
  categories,
  loading,
  activeFilter,
  selectedDoubtId,
  currentUserId,
  currentUserName,
  canCreate,
  canPin,
  canDelete,
  onCreateDoubt,
  onSelectDoubt,
  onDeleteDoubt,
  onTogglePinDoubt,
  onToggleLikeDoubt,
  onToggleBookmarkDoubt,
  onToggleResolvedDoubt,
}: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"Recent" | "Most Helpful" | "Unanswered">("Recent");
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [posting, setPosting] = useState(false);
  const selectedCategory = category || categories[0] || "";
  const [referenceId, setReferenceId] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    setSelectedFiles((current) => [...current, ...files]);
    setSelectedImages((current) => [
      ...current,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
    event.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(selectedImages[index]);
    setSelectedImages((current) => current.filter((_, i) => i !== index));
    setSelectedFiles((current) => current.filter((_, i) => i !== index));
  };

  const submitDoubt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || posting || !title.trim() || !body.trim()) return;

    setPosting(true);
    try {
      await onCreateDoubt({
        title: title.trim(),
        body: body.trim(),
        category: selectedCategory,
        referenceId: referenceId.trim() || undefined,
        images: selectedFiles,
      });

      selectedImages.forEach((url) => URL.revokeObjectURL(url));
      setTitle("");
      setBody("");
      setReferenceId("");
      setSelectedImages([]);
      setSelectedFiles([]);
      setCategory("");
      setComposerOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const visibleDoubts = useMemo(() => {
    let result = doubts.filter((doubt) => {
      const searchableText =
        `${doubt.title} ${doubt.body} ${doubt.category} ${doubt.name} ${doubt.referenceId ?? ""}`;

      if (!searchableText.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (activeFilter === "my-questions") {
        return doubt.authorId === currentUserId;
      }

      if (activeFilter === "saved") return Boolean(doubt.bookmarked);

      if (activeFilter.startsWith("category:")) {
        return (
          doubt.category.toLowerCase() ===
          activeFilter.slice("category:".length).toLowerCase()
        );
      }

      return true;
    });

    if (sortBy === "Most Helpful") {
      result = [...result].sort((a, b) => b.likeCount - a.likeCount);
    }

    if (sortBy === "Unanswered") {
      result = result.filter((doubt) => doubt.replyCount === 0);
    }

    return [...result].sort(
      (a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)),
    );
  }, [doubts, activeFilter, currentUserId, search, sortBy]);

 
  useEffect(() => {
    if (!selectedDoubtId) return;
    document
      .getElementById(`doubt-${selectedDoubtId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDoubtId, doubts.length]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden ">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border p-2 sm:p-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <AppText as="h2" variant="subHeading" className="text-text-primary">
              Doubts
            </AppText>
            <AppText variant="small" className="text-accent/80">
              Ask, Learn and Discuss with the Community
            </AppText>
          </div>

          {canCreate && (
            <AppButton
              type="button"
              variant="link"
              onClick={() => setComposerOpen((current) => !current)}
              className="shrink-0 text-xs py-1 px-2  border-b-2 border-border rounded-sm font-semibold"
            >
              {composerOpen ? "Close" : "+ Ask Doubt"}
            </AppButton>
          )}
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-border bg-text-background px-3">
          <Search size={16} className="shrink-0 text-text-secondary" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search doubts..."
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
          {search && (
            <AppButton
              type="button"
              variant="icon"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-text-secondary"
            >
              <X size={15} />
            </AppButton>
          )}
        </label>

        {/* Nav Buttons */}
        <div className="flex gap-2 overflow-x-auto">
          {(["Recent", "Most Helpful", "Unanswered"] as const).map((tab) => (
            <AppButton
              key={tab}
              type="button"
              variant="link"
              onClick={() => setSortBy(tab)}
              className={twMerge(
                "shrink-0 rounded-sm border-b px-4 py-1 text-xs font-semibold",
                sortBy === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-accent hover:text-primary",
              )}
            >
              {tab}
            </AppButton>
          ))}
        </div>
      </header>

      {/* doubt Asking */}
      {composerOpen && canCreate && (
        <form
          onSubmit={submitDoubt}
          className="golden-border2 mx-3 mt-1 flex shrink-0 flex-col gap-3 rounded-xl bg-text-background p-3 sm:mx-4 sm:p-4"
        >
          <div className="flex items-start gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-primary">
                {user.name.trim().charAt(0).toUpperCase() || "U"}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-2">
              <input
                required
                minLength={5}
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Question title..."
                className="w-full rounded-lg border border-border bg-background/10 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary"
              />
              <textarea
                required
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Ask a Doubt..."
                rows={4}
                className="w-full resize-y rounded-lg border border-border bg-background/10 hide-scrollbar px-3 py-2 text-sm text-text-primary outline-none focus:border-primary placeholder:text-text-secondary"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(event) => setCategory(event.target.value)}
              className="max-w-full   px-1 py-2 text-xs font-semibold text-text-primary outline-none focus:border-primary"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background/10 px-3 py-2">
              <Link2 size={14} className="shrink-0 text-primary" />
              <input
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="Reference ID (optional)"
                className="min-w-0 flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-secondary"
              />
              {referenceId && (
                <AppButton
                  type="button"
                  variant="icon"
                  onClick={() => setReferenceId("")}
                  aria-label="Remove reference"
                  className="text-text-secondary"
                >
                  <X size={13} />
                </AppButton>
              )}
            </label>
          </div>

          {selectedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {selectedImages.map((image, index) => (
                <div
                  key={image}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={image}
                    alt="Selected attachment"
                    className="h-full w-full object-cover"
                  />
                  <AppButton
                    type="button"
                    variant="icon"
                    aria-label="Remove image"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-premium"
                  >
                    <X size={12} />
                  </AppButton>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <AppButton
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs"
            >
              <ImagePlus size={14} />
              Add Image
            </AppButton>

            <AppButton type="submit" variant="primary" disabled={posting} className="px-5 py-2 text-xs">
              {posting ? "Posting..." : "Post Question"}
            </AppButton>
          </div>
        </form>
      )}

      {/* Doubts */}
      <div className="hide-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="animate-spin text-accent" />
          </div>
        ) : visibleDoubts.length === 0 ? (
          <AppText variant="body" className="py-6 text-center text-text-secondary">
            No doubts match your search.
          </AppText>
        ) : (
          visibleDoubts.map((doubt) => (
            <div key={doubt.id} id={`doubt-${doubt.id}`}>
              <CommentCard
                size="simple"
                avatarUrl={doubt.avatarUrl}
                name={doubt.name}
                time={doubt.time}
                category={doubt.category}
                title={doubt.title}
                body={doubt.body}
                referenceId={doubt.referenceId}
                images={doubt.images}
                likeCount={doubt.likeCount}
                replyCount={doubt.replyCount}
                liked={doubt.liked}
                bookmarked={doubt.bookmarked}
                isPinned={doubt.isPinned}
                isResolved={doubt.isResolved}
                canResolve={canDelete(doubt.authorId)}
                onResolve={() => onToggleResolvedDoubt(doubt.id)}
                canPin={canPin}
                canDelete={canDelete(doubt.authorId)}
                onClick={() => onSelectDoubt(doubt)}
                onLike={canCreate ? () => onToggleLikeDoubt(doubt.id) : undefined}
                onBookmark={
                  canCreate ? () => onToggleBookmarkDoubt(doubt.id) : undefined
                }
                onPin={() => onTogglePinDoubt(doubt.id)}
                onDelete={() => onDeleteDoubt(doubt.id)}
                isSelected={doubt.id === selectedDoubtId}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}