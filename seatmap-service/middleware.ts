import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", "user-1");
  requestHeaders.set("x-user-role", "ORGANIZER");
  requestHeaders.set("x-user-email", "organizer@ticket.vn");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};
