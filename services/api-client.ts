export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    : "";


export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      ...(options.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      result?.error?.code ?? "UNKNOWN_ERROR",
      result?.error?.message ?? "Something went wrong",
      response.status,
    );
  }

  return result.data;
}