import { EMPTY_FOR_BETA, PLACEHOLDER } from "@/lib/content/site-config";

export function isPlaceholder(value: string): boolean {
  return value === PLACEHOLDER;
}

export function isEmptyForBeta(value: string): boolean {
  return value === EMPTY_FOR_BETA;
}

/** Never render a link for a placeholder value. */
export function safeHref(value: string): string | undefined {
  if (isPlaceholder(value) || value.length === 0) return undefined;
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return undefined;
}
