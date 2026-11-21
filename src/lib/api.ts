type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
};

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const result: ApiResponse<T> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.error?.message ??
        result.message ??
        "Something went wrong"
    );
  }

  return result.data;
}

export const api = {
  get<T>(url: string) {
    return request<T>(url);
  },

  post<T>(url: string, body?: unknown) {
    return request<T>(url, {
      method: "POST",
      body: body !== undefined
        ? JSON.stringify(body)
        : undefined,
    });
  },

  delete<T>(url: string) {
    return request<T>(url, {
      method: "DELETE",
    });
  },
};