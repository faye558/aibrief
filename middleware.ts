import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  if (host === "aibrief.toolr.kr" || host === "www.aibrief.toolr.kr") {
    if (pathname === "/privacy") {
      return NextResponse.redirect("https://toolr.kr/privacy", 301);
    }
    return NextResponse.redirect(
      `https://toolr.kr/aibrief${pathname}${req.nextUrl.search}`,
      301
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
