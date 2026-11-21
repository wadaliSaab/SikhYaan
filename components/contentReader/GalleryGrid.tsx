"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";

export default function GalleryGrid({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const step = (d: number) =>
    setOpen((i) => (i === null ? null : (i + d + urls.length) % urls.length));

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {urls.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpen(i)}
            className="h-24 overflow-hidden rounded-sm sm:h-28"
          >
            <img src={url} alt="" loading="lazy" className="h-full w-auto max-w-full" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <img
            src={urls[open]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain"
          />
          <AppButton variant="icon" className="absolute right-4 top-4 text-white" onClick={() => setOpen(null)}>
            <X size={24} />
          </AppButton>
          {urls.length > 1 && (
            <>
              <AppButton
                variant="icon"
                className="absolute left-3 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                <ChevronLeft size={32} />
              </AppButton>
              <AppButton
                variant="icon"
                className="absolute right-3 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                <ChevronRight size={32} />
              </AppButton>
            </>
          )}
        </div>
      )}
    </>
  );
}