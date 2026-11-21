import type { pagination } from "@/server/utils/pagination";


export type Pagination = ReturnType<typeof pagination>;

export type Paginated<T> = { items: T[]; pagination: Pagination };

export type MediaUrl = { id: string; fileName?: string; url?: string } | null;

