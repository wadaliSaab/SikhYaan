export const SUMMARY_MAX = 600;
export const SUMMARY_MAX_LINES = 7;

const strip = (html: string) => html.replace(/<[^>]*>/g, "");


export const textLength = (html: string) => strip(html).replace(/&#?\w+;/g, "_").length;


export const lineCount = (html: string) =>
  html.match(/<(?:p|h[1-6])[\s>]|<br/g)?.length ?? 0;


export function clipSummary(html: string) {
  if (textLength(html) <= SUMMARY_MAX) return html;
  const text = strip(html.replace(/<\/p>|<\/li>|<br\s*\/?>/g, " "));
  return `${text.slice(0, SUMMARY_MAX).trim()}…`;
}