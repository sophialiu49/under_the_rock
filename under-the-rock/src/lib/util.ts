import { createHash } from "crypto";

export const hashId = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);

/** Strip HTML tags & entities, collapse whitespace. */
export function cleanText(s: unknown): string {
  if (s == null) return "";
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

/** First N sentences of a blurb (fallback "summary" when no AI key). */
export function firstSentences(s: string, n = 2, maxLen = 320): string {
  const parts = s.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [s];
  let out = parts.slice(0, n).join("").trim();
  if (out.length > maxLen) out = out.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  return out;
}

export function toISO(d: unknown): string {
  const t = d ? new Date(String(d)) : new Date();
  return isNaN(t.getTime()) ? new Date().toISOString() : t.toISOString();
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "User-Agent": "UnderTheRock/0.1 (personal news reader)", ...(init.headers ?? {}) },
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}
