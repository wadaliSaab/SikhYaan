"use client";
import { Pencil } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import FileButton from "@/components/ui/FileButton";
import BlockList from "./BlockList";
import { SECTION_TYPES } from "@/src/config/section-types";
import type { EditorState } from "@/src/types/content";
import type { BlockActions, HeroActions } from "@/src/hooks/useContentEditor";
import { clipSummary } from "@/src/utils/summary";

type Props = {
  state: EditorState;
  set: (patch: Partial<EditorState>) => void;
  heroActions: HeroActions;
  blockActions: BlockActions;
  onEdit: (id: string) => void;
};

const box = "rounded-lg border border-border/20 bg-text-background p-3 sm:p-4";
const input = "w-full min-w-0 rounded-md border border-border/40 bg-premium px-3 py-2 text-sm disabled:opacity-50";
const button =
  "flex shrink-0 items-center gap-1 rounded-md border border-border/50 bg-premium px-3 py-1.5 text-xs text-text-primary";

export default function EditorMain({ state, set, heroActions, blockActions, onEdit }: Props) {
  const home = state.home;

  const ratio = home ? SECTION_TYPES[home.type].ratio : state.heroRatio;
  const heroShape = (ratio ?? "16:9").replace(":", " / ");

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Basic Information */}
      <div className={box}>
        <AppText variant="subHeading" className="mb-3 text-accent">Basic Information</AppText>

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          {/* Left */}
          <div className="flex min-w-0 flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <AppText variant="caption" className="mb-1">Title *</AppText>
                <input className={input} value={state.title} onChange={(e) => set({ title: e.target.value })} />
              </div>

              <div className="min-w-0">
                <AppText variant="caption" className="mb-1">Reference ID</AppText>
                <input className={input} value={state.referenceId || "Auto-generated on save"} readOnly />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={state.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
              <AppText variant="caption" as="span">Active (visible on website)</AppText>
            </label>

            {/* Summary */}
            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <AppText variant="caption">Short Summary</AppText>
                <AppButton className={button} onClick={() => onEdit("summary")}>
                  <Pencil size={12} /> Edit
                </AppButton>
              </div>

              <div
                className={`${input} rich min-h-20 text-xs wrap-anywhere`}
                dangerouslySetInnerHTML={{ __html: clipSummary(state.summary) }}
              />
            </div>
          </div>

        
          <div className="mx-auto w-full max-w-56 lg:max-w-none">
            <AppText variant="caption" className="mb-1">Hero Image</AppText>

            {state.hero ? (
              <img src={state.hero.url} alt="" className="w-full rounded-md object-cover" style={{ aspectRatio: heroShape }} />
            ) : (
              <div className="w-full rounded-md bg-primary/30" style={{ aspectRatio: heroShape }} />
            )}

            <div className="mt-2 flex flex-wrap gap-1.5">
              <FileButton
                accept="image/jpeg,image/png,image/webp"
                onFiles={([file]) => file && heroActions.change(file)}
                className={button}
              >
                {state.hero ? "Change" : "Upload"}
              </FileButton>

              {state.hero && (
                <AppButton className={`${button} text-error`} onClick={heroActions.remove}>Remove</AppButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Blocks */}
      <BlockList blocks={state.blocks} actions={blockActions} onEdit={onEdit} />

      {/* Home Page Placement */}
      {!state.parent && (
        <div className={box}>
          <AppText variant="subHeading" className="mb-3 text-accent">Home Page Placement (Optional)</AppText>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0">
              <AppText variant="caption" className="mb-1">Type</AppText>
              <select
                className={input}
                value={home?.type ?? ""}
                onChange={(e) =>
                  set({
                    home: e.target.value
                      ? { type: e.target.value as keyof typeof SECTION_TYPES, sortOrder: home?.sortOrder ?? 0 }
                      : null,
                  })
                }
              >
                <option value="">Not on home page</option>
                {Object.entries(SECTION_TYPES).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <AppText variant="caption" className="mb-1">Sort Order</AppText>
              <input
                type="number"
                min={0}
                className={input}
                disabled={!home}
                value={home?.sortOrder ?? 0}
                onChange={(e) => home && set({ home: { ...home, sortOrder: Number(e.target.value) } })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}