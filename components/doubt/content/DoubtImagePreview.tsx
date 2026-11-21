"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";

type Props = {
  images: string[];
  activeIndex: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

export default function DoubtImagePreview({
  images,
  activeIndex,
  onClose,
  onChange,
}: Props) {
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") {
        onChange((activeIndex + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        onChange((activeIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, onChange, onClose]);

  if (activeIndex === null || !images[activeIndex]) return null;

  const image = images[activeIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
    >
      <AppButton
        type="button"
        variant="icon"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X size={22} />
      </AppButton>

      {images.length > 1 && (
        <>
          <AppButton
            type="button"
            variant="icon"
            aria-label="Previous image"
            onClick={(event) => {
              event.stopPropagation();
              onChange((activeIndex - 1 + images.length) % images.length);
            }}
            className="absolute left-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-5"
          >
            <ChevronLeft size={24} />
          </AppButton>

          <AppButton
            type="button"
            variant="icon"
            aria-label="Next image"
            onClick={(event) => {
              event.stopPropagation();
              onChange((activeIndex + 1) % images.length);
            }}
            className="absolute right-2 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-5"
          >
            <ChevronRight size={24} />
          </AppButton>
        </>
      )}

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={image}
          alt={`Doubt photo ${activeIndex + 1}`}
          className="max-h-[78dvh] max-w-full rounded-xl object-contain"
        />

        <div className="flex items-center gap-3">
          <AppText className="text-xs text-white/70">
            {activeIndex + 1} / {images.length}
          </AppText>
          <a
            href={image}
            download={`doubt-image-${activeIndex + 1}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-white/85"
          >
            <Download size={16} />
            Download image
          </a>
        </div>
      </div>
    </div>
  );
}