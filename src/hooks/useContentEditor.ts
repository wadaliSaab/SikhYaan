"use client";
import { useCallback, useEffect, useState } from "react";
import { getContentByReference, saveContent, deleteContent , getHomeSections } from "@/services/content/manager.service";
import type { SaveContentInput } from "@/schemas/manage/content.schema";
import type {
  BlockType, ChildItem, ContentDto, EditorBlock, EditorState, HomeSectionOption, Media, MediaDto,
} from "@/src/types/content"; 
import { generateReferenceId } from "@/services/content/referenceId.service"; 
import { getUploadUrl, confirmUpload } from "@/services/content/media.service"; 
import { SECTION_TYPES, typeOf } from "../config/section-types";

const emptyState: EditorState = {
  referenceId: "",
  title: "",
  summary: "",
  parent: null,
  isActive: true,
  hero: null,
  heroRatio: null,
  blocks: [],
  children: [],
  home: null,
};

/* ───────── Helpers ───────── */
const isTemp = (id: string) => id.startsWith("tmp-");
const newId = () => `tmp-${crypto.randomUUID()}`;
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong";



async function uploadFile(file: File): Promise<Media> {
  const { uploadUrl, fileKey } = await getUploadUrl(file);

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error("Upload failed");

  const media = await confirmUpload(fileKey, file.name);
  return { ...media, fileName: file.name };
}




const toMedia = (m: MediaDto | null): Media | null =>
  m && { id: m.id, url: m.url, fileName: m.fileName };


function toState(d: ContentDto): EditorState {
  const p = d.homeSections[0];
  const type = p && typeOf(p.homeSection);

  return {
    id: d.id,
    referenceId: d.referenceId,
    title: d.title,
    summary: d.summary ?? "",
    parent: d.parent,
    isActive: d.isActive,
    hero: toMedia(d.heroMedia),
      heroRatio: d.heroRatio ?? null,
    children: d.children,
    blocks: d.blocks.map((b) => ({
      id: b.id,
      type: b.type,
      title: b.title ?? "",
      content: b.content ?? "",
      media: toMedia(b.media),
      gallery: b.galleryItems.map((g) => toMedia(g.media)!),
    })),
   home: type ? { type, sortOrder: p.sortOrder } : null,
  };
}



const ids = (list: Media[] = []) => list.map((m) => m.id).join();

function buildPayload(o: EditorState, c: EditorState , sections: HomeSectionOption[]) {
  const isNew = !c.id;
  const p: Record<string, unknown> = {};

  
  if (c.id) p.id = c.id;
  if (isNew || c.title !== o.title) p.title = c.title;
  if (isNew || c.referenceId !== o.referenceId) p.referenceId = c.referenceId;
  if (c.summary !== o.summary) p.summary = c.summary;
  if (c.isActive !== o.isActive) p.isActive = c.isActive;
  if (c.hero?.id !== o.hero?.id) p.heroMediaId = c.hero?.id ?? null;

 
  const before = new Map(o.blocks.map((b) => [b.id, b]));

  const updates = c.blocks.flatMap((b) => {
    const old = before.get(b.id); 
    const u: Record<string, unknown> = { id: b.id };

    if (!old) u.type = b.type;
    if (!old || b.title !== old.title) u.title = b.title;
    if (b.type === "TEXT" && (!old || b.content !== old.content))
      u.content = b.content;
    if (
      (b.type === "IMAGE" || b.type === "PDF") &&
      b.media?.id !== old?.media?.id
    ) {
      u.mediaId = b.media?.id ?? null;
    }
    if (b.type === "GALLERY" && ids(b.gallery) !== ids(old?.gallery)) {
      u.gallery = b.gallery.map((m) => m.id);
    }

    return !old || Object.keys(u).length > 1 ? [u] : [];
  });

  const removed = o.blocks
    .filter((b) => !c.blocks.some((x) => x.id === b.id))
    .map((b) => b.id);
  const order = c.blocks.map((b) => b.id);
  const orderChanged = order.join() !== o.blocks.map((b) => b.id).join();

  if (updates.length || removed.length || orderChanged) {
    p.blocks = { updates, removed, ...(orderChanged && { order }) };
  }

  
  const fresh = c.children.filter((x) => isTemp(x.id));
  if (fresh.length) {
    p.newChildren = fresh.map((x, i) => ({
      title: x.title,
      referenceId: x.referenceId,
      sortOrder: o.children.length + i,
    }));
  }

 
  if (JSON.stringify(c.home) !== JSON.stringify(o.home)) {
  if (!c.home) p.homePlacement = null;
  else {
    const t = SECTION_TYPES[c.home.type];
    const s = sections.find(
      (x) =>
        x.layout === t.layout &&
        x.itemVariant === t.itemVariant &&
        x.mediaRatio === t.mediaRatio,
    );
    if (!s) throw new Error(`"${t.label}" type DB ch nahi hai`);

    p.homePlacement = {
      homeSectionId: s.id,
      layout: t.layout,
      itemVariant: t.itemVariant,
      mediaRatio: t.mediaRatio,
      sortOrder: c.home.sortOrder,
    };
  }
}

  return p;
}

