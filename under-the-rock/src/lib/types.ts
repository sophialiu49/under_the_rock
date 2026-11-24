export type SourceType = "news" | "agency" | "federal-register" | "court";

export type Article = {
  id: string;
  title: string;
  url: string;
  source: string; // e.g. "Reuters", "FTC", "Federal Register"
  sourceType: SourceType;
  publishedAt: string; // ISO date
  snippet: string; // raw blurb from the source
  summary?: string; // AI overview (if API key set)
  whyItMatters?: string;
  categories: string[]; // category ids it matched
  score: number; // relevance score
  alsoCoveredBy?: { source: string; url: string }[];
};

/** What every source fetcher returns before scoring. */
export type RawItem = Omit<Article, "categories" | "score">;
