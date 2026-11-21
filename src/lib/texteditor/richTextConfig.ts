export const TEXT_COLORS = {
  gold: "#C9A227",
  maroon: "#7A1F2B",
  green: "#2E7D32",
  blue: "#1E4E8C",
} as const;

export const TEXT_SIZES = {
  small: "0.875em",
  large: "1.125em",
} as const;

export const HEADING_LEVELS = [1, 2, 3, 4] as const;

export type TextColor = keyof typeof TEXT_COLORS;
export type TextSize = keyof typeof TEXT_SIZES;
export type HeadingLevel = (typeof HEADING_LEVELS)[number];