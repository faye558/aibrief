import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host === "toolr.kr" || host === "www.toolr.kr") {
    const url = req.nextUrl.clone();
    url.pathname = "/toolr";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
