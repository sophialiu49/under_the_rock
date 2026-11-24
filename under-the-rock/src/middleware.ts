import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional password lock. If APP_PASSWORD is set (e.g. in Vercel's settings), the browser asks
 * for it once before showing the app. This stops strangers from using up your AI summary credits.
 * Username can be anything; only the password is checked.
 */
export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return NextResponse.next();
  }
  return new NextResponse("Password required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="under the rock"' },
  });
}

export const config = { matcher: ["/((?!manifest.json|icon.svg).*)"] };
