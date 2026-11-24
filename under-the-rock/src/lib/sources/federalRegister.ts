import type { RawItem } from "../types";
import { cleanText, fetchWithTimeout, hashId, toISO } from "../util";

const BASE = "https://www.federalregister.gov/api/v1/documents.json";
const FIELDS = ["title", "abstract", "html_url", "publication_date", "agencies", "type", "document_number"];

// Routine filings that flood the feed without being newsworthy
const NOISE = [/^notice pursuant to the national cooperative research/i, /^sunshine act meeting/i, /^agency information collection/i];

export type FRQuery = { term?: string; agencies?: string[]; significantOnly?: boolean; days?: number; perPage?: number };

export function buildFRUrl(q: FRQuery): string {
  const p = new URLSearchParams();
  p.set("order", "newest");
  p.set("per_page", String(q.perPage ?? 20));
  FIELDS.forEach((f) => p.append("fields[]", f));
  if (q.term) p.set("conditions[term]", q.term);
  q.agencies?.forEach((a) => p.append("conditions[agencies][]", a));
  if (q.significantOnly) {
    p.set("conditions[significant]", "1");
    ["RULE", "PRORULE"].forEach((t) => p.append("conditions[type][]", t));
  }
  const since = new Date(Date.now() - (q.days ?? 30) * 864e5).toISOString().slice(0, 10);
  p.set("conditions[publication_date][gte]", since);
  return `${BASE}?${p.toString()}`;
}

const TYPE_LABEL: Record<string, string> = { Rule: "Final rule", "Proposed Rule": "Proposed rule", Notice: "Notice", "Presidential Document": "Presidential doc" };

export function parseFR(json: any): RawItem[] {
  return (json?.results ?? [])
    .filter((d: any) => d?.title && d?.html_url && !NOISE.some((r) => r.test(d.title)))
    .map((d: any): RawItem => {
      const agency = d.agencies?.map((a: any) => a.name).filter(Boolean)[0];
      const label = TYPE_LABEL[d.type] ?? d.type;
      return {
        id: hashId(d.html_url),
        title: cleanText(d.title),
        url: d.html_url,
        source: ["Federal Register", agency, label].filter(Boolean).join(" · "),
        sourceType: "federal-register",
        publishedAt: toISO(d.publication_date),
        snippet: cleanText(d.abstract),
      };
    });
}

export async function federalRegister(q: FRQuery): Promise<RawItem[]> {
  const res = await fetchWithTimeout(buildFRUrl(q));
  if (!res.ok) throw new Error(`Federal Register ${res.status}`);
  return parseFR(await res.json());
}
