// Creates a Supabase client for use in the BROWSER (Client Components).
// This is the simplest client — it just reads the public env vars.
// Used in components marked with "use client" for things like
// real-time subscriptions and client-side auth actions.

import { createBrowserClient } from "@supabase/ssr";

// Browser-side supabase client factory. If the env vars are missing or
// invalid during development, return a lightweight stub so the app doesn't
// crash — it will behave as if no user is signed in.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !(supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))) {
    // eslint-disable-next-line no-console
    console.warn(
      "Supabase client: missing or invalid NEXT_PUBLIC_SUPABASE_URL / ANON_KEY — returning stub client."
    );

    // Minimal stub with the methods our UI expects. These are no-ops
    // that prevent runtime crashes but won't provide real auth or Realtime.
    return {
      auth: {
        getUser: async () => ({ data: { user: null } }),
        signInWithOAuth: async () => ({ error: new Error("Supabase not configured") }),
        signOut: async () => ({}),
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({}) }),
        subscribe: () => ({}),
      }),
      from: () => ({
        select: async () => ({ data: [] }),
        insert: async () => ({}),
        delete: async () => ({}),
      }),
      removeChannel: () => {},
    };
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
