import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ddszcujvbvvihwsrkzsk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc3pjdWp2YnZ2aWh3c3JrenNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjIzNDYsImV4cCI6MjA4NTczODM0Nn0.HfSG1DHiGG3Riv_JVFvFBWJggy40tPS4iAavIDKjs1o";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

