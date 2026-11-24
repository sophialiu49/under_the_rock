import { NextResponse } from "next/server";
import { CATEGORIES } from "@/config/categories";
import { getFeed } from "@/lib/pipeline";
import { aiEnabled } from "@/lib/summarize";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds; gives sources + AI summaries time to finish when hosted

// GET /api/feed?categories=antitrust,railroad
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("categories");
  const ids = param ? param.split(",").filter(Boolean) : CATEGORIES.filter((c) => c.defaultEnabled).map((c) => c.id);
  const data = await getFeed(ids);
  return NextResponse.json({ ...data, aiSummaries: aiEnabled(), fetchedAt: new Date().toISOString() });
}
