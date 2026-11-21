"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import AppText from "@/components/ui/AppText";
import Card from "../Card";
import IconCircle, { type Tone } from "../IconCircle";
import {
  getMyRequests,
  markMyRequestsSeen,
  type MyRequest,
  type RequestStatus,
} from "@/services/settings/role-request.service";
import { cap, timeAgo } from "@/src/utils/format";

const LOOK: Record<RequestStatus, { icon: typeof Clock; tone: Tone; label: string }> = {
  PENDING: { icon: Clock, tone: "gold", label: "Pending" },
  APPROVED: { icon: CheckCircle2, tone: "green", label: "Approved" },
  REJECTED: { icon: XCircle, tone: "red", label: "Not approved" },
};

export default function MyRequests() {
  const [items, setItems] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyRequests()
      .then((res) => {
        setItems(res.items);
        
        markMyRequestsSeen().catch(() => {});
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="flex w-full max-w-2xl flex-col space-y-3">
      <AppText variant="title" as="h2">My Requests</AppText>

      {error && <AppText variant="caption" className="text-error">{error}</AppText>}
      {loading && <AppText variant="caption">Loading…</AppText>}

      {!loading && items.length === 0 && (
        <AppText variant="caption">You haven&apos;t requested any role yet.</AppText>
      )}

      {items.map((r) => {
        const look = LOOK[r.status];
        const when =
          r.status === "PENDING"
            ? `Sent ${timeAgo(r.createdAt)}`
            : `${look.label} ${timeAgo(r.reviewedAt ?? r.createdAt)}`;

        return (
          <Card
            key={r.id}
            icon={<IconCircle icon={look.icon} tone={look.tone} />}
            title={`${cap(r.role)} role`}
            description={`${look.label} · ${when}${r.reviewNote ? ` · ${r.reviewNote}` : ""}`}
          />
        );
      })}

      <AppText variant="small" className="cursor-default">
        To request a higher role, register again with the same name, email and password and choose
        the role.
      </AppText>
    </section>
  );
}