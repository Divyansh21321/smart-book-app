// Supabase client specifically for Next.js MIDDLEWARE.
// Middleware runs on the Edge before every request. It needs its own client
// because it accesses cookies differently (via request/response objects, not next/headers).
// This is used to refresh expired auth tokens automatically on every page load.

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  // Start with a basic "pass-through" response
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Defensive: if env vars are missing or invalid, skip Supabase in middleware.
  // This prevents a hard crash during local development when .env.local has placeholders.
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !(supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "Supabase middleware: skipping session update because NEXT_PUBLIC_SUPABASE_URL or ANON_KEY is missing/invalid. Set them in .env.local to enable auth in middleware."
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Set cookies on the request (for downstream server code)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Also set cookies on the response (so the browser gets them)
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // This is the key line — calling getUser() forces Supabase to refresh
  // the session token if it's expired. Without this, users would get
  // logged out randomly when their token expires.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is NOT logged in and they're trying to access the dashboard,
  // redirect them to the login page
  if (!user && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If user IS logged in and they're on the login page,
  // redirect them to the dashboard
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
