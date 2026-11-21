"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import FileButton from "@/components/ui/FileButton";
import type { BlockType, EditorBlock } from "@/src/types/content";
import type { BlockActions } from "@/src/hooks/useContentEditor";

const TYPES: { type: BlockType; label: string }[] = [
  { type: "TEXT", label: "Text" },
  { type: "IMAGE", label: "Image" },
  { type: "GALLERY", label: "Gallery" },
  { type: "PDF", label: "PDF" },
];

const typeStyle = {
  TEXT: "bg-secondary-primary/15",
  IMAGE: "bg-success/15",
  GALLERY: "bg-accent-secondary/50",
  PDF: "bg-error/15",
};

const button =
  "flex shrink-0 items-center gap-1 rounded-md border border-border/50 bg-premium px-3 py-1.5 text-xs text-text-primary disabled:cursor-not-allowed disabled:opacity-40";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

type Props = {
  blocks: EditorBlock[];
  actions: BlockActions;
  onEdit: (id: string) => void;
};

export default function BlockList({ blocks, actions, onEdit }: Props) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-w-0 rounded-lg border border-border/20 bg-text-background p-3 sm:p-4">
      {/* Header + Add Block */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <AppText variant="subHeading" className="text-accent">Content Blocks ({blocks.length})</AppText>

        <div className="relative">
          <AppButton className="flex items-center gap-1 rounded-md px-3 py-1.5" onClick={() => setMenu(!menu)}>
            <Plus size={14} /> Add Block
          </AppButton>

          {menu && (
            <div className="absolute right-0 z-10 mt-1 flex w-36 flex-col rounded-md border border-border/30 bg-premium p-1 shadow-lg">
              {TYPES.map(({ type, label }) => (
                <AppButton
                  key={type}
                  variant="icon"
                  className="rounded px-3 py-2 text-left text-sm hover:bg-primary/20"
                  onClick={() => {
                    actions.add(type);
                    setMenu(false);
                  }}
                >
                  {label}
                </AppButton>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-3">
        {blocks.length === 0 && <AppText variant="small" className="cursor-default">No blocks yet. Use Add Block.</AppText>}

        {blocks.map((block, index) => (
          <Row key={block.id} block={block} index={index} total={blocks.length} actions={actions} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
}

function Row({
  block,
  index,
  total,
  actions,
  onEdit,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  actions: BlockActions;
  onEdit: (id: string) => void;
}) {
  const { id, type, media } = block;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-md border border-border/20 bg-premium/40 p-3">
      
      <div className="flex flex-wrap items-center gap-2">
        <AppText className="w-5 shrink-0 text-center">{index + 1}</AppText>

        <span className={`w-16 shrink-0 rounded py-1 text-center text-xs font-semibold ${typeStyle[type]}`}>{type}</span>

        <input
          value={block.title}
          onChange={(e) => actions.setTitle(id, e.target.value)}
          placeholder="Block title"
          className="min-w-0 flex-1 basis-40 rounded-md border border-border/40 bg-premium px-3 py-1.5 text-sm"
        />

        <div className="ml-auto flex gap-1.5">
          <AppButton className={button} disabled={index === 0} onClick={() => actions.move(id, -1)}>
            <ArrowUp size={12} />
          </AppButton>
          <AppButton className={button} disabled={index === total - 1} onClick={() => actions.move(id, 1)}>
            <ArrowDown size={12} />
          </AppButton>
          <AppButton className={`${button} text-error`} onClick={() => actions.remove(id)}>
            <Trash2 size={13} />
          </AppButton>
        </div>
      </div>

      {type === "TEXT" && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
          <AppText variant="small" className="line-clamp-3 min-w-0 flex-1 cursor-default font-normal wrap-anywhere">
            {block.content.replace(/<[^>]+>/g, "") || "No text yet"}
          </AppText>
          <AppButton className={`${button} self-start`} onClick={() => onEdit(id)}>
            <Pencil size={12} /> Edit Text
          </AppButton>
        </div>
      )}

     
      {type === "IMAGE" && (
        <div className="flex min-w-0 flex-col items-start gap-2">
          {media ? (
            <>
              <img src={media.url} alt={block.title} className="max-h-72 w-auto max-w-full rounded-md object-contain" />
              <span className="flex max-w-full items-center gap-1 text-xs font-normal text-text-secondary">
                <Check size={12} className="shrink-0 text-success" />
                <span className="min-w-0 truncate">{media.fileName ?? "Image added"}</span>
              </span>
            </>
          ) : (
            <AppText variant="small" className="cursor-default">No image yet</AppText>
          )}

          <FileButton accept={IMAGE_ACCEPT} onFiles={([file]) => file && actions.setMedia(id, file)} className={button}>
            <Upload size={12} /> {media ? "Change Image" : "Upload Image"}
          </FileButton>
        </div>
      )}

 
      {type === "PDF" && (
        <div className="flex flex-wrap items-center gap-3">
          {media ? (
            <a
              href={media.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 flex-1 basis-48 items-center gap-2 rounded-md border border-success/40 bg-success/10 px-3 py-2"
            >
              <FileText size={22} className="shrink-0 text-error" />
              <AppText variant="caption" className="min-w-0 flex-1 truncate">{media.fileName ?? "PDF file"}</AppText>
              <Check size={16} className="shrink-0 text-success" />
            </a>
          ) : (
            <AppText variant="small" className="flex-1 cursor-default">No PDF yet</AppText>
          )}

          <FileButton accept="application/pdf" onFiles={([file]) => file && actions.setMedia(id, file)} className={button}>
            <Upload size={12} /> {media ? "Change PDF" : "Upload PDF"}
          </FileButton>
        </div>
      )}

      {/* GALLERY */}
      {type === "GALLERY" && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
          {block.gallery.map((m) => (
            <div key={m.id} className="relative aspect-square overflow-hidden rounded-sm">
              <img src={m.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => actions.removeGalleryImage(id, m.id)}
                className="absolute right-1 top-1 rounded-full bg-secondary/70 p-1.5 text-premium"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          <FileButton
            accept={IMAGE_ACCEPT}
            multiple
            onFiles={(files) => actions.addGallery(id, files)}
            className="flex aspect-square w-full items-center justify-center rounded-sm border border-dashed border-border/60 bg-premium px-0 text-text-secondary hover:bg-primary/10"
          >
            <Plus size={20} />
          </FileButton>
        </div>
      )}
    </div>
  );
}