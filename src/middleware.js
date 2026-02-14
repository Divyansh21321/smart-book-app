// MIDDLEWARE
// This runs before EVERY request. Its job:
// 1. Refresh the Supabase session token if expired
// 2. Redirect unauthenticated users away from protected pages
// 3. Redirect authenticated users away from the login page
//
// The "matcher" at the bottom tells Next.js which routes this applies to.
// We exclude static files, images, and favicon.

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
