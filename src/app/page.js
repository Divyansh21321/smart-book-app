// DASHBOARD PAGE (Home Route: /)
// This is the main page logged-in users see. It:
// 1. Fetches the user's bookmarks on load
// 2. Subscribes to real-time changes (so new bookmarks appear across tabs)
// 3. Lets users add and delete bookmarks
// 4. Lets users sign out
//
// This is a Client Component because it uses useState, useEffect, and event handlers.

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Dashboard() {
  const supabase = createClient();

  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // ───────────────────────────────────────────────
  // ON MOUNT: Get user, fetch bookmarks, subscribe to realtime
  // ───────────────────────────────────────────────
  useEffect(() => {
    // 1. Get the currently logged-in user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 2. Fetch this user's bookmarks from the database
        //    RLS ensures we only get OUR bookmarks even without a WHERE clause,
        //    but we add it for clarity.
        const { data, error } = await supabase
          .from("bookmarks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Failed to fetch bookmarks:", error.message);
        } else {
          setBookmarks(data || []);
        }
      }
      setLoading(false);
    };

    getUser();

    // 3. Subscribe to real-time changes on the bookmarks table.
    //    Supabase Realtime uses PostgreSQL's logical replication under the hood.
    //    Whenever a row is INSERTed or DELETEd, Supabase pushes the change
    //    to all connected clients via WebSocket.
    const channel = supabase
      .channel("bookmarks-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookmarks" },
        (payload) => {
          // A new bookmark was inserted — add it to the top of our list.
          setBookmarks((prev) => {
            // Avoid duplicates (in case we already added it optimistically)
            if (prev.some((b) => b.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookmarks" },
        (payload) => {
          // A bookmark was deleted — remove it from our list
          setBookmarks((prev) =>
            prev.filter((b) => b.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    // 4. Cleanup: unsubscribe when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ───────────────────────────────────────────────
  // ADD BOOKMARK
  // ───────────────────────────────────────────────
  const addBookmark = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    // Insert into Supabase and get the inserted row back with .select().
    // This way we update the UI immediately without relying on realtime.
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title: title.trim(),
        url: url.trim(),
        user_id: user.id,
      })
      .select();

    if (error) {
      console.error("Failed to add bookmark:", error.message);
      alert("Failed to add bookmark: " + error.message);
    } else {
      // Add the new bookmark to the top of the list immediately
      if (data && data.length > 0) {
        setBookmarks((prev) => {
          if (prev.some((b) => b.id === data[0].id)) return prev;
          return [data[0], ...prev];
        });
      }
      setTitle("");
      setUrl("");
    }
  };

  // ───────────────────────────────────────────────
  // DELETE BOOKMARK
  // ───────────────────────────────────────────────
  const deleteBookmark = async (id) => {
    // Remove from UI immediately (optimistic update)
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    // Then delete from Supabase. RLS ensures you can only delete YOUR bookmarks.
    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete bookmark:", error.message);
    }
  };

  // ───────────────────────────────────────────────
  // SIGN OUT
  // ───────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // ───────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">📑 My Bookmarks</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* ── ADD BOOKMARK FORM ── */}
        <form
          onSubmit={addBookmark}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add a Bookmark
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Title (e.g. React Docs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="url"
              placeholder="URL (e.g. https://react.dev)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </form>

        {/* ── BOOKMARK LIST ── */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No bookmarks yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add your first bookmark above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {bookmark.title}
                  </h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {bookmark.url}
                  </a>
                </div>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 cursor-pointer"
                  title="Delete bookmark"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