async function withReferenceIds(
  s: EditorState,
  o: EditorState,
): Promise<EditorState> {
  const titleChanged = !!s.id && s.title !== o.title;
  const referenceId =
    !s.referenceId || titleChanged
      ? await generateId({ title: s.title, id: s.id })
      : s.referenceId;

  const children: ChildItem[] = [];
  for (const c of s.children) {
    children.push(
      isTemp(c.id)
        ? {
            ...c,
            referenceId: await generateId({ title: c.title, parentId: s.id }),
          }
        : c,
    );
  }

  return { ...s, referenceId, children };
}
/* generate id */
const generateId = (body: { title: string; id?: string; parentId?: string }) =>
  generateReferenceId(body).then((r) => r.referenceId);



/* ───────── Hook ───────── */
export function useContentEditor(referenceId: string | null) {
  const [state, setState] = useState<EditorState>(emptyState);
  const [original, setOriginal] = useState<EditorState>(emptyState);
  const [homeSections, setHomeSections] = useState<HomeSectionOption[]>([]);
  const [loading, setLoading] = useState(!!referenceId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  

  const dirty = JSON.stringify(state) !== JSON.stringify(original);

/* ─── Load ─── */
  const load = useCallback(async (ref: string) => {
    setLoading(true);
    setError("");
    try {
      const next = toState(
        (await getContentByReference(ref)) as unknown as ContentDto,
      );
      setState(next);
      setOriginal(next);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);



  
  useEffect(() => {
   getHomeSections()
  .then(setHomeSections)
  .catch((e) => setError(message(e)));
    if (referenceId) load(referenceId);
  }, [referenceId, load]);

  /* ─── Helpers ─── */
  const set = (patch: Partial<EditorState>) =>
    setState((s) => ({ ...s, ...patch }));

  const editBlock = (id: string, change: (b: EditorBlock) => EditorBlock) =>
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === id ? change(b) : b)),
    }));

 
  async function track<T>(job: () => Promise<T>): Promise<T | null> {
    setError("");
    setUploading((n) => n + 1);
    try {
      return await job();
    } catch (e) {
      setError(message(e));
      return null;
    } finally {
      setUploading((n) => n - 1);
    }
  }

  /* ─── Blocks ─── */
  const blockActions = {
    add: (type: BlockType) =>
      setState((s) => ({
        ...s,
        blocks: [
          ...s.blocks,
          {
            id: newId(),
            type,
            title: type === "GALLERY" ? "Gallery" : "",
            content: "",
            media: null,
            gallery: [],
          },
        ],
      })),

    remove: (id: string) =>
      setState((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) })),

    move: (id: string, direction: -1 | 1) =>
      setState((s) => {
        const i = s.blocks.findIndex((b) => b.id === id);
        const j = i + direction;
        if (i < 0 || j < 0 || j >= s.blocks.length) return s;

        const blocks = [...s.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...s, blocks };
      }),

    setTitle: (id: string, title: string) =>
      editBlock(id, (b) => ({ ...b, title })),

    setMedia: async (id: string, file: File) => {
      const media = await track(() => uploadFile(file));
      if (media)
        editBlock(id, (b) => ({ ...b, media, title: b.title || file.name }));
    },

    addGallery: async (id: string, files: File[]) => {
      const added = await track(() =>
        Promise.all(files.map((f) => uploadFile(f))),
      );
      if (added)
        editBlock(id, (b) => ({ ...b, gallery: [...b.gallery, ...added] }));
    },

    removeGalleryImage: (id: string, mediaId: string) =>
      editBlock(id, (b) => ({
        ...b,
        gallery: b.gallery.filter((m) => m.id !== mediaId),
      })),
  };

  /* ─── Hero ─── */
  const heroActions = {
    change: async (file: File) => {
      const media = await track(() => uploadFile(file));
      if (media) set({ hero: media });
    },
    remove: () => set({ hero: null }),
  };

  /* ─── Children / Text ─── */
  const addChild = (title: string) => {
    if (
      state.children.some((c) => c.title.toLowerCase() === title.toLowerCase())
    ) {
      setError("A child with this name already exists");
      return;
    }

    setError("");
    setState((s) => ({
      ...s,
      children: [
        ...s.children,
        { id: newId(), title, referenceId: "", isActive: false },
      ],
    }));
  };

 
  const saveText = (target: string, title: string, html: string) =>
    target === "summary"
      ? set({ summary: html })
      : editBlock(target, (b) => ({ ...b, title, content: html }));

/* ─── Save  ─── */
  async function save() {
    if (uploading) return null;
    if (!state.title.trim()) {
      setError("Title is required");
      return null;
    }

    setSaving(true);
    setError("");
    try {
      const changed = await withReferenceIds(state, original);
      await saveContent(buildPayload(original, changed , homeSections) as SaveContentInput);
      return changed.referenceId;
    } catch (e) {
      setError(message(e));
      return null;
    } finally {
      setSaving(false);
    }
  }

/* ─── Delete ─── */
  async function remove() {
    if (!state.id) return false;
    try {
      await deleteContent(state.id);
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    }
  }

  return {
    state,
    dirty,
    loading,
    saving,
    uploading,
    error,
    homeSections,
    set,
    saveText,
    addChild,
    blockActions,
    heroActions,
    save,
    remove,
    reload: () => load(state.referenceId),
  };
}

export type BlockActions = ReturnType<typeof useContentEditor>["blockActions"];
export type HeroActions = ReturnType<typeof useContentEditor>["heroActions"];
