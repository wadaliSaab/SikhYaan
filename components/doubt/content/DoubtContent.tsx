"use client";

import { useRef, useState, useEffect, type PointerEvent } from "react";
import { Eye, EyeOff, PanelLeft, PanelRight } from "lucide-react";
import { twMerge } from "tailwind-merge";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import DoubtMenu from "./DoubtMenu";
import Doubts, { type Doubt, type NewDoubt } from "./Doubts";
import { toUiDoubt } from "@/src/utils/doubt/mapper";
import { useAuth } from "@/providers/AuthProvider";
import DoubtOverview from "./DoubtOverview";
import {
  getCategories,
  createCategory,
  listDoubts,
  getDoubt,
  createDoubt as createDoubtApi,
  deleteDoubt as deleteDoubtApi,
  toggleDoubtLike,
  toggleDoubtBookmark,
  setDoubtPinned,
  setDoubtResolved,
  type Category,
} from "@/services/doubt/doubt.service";

export type UserRole = "guest" | "learner" | "contributor" | "admin";
type MobileView = "list" | "overview";


type Focus = { doubtId: string; replyId: string; parentId: string | null };

const fail = (error: unknown) =>
  alert(error instanceof Error ? error.message : "Something went wrong");

export default function DoubtContent() {
  const { user, isLoggedIn } = useAuth();
  const { id: currentUserId, name: currentUserName, role } = user;
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [activeFilter, setActiveFilter] = useState("all-doubts");
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const categories = categoryList.map((item) => item.name);
  const [loading, setLoading] = useState(true);
  const [showDoubts, setShowDoubts] = useState(true);
  const [showOverview, setShowOverview] = useState(true);
  const [listWidth, setListWidth] = useState(55);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const panelsRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("");
  const busy = useRef<Set<string>>(new Set()); 
 
  const canPin = role === "admin";
  const canManageCategories = role === "contributor" || role === "admin";
  const selectedDoubt =
    doubts.find((doubt) => doubt.id === selectedDoubtId) ?? null;

  const select = (id: string | null) => {
    setSelectedDoubtId(id);
    setNotice("");
    window.history.replaceState(null, "", id ? `/doubt?d=${id}` : "/doubt");
  };

  const canDelete = (authorId: string) =>
    isLoggedIn && (authorId === currentUserId || role === "admin");

  const addCategory = async (value: string) => {
    const created = await createCategory(value.trim());
    setCategoryList((current) => [...current, created]);
  };

  const createDoubt = async ({ category, ...data }: NewDoubt) => {
    const categoryId = categoryList.find((item) => item.name === category)?.id;
    if (!categoryId) throw new Error("Please select a category");

    const doubt = toUiDoubt(await createDoubtApi({ ...data, categoryId }));

    setDoubts((current) => [doubt, ...current]);
    select(doubt.id);
    setActiveFilter("all-doubts");
    setMobileView("overview");
  };

  const updateDoubt = (id: string, updates: Partial<Doubt>) => {
    setDoubts((current) =>
      current.map((doubt) =>
        doubt.id === id ? { ...doubt, ...updates } : doubt,
      ),
    );
  };
  const mutate = async <T,>(
  key: string,
  id: string,
  next: Partial<Doubt>,                 
  prev: Partial<Doubt>,                
  request: () => Promise<T>,          
  sync: (res: T) => Partial<Doubt>,     
) => {
  if (busy.current.has(key)) return;
  busy.current.add(key);

  updateDoubt(id, next);
  try {
    updateDoubt(id, sync(await request()));
  } catch (e) {
    updateDoubt(id, prev);
    fail(e);
  } finally {
    busy.current.delete(key);
  }
};
  const deleteDoubt = async (id: string) => {
    if (!confirm("Delete this doubt?")) return;

    try {
      await deleteDoubtApi(id);
      setDoubts((current) => current.filter((doubt) => doubt.id !== id));
      setSelectedDoubtId((current) => (current === id ? null : current));
      setMobileView("list");

     
      if (new URLSearchParams(window.location.search).get("d") === id) {
        window.history.replaceState(null, "", "/doubt");
      }
    } catch (e) {
      fail(e);
    }
  };

const togglePin = (id: string) => {
  const doubt = doubts.find((item) => item.id === id);
  if (!canPin || !doubt) return;

  mutate(
    `pin:${id}`,
    id,
    { isPinned: !doubt.isPinned },
    { isPinned: doubt.isPinned },
    () => setDoubtPinned(id, !doubt.isPinned),
    (res) => ({ isPinned: res.isPinned }),
  );
};

const toggleLike = (id: string) => {
  const doubt = doubts.find((item) => item.id === id);
  if (!isLoggedIn || !doubt) return;

  mutate(
    `like:${id}`,
    id,
    { liked: !doubt.liked, likeCount: doubt.likeCount + (doubt.liked ? -1 : 1) },
    { liked: doubt.liked, likeCount: doubt.likeCount },
    () => toggleDoubtLike(id),
    (res) => ({ liked: res.liked, likeCount: res.likeCount }),
  );
};

const toggleBookmark = (id: string) => {
  const doubt = doubts.find((item) => item.id === id);
  if (!isLoggedIn || !doubt) return;

  mutate(
    `bookmark:${id}`,
    id,
    { bookmarked: !doubt.bookmarked },
    { bookmarked: doubt.bookmarked },
    () => toggleDoubtBookmark(id),
    (res) => ({ bookmarked: res.bookmarked }),
  );
};

const toggleResolved = (id: string) => {
  const doubt = doubts.find((item) => item.id === id);
  if (!doubt) return;

  mutate(
    `resolve:${id}`,
    id,
    { isResolved: !doubt.isResolved },
    { isResolved: doubt.isResolved },
    () => setDoubtResolved(id, !doubt.isResolved),
    (res) => ({ isResolved: res.isResolved }),
  );
};
  const handleDividerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!(event.buttons & 1)) return;

    const bounds = panelsRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100;
    setListWidth(Math.min(60, Math.max(32, nextWidth)));
  };

  useEffect(() => {
    getCategories()
      .then(setCategoryList)
      .catch(() => setCategoryList([]));
  }, []);

 
  useEffect(() => {
    (async () => {
      let items: Doubt[] = [];

      try {
        const data = await listDoubts({ limit: 50 });
        items = data.items.map(toUiDoubt);
        setDoubts(items);
      } catch (error) {
        console.error("Load doubts failed:", error);
        return;
      } finally {
        setLoading(false);
      }

      const params = new URLSearchParams(window.location.search);
      const target = params.get("d");
      if (!target) return;

      try {
    
        if (!items.some((doubt) => doubt.id === target)) {
          const one = await getDoubt(target, { limit: 1 });
          setDoubts((current) => [toUiDoubt(one.doubt), ...current]);
        }

        setSelectedDoubtId(target);
        setMobileView("overview");

        const replyId = params.get("r");
        if (replyId) setFocus({ doubtId: target, replyId, parentId: params.get("p") });
      } catch {
        setNotice("This doubt is no longer available.");
      }
    })();
  }, []);

  return (
    <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-2 overflow-hidden  md:flex-row">
      <DoubtMenu
        active={activeFilter}
        onSelect={setActiveFilter}
        categories={categories}
        canManageCategories={canManageCategories}
        onAddCategory={addCategory}
      />

      <section className="flex relative min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden ">
        {/* Panel Toolbar */}
        <div className=" shrink-0 absolute md:flex hidden right-0 flex-wrap items-center justify-end gap-2 px-1">
          <AppButton
            type="button"
            variant="toolbar"
            onClick={() => {
              setShowDoubts((current) => !current);
              if (showDoubts) setMobileView("overview");
            }}
          >
            {showDoubts ? <EyeOff size={14} /> : <PanelLeft size={14} />}
            {showDoubts ? "Hide Doubts" : "Show Doubts"}
          </AppButton>

          <AppButton
            type="button"
            variant="toolbar"
            onClick={() => {
              setShowOverview((current) => !current);
              if (showOverview) setMobileView("list");
            }}
          >
            {showOverview ? <EyeOff size={14} /> : <PanelRight size={14} />}
            {showOverview ? "Hide Overview" : "Show Overview"}
          </AppButton>

          {!showDoubts && !showOverview && (
            <AppButton
              type="button"
              variant="toolbar"
              onClick={() => {
                setShowDoubts(true);
                setShowOverview(true);
              }}
            >
              <Eye size={14} />
              Show Both
            </AppButton>
          )}
        </div>

        {notice && (
          <AppText
            variant="caption"
            className="shrink-0 rounded-md border border-border bg-text-background px-3 py-2 text-text-secondary"
          >
            {notice}
          </AppText>
        )}

        {/* Panel */}
        <div
          ref={panelsRef}
          className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden"
        >
          {/* Doubts */}
          {showDoubts && (
            <div
              className={twMerge(
                "min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                mobileView === "list" ? "flex" : "hidden md:flex",
                showOverview && "md:flex-none md:basis-(--list-w)",
              )}
              style={{ "--list-w": `${listWidth}%` } as React.CSSProperties}
            >
              <Doubts
                doubts={doubts}
                categories={categories}
                loading={loading}
                activeFilter={activeFilter}
                selectedDoubtId={selectedDoubtId ?? undefined}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                canCreate={isLoggedIn}
                canPin={canPin}
                canDelete={canDelete}
                onCreateDoubt={createDoubt}
                onSelectDoubt={(doubt) => {
                  select(doubt.id);
                  setMobileView("overview");
                }}
                onDeleteDoubt={deleteDoubt}
                onTogglePinDoubt={togglePin}
                onToggleLikeDoubt={toggleLike}
                onToggleBookmarkDoubt={toggleBookmark}
                onToggleResolvedDoubt={toggleResolved}
              />
            </div>
          )}

          {/*  Divider */}
          {showDoubts && showOverview && (
            <div
              role="separator"
              aria-label="Resize doubts and overview panels"
              aria-orientation="vertical"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                handleDividerMove(event);
              }}
              onPointerMove={handleDividerMove}
              className="hidden w-1.5 shrink-0 cursor-col-resize touch-none  bg-border/70 transition hover:bg-accent/70 active:bg-accent md:block"
              title="Drag to resize panels"
            />
          )}

          {/* Doubt overview */}
          {showOverview && (
            <div
              className={twMerge(
                "min-h-0 min-w-0 flex-col overflow-hidden",
                mobileView === "overview" ? "flex" : "hidden md:flex",
              )}
              style={{ flex: showDoubts ? "1 1 0%" : "1 1 100%" }}
            >
              <DoubtOverview
                key={selectedDoubt?.id ?? "no-doubt"}
                doubt={selectedDoubt}
                focus={focus?.doubtId === selectedDoubt?.id ? focus : null}
                canCreateReply={isLoggedIn}
                canPin={canPin}
                canDelete={canDelete}
                onBack={() => setMobileView("list")}
                onDeleteDoubt={deleteDoubt}
                onTogglePinDoubt={togglePin}
                onToggleLikeDoubt={toggleLike}
                onToggleBookmarkDoubt={toggleBookmark}
                onToggleResolvedDoubt={toggleResolved}
                onReplyCountChange={(id, count) =>
                  updateDoubt(id, { replyCount: count })
                }
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}