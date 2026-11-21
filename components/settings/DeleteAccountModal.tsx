"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
};

export default function DeleteAccountModal({ onConfirm, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!password || busy) return;
    setBusy(true);
    setError("");

    try {
      await onConfirm(password);
     
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm"
      onClick={() => !busy && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-text-background p-5 shadow-2xl"
      >
        <AppText variant="title">Delete your account?</AppText>
        <AppText variant="body" className="font-normal">
          This cannot be undone. Your name, email and avatar are removed. Your doubts and replies
          stay, shown as &quot;Deleted user&quot;.
        </AppText>

        <div>
          <AppText variant="caption" className="mb-1">Enter your password to confirm</AppText>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-md border border-border/40 bg-premium px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <AppText variant="caption" className="text-error">{error}</AppText>
        )}

        <div className="flex justify-end gap-2">
          <AppButton
            className="rounded-md border border-border/50 px-4 py-2"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </AppButton>
          <AppButton
            className="rounded-md px-4 py-2 text-error disabled:opacity-50"
            disabled={!password || busy}
            onClick={submit}
          >
            {busy ? "Deleting…" : "Delete account"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}