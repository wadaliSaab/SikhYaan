export const SECTION_TYPES = {
  ARTICLE:        { label: "Article Text",   layout: "LIST",    itemVariant: "COMPACT_CARD",     mediaRatio: "LANDSCAPE", ratio: null,  single: true },
  NOTICE:         { label: "Notice",         layout: "LIST",    itemVariant: "COMPACT_CARD",     mediaRatio: "SQUARE",    ratio: null,  single: true },
  FEATURE:        { label: "Feature",        layout: "FEATURE", itemVariant: "IMAGE_CARD_LARGE", mediaRatio: "LANDSCAPE", ratio: "16:9", single: false },
  PORTRAIT_SMALL: { label: "Portrait Small", layout: "GRID",    itemVariant: "IMAGE_CARD",       mediaRatio: "PORTRAIT",  ratio: "3:4",  single: false },
  PORTRAIT_LARGE: { label: "Portrait Large", layout: "GRID",    itemVariant: "IMAGE_CARD_LARGE", mediaRatio: "PORTRAIT",  ratio: "4:5",  single: false },
  LANDSCAPE:      { label: "Landscape",      layout: "GRID",    itemVariant: "IMAGE_CARD_LARGE", mediaRatio: "LANDSCAPE", ratio: "16:9", single: false },
  BOOK_SHELF:     { label: "Book Shelf",     layout: "LIST",    itemVariant: "PDF_CARD",         mediaRatio: "PORTRAIT",  ratio: "3:4",  single: false },
} as const;

export type SectionTypeKey = keyof typeof SECTION_TYPES;

type Combo = { layout: string; itemVariant: string; mediaRatio: string };

const keys = Object.keys(SECTION_TYPES) as SectionTypeKey[];


export const typeOf = (c: Combo) =>
  keys.find((k) => SECTION_TYPES[k].layout === c.layout && SECTION_TYPES[k].itemVariant === c.itemVariant && SECTION_TYPES[k].mediaRatio === c.mediaRatio);


