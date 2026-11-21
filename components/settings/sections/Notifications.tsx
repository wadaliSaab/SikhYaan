"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  MessageCircle,
  Pin,
  RefreshCw,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import Card from "../Card";
import IconCircle, { type Tone } from "../IconCircle";
import { useAuth } from "@/providers/AuthProvider";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationFilter,
  type NotificationItem,
  type NotificationType,
} from "@/services/settings/notification.sevice";
import { notificationAction } from "@/src/utils/notification-link";
import { timeAgo } from "@/src/utils/format";
import { notifyChanged, useLiveNotifications } from "@/src/hooks/useLiveNotifications";

const LOOK: Record<NotificationType, { icon: LucideIcon; tone: Tone }> = {
  CONTENT_ADDED: { icon: BookOpen, tone: "gold" },
  CONTENT_UPDATED: { icon: RefreshCw, tone: "gold" },
  TEST_ADDED: { icon: GraduationCap, tone: "green" },
  DOUBT_REPLY: { icon: MessageCircle, tone: "slate" },
  REPLY_TO_REPLY: { icon: MessageCircle, tone: "slate" },
  DOUBT_RESOLVED: { icon: CheckCircle2, tone: "green" },
  DOUBT_PINNED: { icon: Pin, tone: "slate" },
  NEW_DOUBT: { icon: HelpCircle, tone: "slate" },
  ROLE_REQUEST: { icon: UserPlus, tone: "gold" },
  ROLE_APPROVED: { icon: CheckCircle2, tone: "green" },
  ROLE_DECLINED: { icon: XCircle, tone: "red" },
  SYSTEM: { icon: Bell, tone: "red" },
};

const LABEL: Record<NotificationFilter, string> = {
  all: "All",
  content: "Content",
  test: "Tests",
  doubt: "Doubts",
  request: "Requests",
  system: "System",
};

const MEMBER_CHIPS: NotificationFilter[] = ["all", "content", "test", "doubt", "request", "system"];
const GUEST_CHIPS: NotificationFilter[] = ["all", "content", "test"];

const LIMIT = 20;


const SEEN_KEY = "sikhyaan:seen-notifications";

function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function rememberSeen(ids: string[]) {
  try {
    const merged = [...new Set([...loadSeen(), ...ids])].slice(-300);
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
  } catch {
    /* storage band */
  }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export default function Notifications({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false); 
  const [error, setError] = useState("");

  const [seen, setSeen] = useState<Set<string>>(new Set()); 
  const markedOnOpen = useRef(false);
  const latest = useRef(0);
  const itemsRef = useRef(items);

  const chips = isLoggedIn ? MEMBER_CHIPS : GUEST_CHIPS;
  const isRead = (n: NotificationItem) => (isLoggedIn ? n.isRead : seen.has(n.id));

  
  const typing = search.trim() !== query;
  const refreshing = !more && (typing || loading);

  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    if (!isLoggedIn) setSeen(new Set(loadSeen()));
  }, [isLoggedIn]);


  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 200);
    return () => clearTimeout(t);
  }, [search]);


  const markGeneralRead = () =>
    markAllNotificationsRead("general")
      .then(notifyChanged)
      .catch(() => {});

  const load = useCallback(
    async (pageNum: number, append: boolean) => {
      const id = ++latest.current;
      setLoading(true);
      setMore(append);
      setError("");

      try {
        const res = await getNotifications({
          page: pageNum,
          limit: LIMIT,
          filter: filter === "all" ? undefined : filter,
          search: query || undefined,
        });
        if (id !== latest.current) return;

        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setPage(pageNum);
        setHasMore(res.items.length === LIMIT);

       
        if (!markedOnOpen.current) {
          markedOnOpen.current = true;
          if (isLoggedIn) markGeneralRead();
          else rememberSeen(res.items.map((n) => n.id));
        }
      } catch (e) {
        if (id === latest.current) setError(errorText(e));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
   
    [filter, query, isLoggedIn],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);


  const addNew = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const res = await getNotifications({
        page: 1,
        limit: LIMIT,
        filter: filter === "all" ? undefined : filter,
        search: query || undefined,
      });

      const known = new Set(itemsRef.current.map((n) => n.id));
      const fresh = res.items.filter((n) => !known.has(n.id));
      if (fresh.length === 0) return;

      setItems((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...fresh.filter((n) => !ids.has(n.id)), ...prev];
      });
      markGeneralRead(); 
    } catch {
     
    }
  }, [filter, query, isLoggedIn]);

  useLiveNotifications(addNew, false);

  const open = (n: NotificationItem) => {
    if (!isRead(n)) {
      if (isLoggedIn) {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        markNotificationRead(n.id)
          .then(notifyChanged)
          .catch(() => {});
      } else {
        setSeen((prev) => new Set(prev).add(n.id));
        rememberSeen([n.id]);
      }
    }

    const action = notificationAction(n, user.role);
    if (action?.type === "route") router.push(action.href);
    if (action?.type === "tab") onOpenTab?.(action.tab);
  };

  const markAll = async () => {
    setError("");
    try {
      if (isLoggedIn) {
        await markAllNotificationsRead("all");
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
        notifyChanged();
      } else {
        const ids = items.map((x) => x.id);
        rememberSeen(ids);
        setSeen((prev) => new Set([...prev, ...ids]));
      }
    } catch (e) {
      setError(errorText(e));
    }
  };

  const hasUnread = items.some((n) => !isRead(n));

  return (
    <section className="flex min-h-0 w-full max-w-2xl flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <AppText variant="title" as="h2">Notifications</AppText>
        {hasUnread && (
          <AppButton variant="outline" onClick={markAll}>
            Mark all as read
          </AppButton>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search notifications"
        className="w-full max-w-sm shrink-0 rounded-md border border-border/40 bg-premium px-3 py-2 text-sm"
      />

      <div className="flex shrink-0 gap-2 overflow-x-auto py-1 hide-scrollbar">
        {chips.map((chip) => (
          <AppButton
            key={chip}
            variant="filterMob"
            active={filter === chip}
            onClick={() => setFilter(chip)}
            className="shrink-0"
          >
            {LABEL[chip]}
          </AppButton>
        ))}
      </div>

      {error && <AppText variant="caption" className="shrink-0 text-error">{error}</AppText>}

      {refreshing && (
        <AppText variant="caption" className="shrink-0">
          {query || typing ? "Searching…" : "Loading…"}
        </AppText>
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto py-2 transition-opacity hide-scrollbar ${
          refreshing && items.length > 0 ? "opacity-50" : ""
        }`}
      >
        {items.map((n) => {
          const look = LOOK[n.type] ?? LOOK.SYSTEM;
          return (
            <Card
              key={n.id}
              icon={<IconCircle icon={look.icon} tone={look.tone} />}
              title={n.title}
              description={`${n.message} · ${timeAgo(n.createdAt)}`}
              unread={!isRead(n)}
              onClick={() => open(n)}
            />
          );
        })}

        {!refreshing && items.length === 0 && (
          <AppText variant="caption">
            {query || filter !== "all" ? "No matching notifications" : "Nothing here yet"}
          </AppText>
        )}

        {hasMore && (
          <AppButton variant="outline" disabled={loading} onClick={() => load(page + 1, true)}>
            {loading && more ? "Loading…" : "Load more"}
          </AppButton>
        )}
      </div>
    </section>
  );
}