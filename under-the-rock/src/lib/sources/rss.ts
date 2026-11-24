import { XMLParser } from "fast-xml-parser";
import type { RawItem, SourceType } from "../types";
import { cleanText, fetchWithTimeout, hashId, toISO } from "../util";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

const text = (v: any): string => (v == null ? "" : typeof v === "object" ? v["#text"] ?? "" : String(v));

/** Parse an RSS 2.0 or Atom document into RawItems. Exported separately so it can be tested offline. */
export function parseFeed(xml: string, opts: { source: string; sourceType: SourceType; useItemSource?: boolean }): RawItem[] {
  const doc = parser.parse(xml);
  const rssItems = doc?.rss?.channel?.item;
  const atomItems = doc?.feed?.entry;
  const items: any[] = [rssItems ?? atomItems ?? []].flat();

  return items
    .map((it): RawItem | null => {
      const link = typeof it.link === "object" ? it.link["@_href"] ?? text(it.link) : text(it.link);
      let title = cleanText(text(it.title));
      if (!title || !link) return null;
      let source = opts.source;
      // Google News puts the publisher in <source> and appends " - Publisher" to titles
      if (opts.useItemSource && it.source) {
        source = cleanText(text(it.source)) || source;
        const suffix = ` - ${source}`;
        if (title.endsWith(suffix)) title = title.slice(0, -suffix.length);
      }
      const snippetRaw = cleanText(text(it.description ?? it.summary ?? it.content));
      // Google News descriptions are just the title + publisher again; drop if redundant
      const snippet = snippetRaw.startsWith(title) || snippetRaw.length < 40 ? "" : snippetRaw;
      return {
        id: hashId(link),
        title,
        url: link,
        source,
        sourceType: opts.sourceType,
        publishedAt: toISO(it.pubDate ?? it.published ?? it.updated ?? it["dc:date"]),
        snippet,
      };
    })
    .filter((x): x is RawItem => x !== null);
}

export async function fetchFeed(url: string, opts: Parameters<typeof parseFeed>[1]): Promise<RawItem[]> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`${opts.source} feed ${res.status}`);
  return parseFeed(await res.text(), opts);
}
