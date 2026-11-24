import type { Category } from "@/config/categories";
import type { Article, RawItem } from "./types";

const STRONG = 3;
const RELATED = 1;
const THRESHOLD = 3; // one strong keyword, or three related ones
const ORIGIN_BOOST = 2; // item came from a source we queried *for* this category

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const regexCache = new Map<string, RegExp>();
const wordRe = (k: string) => {
  if (!regexCache.has(k)) regexCache.set(k, new RegExp(`\\b${escape(k)}\\b`, "i"));
  return regexCache.get(k)!;
};

export function scoreFor(text: string, cat: Category): number {
  let s = 0;
  for (const k of cat.keywords.strong) if (wordRe(k).test(text)) s += STRONG;
  for (const k of cat.keywords.related) if (wordRe(k).test(text)) s += RELATED;
  return s;
}

/** Tag an item with every category it's relevant to. `origins` = categories whose queries surfaced it. */
export function classify(item: RawItem, cats: Category[], origins: string[] = []): Article {
  // source is included so labels like "FTC" or "Final rule" count too
  const text = `${item.title} | ${item.snippet} | ${item.source}`;
  const matched: string[] = [];
  let best = 0;
  for (const c of cats) {
    const s = scoreFor(text, c) + (origins.includes(c.id) ? ORIGIN_BOOST : 0);
    if (s >= THRESHOLD) {
      matched.push(c.id);
      best = Math.max(best, s);
    }
  }
  return { ...item, categories: matched, score: best };
}

/** Word-set similarity between two titles (0–1), for de-duplicating the same story from many outlets. */
function similarity(a: string, b: string) {
  const toks = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
  const A = toks(a), B = toks(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => B.has(w) && inter++);
  return inter / Math.min(A.size, B.size);
}

const SOURCE_RANK: Record<string, number> = { agency: 0, "federal-register": 1, court: 2, news: 3 };

/** Merge near-duplicate stories; primary sources win, others go into `alsoCoveredBy`. */
export function dedupe(items: Article[]): Article[] {
  const sorted = [...items].sort((a, b) => SOURCE_RANK[a.sourceType] - SOURCE_RANK[b.sourceType]);
  const out: Article[] = [];
  for (const it of sorted) {
    const dup = out.find((o) => o.url === it.url || similarity(o.title, it.title) >= 0.7);
    if (dup) {
      if (dup.url !== it.url) (dup.alsoCoveredBy ??= []).push({ source: it.source, url: it.url });
      dup.categories = [...new Set([...dup.categories, ...it.categories])];
      dup.score = Math.max(dup.score, it.score);
      if (!dup.snippet && it.snippet) dup.snippet = it.snippet;
    } else out.push({ ...it });
  }
  return out;
}
