// Creates a Supabase client for use in the BROWSER (Client Components).
// This is the simplest client — it just reads the public env vars.
// Used in components marked with "use client" for things like
// real-time subscriptions and client-side auth actions.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
