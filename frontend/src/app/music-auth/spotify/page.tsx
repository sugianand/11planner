"use client";

import { useEffect } from "react";
// handles callback from Spotify OAuth and sends result back to the main app window via localStorage and postMessage, then closes itself
export default function SpotifyAuthCallbackPage() {
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
