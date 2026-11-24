/**
 * Offline test: runs every parser + the full feed pipeline against saved sample responses.
 * Run with: npm test
 */
import { readFileSync } from "fs";
import { join } from "path";
import assert from "assert";
import { parseFeed } from "../src/lib/sources/rss";
import { parseFR } from "../src/lib/sources/federalRegister";
import { parseCL } from "../src/lib/sources/courtListener";

const fx = (f: string) => readFileSync(join(__dirname, "fixtures", f), "utf8");

// Serve fixtures instead of hitting the network
globalThis.fetch = (async (input: any) => {
  const url = String(input);
  const body = url.includes("news.google.com") ? fx("gnews.xml")
    : url.includes("justice.gov") ? fx("doj.xml")
    : url.includes("ftc.gov") ? fx("ftc.xml")
    : url.includes("federalregister.gov") ? fx("fr.json")
    : url.includes("courtlistener.com") ? fx("cl.json")
    : null;
  if (body == null) return new Response("not found", { status: 404 });
  return new Response(body, { status: 200 });
}) as typeof fetch;

async function main() {
  const g = parseFeed(fx("gnews.xml"), { source: "Google News", sourceType: "news", useItemSource: true });
  assert.equal(g.length, 4);
  assert.equal(g[0].source, "Reuters");
  assert.ok(!g[0].title.endsWith("- Reuters"), "publisher suffix stripped");
  console.log("✓ Google News parser");

  const d = parseFeed(fx("doj.xml"), { source: "DOJ", sourceType: "agency" });
  assert.ok(d.length > 0 && d[0].title && d[0].url.startsWith("https://"));
  console.log(`✓ DOJ parser (${d.length} items)`);

  const f = parseFeed(fx("ftc.xml"), { source: "FTC", sourceType: "agency" });
  assert.ok(f.length > 0);
  console.log(`✓ FTC parser (${f.length} items)`);

  const fr = parseFR(JSON.parse(fx("fr.json")));
  assert.equal(fr.length, 1, "routine NCRPA notice filtered out");
  assert.match(fr[0].source, /Proposed rule/);
  console.log("✓ Federal Register parser");

  const cl = parseCL(JSON.parse(fx("cl.json")));
  assert.equal(cl[0].url, "https://www.courtlistener.com/docket/123/acme-shippers-v-csx-transportation-inc/");
  console.log("✓ CourtListener parser");

  const { getFeed, search } = await import("../src/lib/pipeline");
  const feed = await getFeed(["antitrust", "regulation", "railroad"]);
  const titles = feed.articles.map((a) => a.title);
  assert.ok(!titles.some((t) => /croissant/i.test(t)), "irrelevant story filtered");
  const grocery = feed.articles.filter((a) => /grocery merger/i.test(a.title));
  assert.equal(grocery.length, 1, "duplicate stories merged");
  assert.equal(grocery[0].alsoCoveredBy?.length, 1);
  const rail = feed.articles.find((a) => /Union Pacific/.test(a.title));
  assert.ok(rail?.categories.includes("railroad"), "railroad subtopic tagged");
  assert.ok(feed.articles.find((a) => /CSX/.test(a.title))?.categories.includes("railroad"));
  assert.ok(feed.articles.find((a) => /Premerger/.test(a.title))?.categories.includes("antitrust"));
  assert.ok(feed.articles.every((a) => a.url && (a.summary || !a.snippet)), "every item has link + overview");
  console.log(`✓ Feed pipeline: ${feed.articles.length} relevant stories from ${feed.sources.length} source checks`);
  feed.articles.forEach((a) => console.log(`   [${a.categories.join(",")}] ${a.title}  (${a.source})`));

  const s = await search("croissant");
  assert.ok(s.articles.some((a) => /croissant/i.test(a.title)), "search ignores interest filters");
  console.log("✓ Free search is not limited to interests");

  console.log("\nAll tests passed.");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
