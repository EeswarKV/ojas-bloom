import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

// Set these in a .env file (see .env.example) — never commit real keys.
// EXPO_PUBLIC_ vars are safe to expose client-side; the key is protected
// by the RLS policies in schema.sql. In newer Supabase dashboards this is
// called the "Publishable" key (API Settings → API Keys tab).
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to .env and fill in your Supabase project values."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
