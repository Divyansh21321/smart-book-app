-- ===========================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- (Dashboard → SQL Editor → New Query → Paste & Run)
-- ===========================================

-- 1) Create the bookmarks table
create table public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  created_at timestamp with time zone default now() not null
);

-- 2) Enable Row Level Security (RLS)
--    This is what makes bookmarks PRIVATE to each user.
--    Without RLS, anyone with the anon key could read all bookmarks.
alter table public.bookmarks enable row level security;

-- 3) Policy: Users can only SELECT their own bookmarks
create policy "Users can view their own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- 4) Policy: Users can only INSERT bookmarks for themselves
create policy "Users can insert their own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- 5) Policy: Users can only DELETE their own bookmarks
create policy "Users can delete their own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- 6) Enable Realtime on the bookmarks table
--    This is what powers the "updates in real-time across tabs" feature.
alter publication supabase_realtime add table public.bookmarks;
