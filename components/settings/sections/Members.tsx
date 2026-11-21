"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, GraduationCap, ShieldCheck, Users } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import Avatar from "../Avatar";
import Card from "../Card";
import IconCircle from "../IconCircle";
import ConfirmModal from "../ConfirmModal";
import { useAuth } from "@/providers/AuthProvider";
import {
  getMembers,
  suspendMember,
  restoreMember,
  removeMember,
  type Member,
  type MemberStats,
} from "@/services/settings/member.service";
import {
  getRoleRequests,
  decideRequest,
  type RoleRequestCard,
} from "@/services/settings/role-request.service";
import { cap, timeAgo } from "@/src/utils/format";

const ROLE_STATS = [
  { role: "admin", label: "Admins", icon: ShieldCheck, tone: "red", note: "People who manage the platform" },
  { role: "contributor", label: "Contributors", icon: Users, tone: "gold", note: "People who submit content" },
  { role: "learner", label: "Learners", icon: GraduationCap, tone: "slate", note: "People who read content" },
] as const;

type Role = (typeof ROLE_STATS)[number]["role"];
type Status = "all" | "suspended";

const LIMIT = 20;

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

type Pending =
  | { kind: "suspend" | "remove"; member: Member }
  | { kind: "decline"; request: RoleRequestCard }
  | null;

