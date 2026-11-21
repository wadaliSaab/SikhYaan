"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import AppText from "@/components/ui/AppText";
import AppButton from "@/components/ui/AppButton";
import Avatar from "../Avatar";
import Card from "../Card";
import IconCircle from "../IconCircle";
import DeleteAccountModal from "../DeleteAccountModal";
import { useAuth } from "@/providers/AuthProvider";
import {
  uploadAvatar,
  removeAvatar,
  deleteMyAccount,
} from "@/services/auth.service";


export const GUEST_ID = "GUEST-48291";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 2;

const errorText = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const joined = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export default function Profile() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  
  useEffect(() => {
    setPreview(null);
  }, [user.avatarUrl]);


  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  /* ───── Guest ───── */
  if (!isLoggedIn) {
    return (
      <section className="flex w-full max-w-2xl flex-col space-y-3">
        <AppText variant="title" as="h2">Profile</AppText>
        <Card
          icon={<IconCircle icon={User} tone="gold" />}
          value={GUEST_ID}
          title="Your guest ID"
          description="Login or register to ask doubts, take tests and contribute."
        >
          <div className="flex gap-2">
            <AppButton onClick={() => router.push("/login")}>Login</AppButton>
            <AppButton variant="outline" onClick={() => router.push("/register")}>
              Register
            </AppButton>
          </div>
        </Card>
      </section>
    );
  }

  /* ───── Logged-in ───── */
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; 
    if (!file) return;

    setError("");
    if (!ACCEPT.includes(file.type)) return setError("Only JPG, PNG or WEBP images are allowed");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Image must be smaller than ${MAX_MB} MB`);

    setPreview(URL.createObjectURL(file)); 
    setBusy(true);
    try {
      await uploadAvatar(file);
      router.refresh(); 
    } catch (err) {
      setPreview(null);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setError("");
    setBusy(true);
    try {
      await removeAvatar();
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (password: string) => {
    await deleteMyAccount(password);
   
    window.location.href = "/";
  };

  const avatarSrc = preview ?? user.avatarUrl ?? undefined;

  const details = [
    ["Name", user.name],
    ["Email", user.email],
    ["Role", cap(user.role)],
    ["Joined", joined(user.createdAt)],
  ];
  
  return (
    <section className="flex w-full max-w-2xl flex-col space-y-3">
      <AppText variant="title" as="h2">Profile</AppText>

      <Card
        icon={<Avatar name={user.name} src={avatarSrc} />}
        title={user.name}
        description={`${cap(user.role)} · ${user.email}`}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row">
            <AppButton variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? "Saving…" : "Change avatar"}
            </AppButton>
            {avatarSrc && (
              <AppButton variant="outline" disabled={busy} onClick={onRemove}>
                Remove
              </AppButton>
            )}
          </div>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT.join(",")}
        hidden
        onChange={onPick}
      />

      {error && (
        <AppText variant="caption" className="text-error">{error}</AppText>
      )}

      <Card title="Basic details">
        {details.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b border-border/15 py-2 last:border-0"
          >
            <AppText variant="caption" className="font-normal text-text-secondary">{label}</AppText>
            <AppText variant="caption" className="min-w-0 wrap-break-word  text-right text-accent">
              {value}
            </AppText>
          </div>
        ))}
      </Card>

      <Card
        title="Delete account"
        description="Your name and email are removed. Your doubts and replies stay as &quot;Deleted user&quot;."
        actions={
          <AppButton variant="outline" className="text-error" onClick={() => setDeleting(true)}>
            Delete
          </AppButton>
        }
      />

      {deleting && (
        <DeleteAccountModal onConfirm={onDelete} onClose={() => setDeleting(false)} />
      )}
    </section>
  );
}
