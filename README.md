# Smart Bookmark App

Live demo: https://smart-book-app-one.vercel.app/

Small Next.js (App Router) bookmark manager that uses Supabase for Google-only authentication, per-user private bookmarks, and realtime cross-tab sync. Built with Tailwind CSS.

## Features
- Google OAuth sign-in (no email/password)
- Add, list, and delete bookmarks (private per-user via RLS)
- Realtime updates across browser tabs using Supabase Realtime
- Simple, mobile-friendly UI with Tailwind

## Tech stack
- Next.js (App Router)
- Supabase (Auth, Postgres, Realtime)
- Tailwind CSS

## Quickstart (local)
Prerequisites: Node.js (18+), npm/yarn/pnpm, a Supabase project with a Google OAuth provider configured.

1. Clone the repo:

```bash
git clone https://github.com/Divyansh21321/smart-book-app.git
cd smart-book-app
npm install
```

2. Create `.env.local` in the project root and add your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key...
```

3. Run the app:

```bash
npm run dev
# open http://localhost:3000
```

4. Sign in with Google from the `/login` page. The app redirects to `/auth/callback` during the OAuth flow.

## Supabase Database setup
Run the SQL in `supabase-schema.sql` (Supabase SQL editor) to create the `bookmarks` table, enable Row-Level Security (RLS), and add policies. The file includes realtime configuration. The table schema expects bookmarks to be scoped to `auth.uid()`.

File: `supabase-schema.sql`

Important: after running the SQL, enable the Google provider in your Supabase project's Authentication settings and set the correct Redirect URLs (see below).

## Google OAuth (required)
1. In Google Cloud Console, create OAuth 2.0 credentials (Web application).
2. Add these Authorized redirect URIs to the OAuth client:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://smart-book-app-one.vercel.app/auth/callback` (production)
3. In Supabase → Authentication → Settings → External OAuth Providers, enable Google and paste the client ID & secret.


## Troubleshooting
- Invalid Supabase URL / missing env: If you see an "Invalid supabaseUrl" error, confirm `NEXT_PUBLIC_SUPABASE_URL` is set and starts with `https://`.
- Stale `.next` lock or Node processes (Windows PowerShell):

## Notable files
- `supabase-schema.sql` — DB schema, RLS, policies, realtime setup
- `src/lib/supabase/client.js` — browser Supabase client
- `src/lib/supabase/server.js` — server-side Supabase helper
- `src/app/login/page.js` — Google sign-in page
- `src/app/page.js` — main dashboard (add/list/delete bookmarks)

## Next steps you should do after cloning
1. Run the SQL in the Supabase SQL editor.
2. Configure Google OAuth (Google Cloud & Supabase).
