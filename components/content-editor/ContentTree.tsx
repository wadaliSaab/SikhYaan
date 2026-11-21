"use client";
import { useState } from "react";
import { Check, FileText, Plus, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import type { ChildItem } from "@/src/types/content";

type Props = {
  items: ChildItem[];
  onOpen: (item: ChildItem) => void;
  onAdd: (title: string) => void;
};

export default function ContentTree({ items, onOpen, onAdd }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setAdding(false);
    setName("");
  };

  const submit = () => {
    const title = name.trim();
    if (!title) return;
    onAdd(title);
    close();
  };

  return (
    <div className="flex min-h-0 min-w-0 rounded-lg border border-accent/20 md:h-full">
    
      <div className="flex max-h-56 min-h-0 w-full flex-col p-2 md:h-full md:max-h-none">
        {/* topic + Add button */}
        <div className="flex w-full items-center justify-between rounded-md px-3 pb-2 pt-1">
          <AppText variant="subHeading" className="text-accent">Content Tree</AppText>
          <AppButton variant="icon" title="Add" onClick={() => setAdding(true)} className="rounded hover:bg-primary/20">
            <Plus size={14} />
          </AppButton>
        </div>

      
        {adding && (
          <div className="mx-2 mb-2 flex items-center gap-1 rounded-md border border-primary bg-premium px-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") close();
              }}
              placeholder="Title"
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
            />
            <AppButton variant="icon" title="Add" onClick={submit} className="p-1 text-success">
              <Check size={16} />
            </AppButton>
            <AppButton variant="icon" title="Cancel" onClick={close} className="p-1 text-error">
              <X size={16} />
            </AppButton>
          </div>
        )}

        {/* sub topics */}
        <div className="hide-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
          {items.length === 0 && <AppText variant="small" className="cursor-default px-3">No children yet</AppText>}

          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpen(item)}
              className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-primary/10"
            >
              <FileText size={13} className="shrink-0 text-accent-light" />
              <AppText variant="caption" className="min-w-0 flex-1 truncate">{item.title}</AppText>
              {!item.referenceId && <span className="shrink-0 text-2xs text-text-secondary">unsaved</span>}
              {item.referenceId && !item.isActive && <span className="shrink-0 text-2xs text-text-secondary">inactive</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}