import type { RawItem } from "../types";
import { cleanText, fetchWithTimeout, hashId, toISO } from "../util";

/** CourtListener (Free Law Project): federal court dockets & opinions. Free; token optional. */
export function buildCLUrl(query: string, days = 60) {
  const p = new URLSearchParams({ q: query, type: "r", order_by: "dateFiled desc" });
  p.set("filed_after", new Date(Date.now() - days * 864e5).toISOString().slice(0, 10));
  return `https://www.courtlistener.com/api/rest/v4/search/?${p}`;
}

export function parseCL(json: any): RawItem[] {
  return (json?.results ?? [])
    .map((r: any): RawItem | null => {
      const path = r.docket_absolute_url ?? r.absolute_url;
      const title = cleanText(r.caseName ?? r.case_name);
      if (!path || !title) return null;
      const url = path.startsWith("http") ? path : `https://www.courtlistener.com${path}`;
      const court = r.court ?? r.court_citation_string ?? "Federal court";
      const bits = [r.docketNumber && `Docket ${r.docketNumber}`, r.cause, r.suitNature].filter(Boolean);
      const firstDoc = r.recap_documents?.[0]?.snippet ?? r.snippet;
      return {
        id: hashId(url),
        title,
        url,
        source: `CourtListener · ${court}`,
        sourceType: "court",
        publishedAt: toISO(r.dateFiled ?? r.date_filed),
        snippet: cleanText([bits.join(" · "), firstDoc].filter(Boolean).join(". ")),
      };
    })
    .filter((x: RawItem | null): x is RawItem => x !== null);
}

export async function courtListener(query: string): Promise<RawItem[]> {
  const token = process.env.COURTLISTENER_TOKEN;
  const res = await fetchWithTimeout(buildCLUrl(query), token ? { headers: { Authorization: `Token ${token}` } } : {});
  if (!res.ok) throw new Error(`CourtListener ${res.status}`);
  return parseCL(await res.json());
}
