export type PaginationInput = { page?: number; limit?: number };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function getPage(input: PaginationInput = {}) {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Math.floor(input.limit ?? DEFAULT_LIMIT)),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function pagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}