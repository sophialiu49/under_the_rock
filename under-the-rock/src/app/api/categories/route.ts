import { NextResponse } from "next/server";
import { CATEGORIES } from "@/config/categories";

export async function GET() {
  return NextResponse.json(
    CATEGORIES.map(({ id, label, emoji, parentId, defaultEnabled }) => ({ id, label, emoji, parentId, defaultEnabled }))
  );
}
