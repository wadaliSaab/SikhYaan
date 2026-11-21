import type { ContentBlock } from "@/services/content/manager.service";

export type Tab = {
  key: string;
  label: string;
  texts: ContentBlock[];
  mainGalleries: string[][]; 
  asideGalleries: string[][]; 
};

export type Grouped = {
  tabs: Tab[];
  quick: ContentBlock[];
  pdfs: ContentBlock[];
};

const norm = (s?: string | null) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const QUICK = "quick information";

const urlsOf = (b: ContentBlock) =>
  [...(b.galleryItems ?? [])]
    .sort((a, c) => a.sortOrder - c.sortOrder)
    .map((g) => g.media.url)
    .filter((u): u is string => !!u);

export function groupBlocks(all: ContentBlock[]): Grouped {
  const blocks = [...all].sort((a, b) => a.sortOrder - b.sortOrder);

  const textKeys = new Set(
    blocks.filter((b) => b.type === "TEXT" && norm(b.title) !== QUICK).map((b) => norm(b.title))
  );

  const tabs = new Map<string, Tab>();
  const quick: ContentBlock[] = [];
  const pdfs: ContentBlock[] = [];

  const tabFor = (b: ContentBlock) => {
    const key = norm(b.title);
    if (!tabs.has(key)) {
      tabs.set(key, {
        key,
        label: b.title?.trim() || "Untitled",
        texts: [],
        mainGalleries: [],
        asideGalleries: [],
      });
    }
    return tabs.get(key)!;
  };

  for (const b of blocks) {
    if (b.type === "PDF") pdfs.push(b);
    else if (b.type === "TEXT") {
      if (norm(b.title) === QUICK) quick.push(b);
      else tabFor(b).texts.push(b);
    } else if (b.type === "GALLERY") {
      const urls = urlsOf(b);
      if (urls.length === 0) continue;
      if (textKeys.has(norm(b.title))) tabFor(b).asideGalleries.push(urls);
      else tabFor(b).mainGalleries.push(urls);
    }
   
  }

  return { tabs: [...tabs.values()], quick, pdfs };
}