import type { Article } from "./types";
import { firstSentences } from "./util";

type AIResult = { id: string; summary: string; why: string; relevant: boolean };

// Summaries are cached per article so each story is only summarized once per server run.
const memo = new Map<string, AIResult>();
const BATCH = 12;

export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function summarizeBatch(items: Article[], context: string): Promise<AIResult[]> {
  const payload = items.map((a) => ({ id: a.id, title: a.title, source: a.source, blurb: a.snippet.slice(0, 1200) }));
  const prompt = `You write a personal news digest called "Under the Rock" for a reader interested in: ${context}.

For each item below, return:
- "summary": a plain-English overview in 2-3 sentences (who did what, and what happens next). Use only facts in the title/blurb; do not invent details.
- "why": one short sentence on why it matters for someone following ${context}.
- "relevant": false only if the item clearly has nothing to do with ${context}.

Return ONLY a JSON array of objects with keys id, summary, why, relevant.

Items:
${JSON.stringify(payload, null, 1)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.SUMMARY_MODEL || "claude-haiku-5-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const textOut: string = data?.content?.map((c: any) => c.text ?? "").join("") ?? "";
  const json = textOut.slice(textOut.indexOf("["), textOut.lastIndexOf("]") + 1);
  return JSON.parse(json);
}

/**
 * Adds `summary` (+ `whyItMatters`) to each article.
 * With an API key: AI overview. Without: the first couple of sentences of the source's own blurb.
 * In feed mode, items the AI flags as irrelevant are dropped.
 */
export async function summarize(items: Article[], context: string, opts: { dropIrrelevant?: boolean } = {}): Promise<Article[]> {
  if (!aiEnabled()) {
    return items.map((a) => ({ ...a, summary: a.snippet ? firstSentences(a.snippet) : undefined }));
  }
  const todo = items.filter((a) => !memo.has(a.id));
  const batches: Article[][] = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  await Promise.all(
    batches.map(async (b) => {
      try {
        (await summarizeBatch(b, context)).forEach((r) => memo.set(r.id, r));
      } catch (e) {
        console.error("[summarize]", (e as Error).message);
      }
    })
  );
  return items
    .map((a) => {
      const r = memo.get(a.id);
      if (!r) return { ...a, summary: a.snippet ? firstSentences(a.snippet) : undefined };
      return { ...a, summary: r.summary, whyItMatters: r.why, _relevant: r.relevant } as Article & { _relevant?: boolean };
    })
    .filter((a: any) => !(opts.dropIrrelevant && a._relevant === false))
    .map(({ _relevant, ...a }: any) => a as Article);
}
