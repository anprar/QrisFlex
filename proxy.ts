import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const isEmbeddable = request.nextUrl.pathname.startsWith("/widget/") || request.nextUrl.pathname.startsWith("/api/widget/");

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    isEmbeddable ? "frame-ancestors *;" : "frame-ancestors 'self'; upgrade-insecure-requests;",
  );

  if (isEmbeddable) {
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|ico)$).*)"],
};
