import type { SectionTypeKey  } from "../config/section-types";

export type BlockType = "TEXT" | "IMAGE" | "PDF" | "GALLERY";

export type Media = { id: string; url: string; fileName?: string };

export type EditorBlock = {
  id: string; 
  type: BlockType;
  title: string;
  content: string; 
  media: Media | null; 
  gallery: Media[]; 
};

export type ChildItem = {
  id: string;
  title: string;
  referenceId: string;
  isActive: boolean;
};

export type HomePlacement = { type: SectionTypeKey; sortOrder: number };

export type HomeSectionOption = {
  id: string;
  layout: string;
  itemVariant: string;
  mediaRatio: string;
};

export type EditorState = {
  id?: string;
  referenceId: string;
  title: string;
  summary: string;
  parent: { id: string; title: string; referenceId: string } | null;
  isActive: boolean;
  hero: Media | null;
  heroRatio?: string | null; 
  blocks: EditorBlock[];
  children: ChildItem[];
  home: HomePlacement | null;
};

export type BlockActions = {
  add: (type: BlockType) => void;
  remove: (id: string) => void;
  move: (id: string, direction: -1 | 1) => void;
  setTitle: (id: string, title: string) => void; 
  setMedia: (id: string, file: File) => void;
  addGallery: (id: string, files: File[]) => void;
  removeGalleryImage: (id: string, mediaId: string) => void;
};



export type MediaDto = { id: string; url: string; fileName: string };

export type ContentDto = {
  id: string;
  referenceId: string;
  title: string;
  summary: string | null;
  isActive: boolean;
  parent: { id: string; title: string; referenceId: string } | null; 
   heroRatio?: string | null;
  heroMedia: MediaDto | null;
  children: ChildItem[];
  blocks: {
    id: string;
    type: BlockType;
    title: string | null;
    content: string | null;
    media: MediaDto | null;
    galleryItems: { media: MediaDto }[];
  }[];
  homeSections: {
    homeSectionId: string;
    sortOrder: number;
    homeSection: { layout: string; itemVariant: string; mediaRatio: string  };
  }[];
};