"use client";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  isNew: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

const outline = "rounded-md border border-border/50 bg-premium px-4 py-2 text-sm text-text-primary";

export default function UnsavedModal({ isNew, saving, onSave, onDiscard, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-text-background p-5 shadow-2xl">
        <AppText variant="title">Unsaved changes</AppText>
        <AppText variant="body" className="font-normal">
          {isNew ? "Save this content first, then continue." : "You have changes that are not saved yet."}
        </AppText>

        <div className="flex flex-wrap justify-end gap-2">
          <AppButton className={outline} onClick={onCancel}>Cancel</AppButton>
          {!isNew && (
            <AppButton className={`${outline} text-error`} onClick={onDiscard}>Discard and continue</AppButton>
          )}
          <AppButton className="rounded-md px-4 py-2 disabled:opacity-50" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save and continue"}
          </AppButton>
        </div>
      </div>
    </div>
  );
}