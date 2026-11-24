import { CATEGORIES, type Category } from "@/config/categories";
import { cached } from "./cache";
import { classify, dedupe } from "./relevance";
import { dojPress, ftcPress } from "./sources/agencies";
import { courtListener } from "./sources/courtListener";
import { federalRegister } from "./sources/federalRegister";
import { googleNews } from "./sources/googleNews";
import { summarize } from "./summarize";
import type { Article, RawItem } from "./types";

const FEED_TTL = 30 * 60 * 1000; // re-fetch sources at most every 30 min
const SEARCH_TTL = 10 * 60 * 1000;

type Job = { name: string; origin?: string; run: () => Promise<RawItem[]> };
export type SourceStatus = { name: string; ok: boolean; count: number; error?: string };

/** Every fetch a set of categories needs. Each source fails independently. */
function jobsFor(cats: Category[]): Job[] {
  const jobs: Job[] = [
    { name: "FTC press releases", run: ftcPress },
    { name: "DOJ press releases", run: dojPress },
  ];
  for (const c of cats) {
    c.newsQueries.forEach((q) => jobs.push({ name: `News: ${q}`, origin: c.id, run: () => googleNews(q) }));
    const fr = c.federalRegister;
    if (fr) {
      fr.terms?.forEach((t) => jobs.push({ name: `Federal Register: "${t}"`, origin: c.id, run: () => federalRegister({ term: t }) }));
      if (fr.agencies?.length)
        jobs.push({ name: `Federal Register: ${fr.agencies.join(", ")}`, origin: c.id, run: () => federalRegister({ agencies: fr.agencies }) });
      if (fr.significantOnly)
        jobs.push({ name: "Federal Register: significant rules", origin: c.id, run: () => federalRegister({ significantOnly: true }) });
    }
    c.courtQueries?.forEach((q) => jobs.push({ name: `Courts: ${q}`, origin: c.id, run: () => courtListener(q) }));
  }
  return jobs;
}

async function runJobs(jobs: Job[]) {
  const status: SourceStatus[] = [];
  const results = await Promise.all(
    jobs.map(async (j) => {
      try {
        const items = await cached(`job:${j.name}`, FEED_TTL, j.run);
        status.push({ name: j.name, ok: true, count: items.length });
        return items.map((item) => ({ item, origin: j.origin }));
      } catch (e) {
        status.push({ name: j.name, ok: false, count: 0, error: (e as Error).message });
        return [];
      }
    })
  );
  return { found: results.flat(), status };
}

export async function getFeed(categoryIds: string[]) {
  const cats = CATEGORIES.filter((c) => categoryIds.includes(c.id));
  if (!cats.length) return { articles: [] as Article[], sources: [] as SourceStatus[] };

  const { found, status } = await runJobs(jobsFor(cats));

  // Collect which categories' queries surfaced each item, then score.
  const origins = new Map<string, { item: RawItem; origins: string[] }>();
  for (const { item, origin } of found) {
    const e = origins.get(item.id) ?? { item, origins: [] };
    if (origin) e.origins.push(origin);
    origins.set(item.id, e);
  }
  const scored = [...origins.values()].map(({ item, origins }) => classify(item, cats, origins)).filter((a) => a.categories.length);

  const fresh = dedupe(scored)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 60);

  const context = cats.map((c) => c.label).join(", ");
  const articles = await summarize(fresh, context, { dropIrrelevant: true });
  return { articles, sources: status.sort((a, b) => a.name.localeCompare(b.name)) };
}

/** Free search: ignores interest categories entirely. */
export async function search(q: string) {
  return cached(`search:${q.toLowerCase()}`, SEARCH_TTL, async () => {
    const { found, status } = await runJobs([
      { name: `News: ${q}`, run: () => googleNews(q, 30) },
      { name: `Federal Register: ${q}`, run: () => federalRegister({ term: q, days: 90 }) },
    ]);
    const items: Article[] = found.map(({ item }) => ({ ...item, categories: [], score: 0 }));
    const fresh = dedupe(items)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 30);
    return { articles: await summarize(fresh, q), sources: status };
  });
}
