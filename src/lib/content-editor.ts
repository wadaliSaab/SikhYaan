import { SECTION_TYPES , typeOf } from "@/src/config/section-types";
import type { ContentDto, EditorState, HomePlacement, Media } from "../types/content";

export const isTemp = (id: string) => id.startsWith("tmp-");

export const emptyState: EditorState = {
  referenceId: "",
  title: "",
  summary: "",
  parent: null,
  isActive: true,
  hero: null,
  blocks: [],
  children: [],
  home: null,
};

const toMedia = (m: { id: string; url: string; fileName: string } | null): Media | null =>
  m ? { id: m.id, url: m.url, fileName: m.fileName } : null;

const ids = (list: Media[] = []) => list.map((m) => m.id).join();


const toPlacement = (h: HomePlacement) => {
  const { layout, itemVariant, mediaRatio } = SECTION_TYPES[h.type];
  return { layout, itemVariant, mediaRatio, sortOrder: h.sortOrder };
};


export function toEditorState(d: ContentDto): EditorState {
  const placement = d.homeSections[0];

  return {
    id: d.id,
    referenceId: d.referenceId,
    title: d.title,
    summary: d.summary ?? "",
    parent: d.parent,
    isActive: d.isActive,
    hero: toMedia(d.heroMedia),
    children: d.children,
    blocks: d.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      title: b.title ?? "",
      content: b.content ?? "",
      media: toMedia(b.media),
      gallery: b.galleryItems.map((g) => toMedia(g.media)!),
    })),
  home: placement
  ? { type: typeOf(placement.homeSection)!, sortOrder: placement.sortOrder }
  : null,
  };
}


export function buildPayload(o: EditorState, c: EditorState) {
  const isNew = !c.id;
  const payload: Record<string, unknown> = {};


  if (c.id) payload.id = c.id;
  if (isNew || c.title !== o.title) payload.title = c.title;
  if (isNew || c.referenceId !== o.referenceId) payload.referenceId = c.referenceId;
  if (c.summary !== o.summary) payload.summary = c.summary;
  if (c.isActive !== o.isActive) payload.isActive = c.isActive;
  if (c.hero?.id !== o.hero?.id) payload.heroMediaId = c.hero?.id ?? null;


  const before = new Map(o.blocks.map((b) => [b.id, b]));

  const updates = c.blocks.flatMap((b) => {
    const old = before.get(b.id); 
    const u: Record<string, unknown> = { id: b.id };

    if (!old) u.type = b.type;
    if (!old || b.title !== old.title) u.title = b.title;
    if (b.type === "TEXT" && (!old || b.content !== old.content)) u.content = b.content;
    if ((b.type === "IMAGE" || b.type === "PDF") && b.media?.id !== old?.media?.id) {
      u.mediaId = b.media?.id ?? null;
    }
    if (b.type === "GALLERY" && ids(b.gallery) !== ids(old?.gallery)) {
      u.gallery = b.gallery.map((m) => m.id);
    }

    return !old || Object.keys(u).length > 1 ? [u] : [];
  });

  const removed = o.blocks.filter((b) => !c.blocks.some((x) => x.id === b.id)).map((b) => b.id);
  const order = c.blocks.map((b) => b.id);
  const orderChanged = order.join() !== o.blocks.map((b) => b.id).join();

  if (updates.length || removed.length || orderChanged) {
    payload.blocks = { updates, removed, ...(orderChanged && { order }) };
  }

  
  const fresh = c.children.filter((x) => isTemp(x.id));
  if (fresh.length) {
    payload.newChildren = fresh.map((x, i) => ({
      title: x.title,
      referenceId: x.referenceId,
      sortOrder: o.children.length + i,
    }));
  }

  
  if (JSON.stringify(c.home) !== JSON.stringify(o.home)) {
    payload.homePlacement = c.home && toPlacement(c.home);
  }

  return payload;
}