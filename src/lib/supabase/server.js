// Creates a Supabase client for use on the SERVER (Server Components, Route Handlers, Server Actions).
// Unlike the browser client, this one needs to read/write cookies so Supabase
// can track the user's session across requests. We use Next.js cookies() for that.
// The @supabase/ssr package handles all the cookie plumbing for us.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !(supabaseUrl.startsWith("http://") || supabaseUrl.startsWith("https://"))) {
    // eslint-disable-next-line no-console
    console.warn("Supabase server client: missing or invalid env vars. Returning null.");
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method is called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}
