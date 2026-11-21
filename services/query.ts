type Param = string | number | boolean | null | undefined;

export function qs(params: Record<string, Param>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    query.set(key, value === true ? "1" : String(value));
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}