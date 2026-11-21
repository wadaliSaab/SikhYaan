import { apiClient } from "../api-client";

export type ContentBlockType = "TEXT" | "IMAGE" | "PDF" | "GALLERY";

export type ContentBlockInput = {
  id: string;
  type?: ContentBlockType;
  title?: string | null;
  content?: string | null;
  mediaId?: string | null;
  gallery?: string[];
};

export type ContentBlocksInput = {
  updates: ContentBlockInput[];
  removed: string[];
  order?: string[];
};

export type NewChildInput = {
  title: string;
  referenceId: string;
  sortOrder?: number;
};

export type HomePlacementInput = {
  homeSectionId: string;
  layout: "GRID" | "LIST" | "FEATURE";
  itemVariant:
    | "IMAGE_CARD"
    | "IMAGE_CARD_LARGE"
    | "COMPACT_CARD"
    | "PDF_CARD";
  mediaRatio: "SQUARE" | "LANDSCAPE" | "PORTRAIT";
  sortOrder?: number;
};

export type SaveContentInput = {
  id?: string;
  referenceId?: string;
  title?: string;
  summary?: string | null;
  parentId?: string | null;
  heroMediaId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  blocks?: ContentBlocksInput;
  newChildren?: NewChildInput[];
  homePlacement?: HomePlacementInput;
};

export type SaveContentResponse = {
  id: string;
};

export type ContentMedia = {
  id: string;
  type: "IMAGE" | "PDF";
  url?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
};

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  title: string | null;
  content: string | null;
  sortOrder: number;
  mediaId: string | null;
  media?: ContentMedia | null;
  galleryItems?: Array<{
    id: string;
    sortOrder: number;
    media: ContentMedia;
  }>;
};

export type ContentItem = {
  id: string;
  referenceId: string;
  title: string;
  summary: string | null;
  parentId: string | null;
  heroMediaId?: string | null;
  heroMedia?: ContentMedia | null;
  isActive: boolean;
  parent?: { title: string; referenceId: string } | null;
  sortOrder: number;
  children: ContentItem[];
  blocks: ContentBlock[];
};

export type HomeSection = {
  id: string;
  referenceId: string;
  title: string;
  layout: "GRID" | "LIST" | "FEATURE";
  itemVariant:
    | "IMAGE_CARD"
    | "IMAGE_CARD_LARGE"
    | "COMPACT_CARD"
    | "PDF_CARD";
  mediaRatio: "SQUARE" | "LANDSCAPE" | "PORTRAIT";
};

const CONTENT_ENDPOINT = "/api/content/manager";
const HOME_SECTIONS_ENDPOINT = "/api/content/sectionTypes";

export async function getContentByReference(
  referenceId: string
): Promise<ContentItem> {
  const query = new URLSearchParams({ ref: referenceId });

  return apiClient<ContentItem>(
    `${CONTENT_ENDPOINT}?${query.toString()}`
  );
}

export async function saveContent(
  data: SaveContentInput
): Promise<SaveContentResponse> {
  return apiClient<SaveContentResponse>(CONTENT_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteContent(id: string): Promise<void> {
  const query = new URLSearchParams({ id });

  await apiClient<unknown>(`${CONTENT_ENDPOINT}?${query.toString()}`, {
    method: "DELETE",
  });
}

export async function getHomeSections(): Promise<HomeSection[]> {
   const res = await apiClient<HomeSection[]>(HOME_SECTIONS_ENDPOINT);
 
  return res;
}