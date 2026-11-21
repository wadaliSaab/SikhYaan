import { FileText, Download, Info } from "lucide-react";
import AppText from "@/components/ui/AppText";
import GalleryGrid from "./GalleryGrid";
import type { ContentBlock } from "@/services/content/manager.service";

const mb = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : "");

const box = "min-w-0 rounded-xl bg-text-background p-4";

export default function GuruAside({
  quick,
  galleries,
  pdfs,
}: {
  quick: ContentBlock[];
  galleries: string[][];
  pdfs: ContentBlock[];
}) {
  if (quick.length === 0 && galleries.length === 0 && pdfs.length === 0) return null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {quick.length > 0 && (
        <div className={box}>
          <div className="mb-3 flex items-center gap-2">
            <Info size={18} className="text-primary" />
            <AppText variant="subHeading" className="text-accent">Quick Information</AppText>
          </div>
          <div className="flex flex-col gap-3">
            {quick.map((b) => (
              <div
                key={b.id}
                className="rich max-w-full text-xs wrap-anywhere"
                dangerouslySetInnerHTML={{ __html: b.content ?? "" }}
              />
            ))}
          </div>
        </div>
      )}

      {galleries.length > 0 && (
        <div className={`${box} flex flex-col gap-3`}>
          {galleries.map((urls, i) => (
            <GalleryGrid key={i} urls={urls} />
          ))}
        </div>
      )}

      {pdfs.length > 0 && (
        <div className={box}>
          <div className="mb-3 flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <AppText variant="subHeading" className="text-accent">PDF Resources</AppText>
          </div>

          {pdfs.map((b) => (
            <div key={b.id} className="flex items-center gap-3 py-2">
              <FileText size={28} className="shrink-0 text-error" />
              <div className="min-w-0 flex-1">
                <AppText variant="caption" className="truncate">{b.title ?? b.media?.fileName}</AppText>
                <AppText variant="small" className="cursor-default">PDF · {mb(b.media?.size)}</AppText>
              </div>
              {b.media?.url && (
                <a
                  href={b.media.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border/40 p-2"
                >
                  <Download size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}