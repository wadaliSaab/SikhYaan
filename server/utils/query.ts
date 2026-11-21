export const num = (v: string | null) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const text = (v: string | null) => v?.trim().slice(0, 100) || undefined;


export function oneOf<T extends string>(v: string | null, allowed: readonly T[]) {
  return allowed.includes(v as T) ? (v as T) : undefined;
}