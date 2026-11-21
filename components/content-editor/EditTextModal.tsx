"use client";
import { useState } from "react";
import { X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import RichTextEditor from "./RichTextEditor";
import { SUMMARY_MAX, SUMMARY_MAX_LINES, lineCount, textLength } from "@/src/utils/summary";

type Props = { title?: string; html: string; onSave: (title: string, html: string) => void; onClose: () => void };

export default function EditTextModal({ title: t, html: h, onSave, onClose }: Props) {
  const [title, setTitle] = useState(t ?? "");
  const [html, setHtml] = useState(h);


  const isSummary = t === undefined;
  const chars = textLength(html);
  const lines = lineCount(html);
  const over = isSummary && (chars > SUMMARY_MAX || lines > SUMMARY_MAX_LINES);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-secondary/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col gap-4 overflow-y-auto bg-text-background p-4 sm:max-w-xl sm:p-5"
      >
        <div className="flex items-center justify-between">
          <AppText variant="title">Edit Text</AppText>
          <AppButton variant="icon" onClick={onClose}><X size={20} /></AppButton>
        </div>

        {!isSummary && (
          <div>
            <AppText variant="caption" className="mb-1">Block Title *</AppText>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-border/40 bg-premium px-3 py-2 text-sm" />
          </div>
        )}

        <div className="min-w-0">
          <AppText variant="caption" className="mb-1">Content *</AppText>
          <RichTextEditor
            value={html}
            onChange={setHtml}
            limit={isSummary ? SUMMARY_MAX : undefined}
            maxLines={isSummary ? SUMMARY_MAX_LINES : undefined}
          />
          {isSummary && (
            <AppText variant="caption" className={`mt-1 text-right ${over ? "text-error" : ""}`}>
              {chars} / {SUMMARY_MAX} chars · {lines} / {SUMMARY_MAX_LINES} lines
            </AppText>
          )}
        </div>

        <div className="rounded-md border border-border/20 bg-premium/60 p-4">
          <AppText variant="subHeading" className="mb-2">Preview</AppText>
          <div className="rich text-sm wrap-anywhere" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

       
        <div className="sticky bottom-0 -mx-4 -mb-4 mt-auto flex justify-end gap-2 border-t border-border/20 bg-text-background px-4 py-3 sm:-mx-5 sm:-mb-5 sm:px-5">
          <AppButton className="rounded-md border border-border/50 px-5 py-2" onClick={onClose}>Cancel</AppButton>
          <AppButton
            className="rounded-md px-5 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={over}
            onClick={() => onSave(title, html)}
          >
            Save
          </AppButton>
        </div>
      </div>
    </div>
  );
}