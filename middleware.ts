import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  if (host === "toolr.kr" || host === "www.toolr.kr") {
    const url = req.nextUrl.clone();
    if (pathname === "/privacy") url.pathname = "/toolr-privacy";
    else if (pathname.startsWith("/ads.txt") || pathname.startsWith("/.well-known")) return NextResponse.next();
    else url.pathname = "/toolr";
    return NextResponse.rewrite(url);
  }

  // aibrief.toolr.kr/privacy → toolr.kr/privacy
  if ((host === "aibrief.toolr.kr") && pathname === "/privacy") {
    return NextResponse.redirect("https://toolr.kr/privacy");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
