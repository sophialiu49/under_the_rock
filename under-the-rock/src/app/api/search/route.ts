import { NextResponse } from "next/server";
import { search } from "@/lib/pipeline";
import { aiEnabled } from "@/lib/summarize";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/search?q=railroad+merger
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 200);
  if (!q) return NextResponse.json({ articles: [], sources: [] });
  const data = await search(q);
  return NextResponse.json({ ...data, aiSummaries: aiEnabled() });
}
