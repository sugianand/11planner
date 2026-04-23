"use client";

// Spotify OAuth callback page — receives the authorization code from Spotify,
// stores it in localStorage, posts it back to the opener window, then closes.

import { useEffect } from "react";

export default function SpotifyAuthCallbackPage() {
  // Extract OAuth params from the URL, persist the result, notify the opener window, and close
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || undefined;
    const state = params.get("state") || undefined;
    const error = params.get("error") || undefined;
    const payload = {
      source: "music-oauth-callback",
      provider: "spotify",
      code,
      state,
      error,
    };

    localStorage.setItem("spotify_oauth_result", JSON.stringify(payload));

    if (window.opener) {
      window.opener.postMessage(
        payload,
        window.location.origin
      );
    }

    window.close();
  }, []);

  // Fallback UI shown briefly while the window auto-closes
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-center dark:bg-slate-950">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Connecting Spotify</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          You can close this window if it does not close automatically.
        </p>
      </div>
    </main>
  );
}
