// AUTH CALLBACK ROUTE
// After Google redirects the user back to our app, they land here.
// Google sends a "code" in the URL. We exchange that code for a session
// (access token + refresh token) using Supabase's exchangeCodeForSession().
// Then we redirect the user to the dashboard (/).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      // Supabase isn't configured on the server — redirect to login so
      // the developer can set env vars. We don't throw so users see a friendly redirect.
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successfully logged in — go to dashboard
      return NextResponse.redirect(origin);
    }
  }

  // If something went wrong, redirect to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
