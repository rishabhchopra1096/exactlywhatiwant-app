// CREATED: Middleware for authentication redirects
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // This is a simplified middleware for demonstration purposes
  // In a real app, we would verify the session/token here

  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login";

  // Get authentication status from cookie (this would be a proper session check in production)
  const isAuthenticated = request.cookies.has("authStatus");

  // Redirect logic
  if (isPublicPath && isAuthenticated) {
    // Redirect to dashboard if already logged in and trying to access public paths
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicPath && !isAuthenticated && path !== "/") {
    // Redirect to login if not authenticated and trying to access protected paths
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