export default function Members() {
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats>({});
  const [requests, setRequests] = useState<RoleRequestCard[]>([]);

  
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [requestsOpen, setRequestsOpen] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

 
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

 
  const latest = useRef(0);

  const loadMembers = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!role) return;
      const id = ++latest.current;
      setLoading(true);
      try {
        const res = await getMembers({
          page: pageNum,
          limit: LIMIT,
          search: query || undefined,
          role,
          status: status === "suspended" ? "suspended" : undefined,
        });
        if (id !== latest.current) return;

        setMembers((prev) => (append ? [...prev, ...res.items] : res.items));
        setStats(res.stats);
        setPage(pageNum);
        setHasMore(res.items.length === LIMIT);
      } catch (e) {
        if (id === latest.current) setError(errorText(e));
      } finally {
        if (id === latest.current) setLoading(false);
      }
    },
    [role, status, query],
  );

  const loadStats = useCallback(() => {
    getMembers({ page: 1, limit: 1 })
      .then((res) => setStats(res.stats))
      .catch((e) => setError(errorText(e)));
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res = await getRoleRequests({ limit: 50 });
      setRequests(res.items);
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    loadMembers(1, false);
  }, [loadMembers]);

  useEffect(() => {
    loadStats();
    loadRequests();
  }, [loadStats, loadRequests]);


  const pick = (next: Role | null) => {
    latest.current++;
    setLoading(false);
    setMembers([]);
    setHasMore(false);
    setStatus("all");
    setSearch("");
    setQuery("");
    setRole(next);
  };

  const act = async (job: () => Promise<unknown>) => {
    setError("");
    setBusy(true);
    try {
      await job();
      await Promise.all([loadRequests(), loadStats(), loadMembers(1, false)]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

    const confirm = async (note?: string) => {
    if (!pending) return;
    const p = pending;

    await act(() => {
      if (p.kind === "decline") return decideRequest(p.request.id, false, note);
      return p.kind === "suspend" ? suspendMember(p.member.id) : removeMember(p.member.id);
    });

    setPending(null);
  };
  
  const modal = pending && {
    suspend: {
      title: "Suspend this account?",
      message: pending.kind === "suspend"
        ? `${pending.member.name} will be logged out and cannot login until restored.`
        : "",
      confirmLabel: "Suspend",
    },
    remove: {
      title: "Remove this account?",
      message: pending.kind === "remove"
        ? `${pending.member.name}'s account is deleted permanently. Their doubts and replies stay as "Deleted user".`
        : "",
      confirmLabel: "Remove",
    },
    decline: {
      title: "Decline this request?",
      message: pending.kind === "decline"
        ? `${pending.request.user.name} will be told the ${cap(pending.request.requestedRole.name)} request was not approved.`
        : "",
      confirmLabel: "Decline",
    },
  }[pending.kind];

  const current = ROLE_STATS.find((s) => s.role === role);

  return (
    <div
      className="
        flex h-full min-h-0 w-full max-w-4xl flex-col gap-6
        overflow-hidden
        max-md:h-full max-md:overflow-y-auto hide-scrollbar
      "
    >
      {error && (
        <AppText variant="caption" className="shrink-0 text-error">{error}</AppText>
      )}

      {current ? (
        <>
         
          <section className="shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              <AppButton variant="outline" className="flex items-center gap-1" onClick={() => pick(null)}>
                <ArrowLeft size={16} /> Back
              </AppButton>
              <AppText variant="title" as="h2">{current.label}</AppText>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full max-w-sm rounded-md border border-border/40 bg-premium px-3 py-2 text-sm"
            />

            <div className="flex flex-wrap gap-2">
              {(["all", "suspended"] as const).map((item) => (
                <AppButton
                  key={item}
                  variant="filterMob"
                  active={status === item}
                  onClick={() => setStatus(item)}
                  className="capitalize"
                >
                  {item}
                </AppButton>
              ))}
            </div>
          </section>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto hide-scrollbar max-md:flex-none max-md:overflow-visible">
            <div className="space-y-3 pb-4">
              {members.map((member) => (
                <Card
                  key={member.id}
                  icon={<Avatar name={member.name} src={member.avatar?.url} />}
                  title={member.name}
                  description={`${cap(member.role)} · ${member.email}${member.suspended ? " · Suspended" : ""}`}
                  actions={
                    member.id !== user.id ? (
                      <div className="flex flex-wrap gap-2">
                        {member.suspended ? (
                          <AppButton
                            variant="outline"
                            disabled={busy}
                            onClick={() => act(() => restoreMember(member.id))}
                          >
                            Restore
                          </AppButton>
                        ) : (
                          <AppButton
                            variant="outline"
                            disabled={busy}
                            onClick={() => setPending({ kind: "suspend", member })}
                          >
                            Suspend
                          </AppButton>
                        )}
                        <AppButton
                          variant="outline"
                          className="text-error"
                          disabled={busy}
                          onClick={() => setPending({ kind: "remove", member })}
                        >
                          Remove
                        </AppButton>
                      </div>
                    ) : undefined
                  }
                />
              ))}

              {loading && <AppText variant="caption">Loading…</AppText>}

              {!loading && members.length === 0 && (
                <AppText variant="caption">No members found.</AppText>
              )}

              {hasMore && !loading && (
                <AppButton variant="outline" onClick={() => loadMembers(page + 1, true)}>
                  Load more
                </AppButton>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Overview */}
          <section className="shrink-0 space-y-3">
            <AppText variant="title" as="h2">Overview</AppText>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROLE_STATS.map((stat) => (
                <Card
                  key={stat.role}
                  icon={<IconCircle icon={stat.icon} tone={stat.tone} />}
                  value={stats[stat.role] ?? 0}
                  title={stat.label}
                  description={stat.note}
                  onClick={() => pick(stat.role)}
                />
              ))}
            </div>
          </section>

          {/* Role requests */}
          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto hide-scrollbar max-md:flex-none max-md:overflow-visible">
            <section className="space-y-3 pb-4">
              <button
                type="button"
                onClick={() => setRequestsOpen((open) => !open)}
                aria-expanded={requestsOpen}
                className="flex w-full items-center justify-between gap-3 rounded-xl py-2 text-left transition-colors hover:bg-white/5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E1961A]/10 text-[#E1961A]">
                    <Users size={20} />
                  </span>

                  <span className="min-w-0">
                    <AppText variant="title" as="h2">Role requests</AppText>
                    <span className="text-sm text-slate-400">
                      {requests.length} pending {requests.length === 1 ? "request" : "requests"}
                    </span>
                  </span>
                </span>

                <ChevronDown
                  size={20}
                  className={`shrink-0 transition-transform duration-200 ${requestsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {requestsOpen && (
                <div className="space-y-3">
                  {requests.length === 0 ? (
                    <AppText variant="caption">No pending requests</AppText>
                  ) : (
                    requests.map((request) => (
                      <Card
                        key={request.id}
                        icon={<Avatar name={request.user.name} src={request.user.avatar?.url} />}
                        title={request.user.name}
                        description={`${cap(request.user.currentRole)} → ${cap(request.requestedRole.name)} · ${request.user.email} · ${timeAgo(request.createdAt)}`}
                        actions={
                          <div className="flex flex-wrap gap-2">
                            <AppButton
                              disabled={busy}
                              onClick={() => act(() => decideRequest(request.id, true))}
                            >
                              Accept
                            </AppButton>
                            <AppButton
                              variant="outline"
                              disabled={busy}
                              onClick={() => setPending({ kind: "decline", request })}
                            >
                              Decline
                            </AppButton>
                          </div>
                        }
                      />
                    ))
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {pending && modal && (
        <ConfirmModal
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          danger={pending.kind !== "decline"}
          withNote={pending.kind === "decline"}
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}