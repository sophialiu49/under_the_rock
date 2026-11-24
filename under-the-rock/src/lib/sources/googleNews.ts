import { fetchFeed } from "./rss";

/** Google News RSS search: free, no key, covers most outlets. `when:Nd` limits to last N days. */
export function googleNews(query: string, days = 14) {
  const q = encodeURIComponent(`${query} when:${days}d`);
  return fetchFeed(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, {
    source: "Google News",
    sourceType: "news",
    useItemSource: true,
  });
}
