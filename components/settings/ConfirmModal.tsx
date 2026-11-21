"use client";

import { useState } from "react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  withNote?: boolean; 
  onConfirm: (note?: string) => Promise<void>;
  onClose: () => void;
};

export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  withNote,
  onConfirm,
  onClose,
}: Props) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    await onConfirm(note.trim() || undefined);
    
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
        <AppText variant="title">{title}</AppText>
        <AppText variant="body" className="font-normal wrap-anywhere ">
          {message}
        </AppText>

        {withNote && (
          <div>
            <AppText variant="caption" className="mb-1">Reason (optional)</AppText>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full rounded-md border border-border/40 bg-premium px-3 py-2 text-sm"
            />
          </div>
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
            className={`rounded-md px-4 py-2 disabled:opacity-50 ${danger ? "text-error" : ""}`}
            disabled={busy}
            onClick={submit}
          >
            {busy ? "Please wait…" : confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  );
}