"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type CallbackState = {
  loading: boolean;
  error: string;
};

type ProfileRow = {
  id: string;
  firstname: string | null;
  lastname: string | null;
  worktime?: string | null;
  workdays?: string[] | null;
  workstyle?: string | null;
  assignmentplan?: string | null;
  daily_study_limit?: number | null;
};

function splitDisplayName(name: string): { first: string | null; last: string | null } {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { first: null, last: null };
  }
  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return { first: parts[0], last: null };
  }
  return {
    first: parts[0],
    last: parts.slice(1).join(" "),
  };
}

function getGoogleNames(metadata: Record<string, unknown> | undefined): { first: string | null; last: string | null } {
  const given = typeof metadata?.given_name === "string" ? metadata.given_name : null;
  const family = typeof metadata?.family_name === "string" ? metadata.family_name : null;
  const firstFromCustom = typeof metadata?.firstname === "string" ? metadata.firstname : null;
  const lastFromCustom = typeof metadata?.lastname === "string" ? metadata.lastname : null;
  const displayName =
    (typeof metadata?.full_name === "string" && metadata.full_name) ||
    (typeof metadata?.name === "string" && metadata.name) ||
    "";
  const split = splitDisplayName(displayName);

  return {
    first: given || firstFromCustom || split.first,
    last: family || lastFromCustom || split.last,
  };
}

function needsPreferenceOnboarding(profile: ProfileRow | null): boolean {
  if (!profile) {
    return true;
  }
  return !(
    profile.worktime &&
    Array.isArray(profile.workdays) &&
    profile.workdays.length > 0 &&
    profile.workstyle &&
    profile.assignmentplan &&
    profile.daily_study_limit !== null &&
    profile.daily_study_limit !== undefined
  );
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState<CallbackState>({ loading: true, error: "" });

  useEffect(() => {
    async function syncProfileAndDecideRoute(userId: string, metadata?: Record<string, unknown>): Promise<string> {
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("id, firstname, lastname, worktime, workdays, workstyle, assignmentplan, daily_study_limit")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      if (profileFetchError) {
        throw new Error(profileFetchError.message);
      }

      const names = getGoogleNames(metadata);
      const sendToOnboarding = needsPreferenceOnboarding(existingProfile ?? null);

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            firstname: existingProfile?.firstname ?? names.first ?? null,
            lastname: existingProfile?.lastname ?? names.last ?? null,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        throw new Error(profileError.message);
      }

      return sendToOnboarding ? "/profile/quiz?onboarding=1" : "/dashboard";
    }

    async function handleOAuthCallback() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");

      if (oauthError) {
        setState({ loading: false, error: decodeURIComponent(oauthError) });
        return;
      }

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setState({ loading: false, error: error.message });
          return;
        }

        const user = data.session?.user;
        if (user) {
          const metadata = user.user_metadata as Record<string, unknown> | undefined;
          const route = await syncProfileAndDecideRoute(user.id, metadata);
          router.replace(route);
          return;
        }

        router.replace("/dashboard");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const metadata = session.user.user_metadata as Record<string, unknown> | undefined;
        const route = await syncProfileAndDecideRoute(session.user.id, metadata);
        router.replace(route);
        return;
      }

      setState({
        loading: false,
        error: "Missing OAuth code. Start from Login/Register and verify redirect URL is /auth/callback.",
      });
    }

    void handleOAuthCallback();
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Signing you in...</h1>
        {state.loading ? (
          <p className="mt-3 text-slate-600 dark:text-slate-300">Completing Google authentication.</p>
        ) : (
          <p className="mt-3 text-rose-600 dark:text-rose-300">{state.error || "Authentication failed."}</p>
        )}
      </div>
    </main>
  );
}
