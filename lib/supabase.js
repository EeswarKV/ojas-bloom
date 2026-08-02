import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";

// Install the localStorage polyfill ONLY on web
if (Platform.OS === "web") {
  require("expo-sqlite/localStorage/install");
}

// Fallback values ensure the app works even when env vars aren't injected
// (anon key is safe to bundle — security is enforced by Supabase RLS policies)
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://ykxjcrbjxluiwomyrjeb.supabase.co";

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGpjcmJqeGx1aXdvbXlyamViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjUxNzMsImV4cCI6MjEwMTEwMTE3M30.6A1KlWdIriPPthWWCh5VsPCJcKIKP0YA_Pu4GubP37o";

const authStorage =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

